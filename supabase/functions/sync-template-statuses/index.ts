// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MetaTemplate {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  category: string;
  components: any[];
}

async function fetchTemplatesFromMeta(accessToken: string, wabaId: string): Promise<MetaTemplate[]> {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=id,name,status,language,category,components&limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching templates from Meta:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumberId, workspaceId } = await req.json();
    
    if (!phoneNumberId || !workspaceId) {
      return new Response(JSON.stringify({ error: 'phoneNumberId and workspaceId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get phone number and WABA details
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('waba_ref')
      .eq('id', phoneNumberId)
      .eq('workspace_id', workspaceId)
      .single();

    if (phoneError || !phoneNumber) {
      throw new Error('Phone number not found');
    }

    // Get WABA access token
    const { data: waba, error: wabaError } = await supabase
      .from('wabas')
      .select('access_token, waba_id')
      .eq('id', phoneNumber.waba_ref)
      .single();

    if (wabaError || !waba) {
      throw new Error('WABA not found');
    }

    // Fetch templates from Meta API
    const metaTemplates = await fetchTemplatesFromMeta(waba.access_token, waba.waba_id);

    // Get existing templates from our database
    const { data: existingTemplates } = await supabase
      .from('message_templates')
      .select('id, name, waba_id')
      .eq('workspace_id', workspaceId)
      .eq('waba_id', waba.waba_id);

    const templateMap = new Map(existingTemplates?.map(t => [t.name, t]) || []);
    
    let syncedCount = 0;
    let newCount = 0;

    // Process each Meta template
    for (const metaTemplate of metaTemplates) {
      const existingTemplate = templateMap.get(metaTemplate.name);
      
      if (existingTemplate) {
        // Update existing template status
        await supabase
          .from('template_statuses')
          .upsert({
            template_id: existingTemplate.id,
            phone_number_ref: phoneNumberId,
            status: metaTemplate.status,
            review_reason: metaTemplate.status === 'REJECTED' ? 'Rejected by Meta' : null,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'template_id,phone_number_ref'
          });
        syncedCount++;
      } else {
        // Create new template
        const { data: newTemplate } = await supabase
          .from('message_templates')
          .insert({
            workspace_id: workspaceId,
            name: metaTemplate.name,
            language: metaTemplate.language,
            category: metaTemplate.category,
            components_schema: metaTemplate.components,
            waba_id: waba.waba_id,
            status: metaTemplate.status
          })
          .select('id')
          .single();

        if (newTemplate) {
          // Create status entry
          await supabase
            .from('template_statuses')
            .insert({
              template_id: newTemplate.id,
              phone_number_ref: phoneNumberId,
              status: metaTemplate.status,
              synced_at: new Date().toISOString()
            });
          newCount++;
        }
      }
    }

    // Send notification about sync results
    await fetch(`${supabaseUrl}/functions/v1/notify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'template_sync',
        workspaceId: workspaceId,
        title: 'Sincronização de templates concluída',
        message: `${syncedCount} templates atualizados, ${newCount} novos templates importados`,
        metadata: { 
          phoneNumberId,
          syncedCount,
          newCount,
          totalTemplates: metaTemplates.length
        }
      })
    });

    return new Response(JSON.stringify({
      success: true,
      syncedCount,
      newCount,
      totalTemplates: metaTemplates.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Template sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});