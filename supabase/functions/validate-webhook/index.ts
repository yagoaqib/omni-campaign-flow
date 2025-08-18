// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function testWebhookConfiguration(accessToken: string, phoneNumberId: string): Promise<{
  webhookConfigured: boolean;
  canReceiveMessages: boolean;
  error?: string;
}> {
  try {
    // Test if we can access the phone number
    const phoneResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name,status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!phoneResponse.ok) {
      return {
        webhookConfigured: false,
        canReceiveMessages: false,
        error: 'Não foi possível acessar o número de telefone'
      };
    }

    // Try to get webhook fields (this is a proxy test)
    const webhookResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/webhook_fields`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // If we can access webhook fields, webhook is likely configured
    const webhookConfigured = webhookResponse.ok;

    return {
      webhookConfigured,
      canReceiveMessages: webhookConfigured,
      error: webhookConfigured ? undefined : 'Webhook não configurado. Configure no Meta for Developers.'
    };

  } catch (error) {
    console.error('Webhook validation error:', error);
    return {
      webhookConfigured: false,
      canReceiveMessages: false,
      error: 'Erro ao validar webhook: ' + error.message
    };
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
      .select('waba_ref, phone_number_id')
      .eq('id', phoneNumberId)
      .eq('workspace_id', workspaceId)
      .single();

    if (phoneError || !phoneNumber) {
      throw new Error('Phone number not found');
    }

    // Get WABA access token
    const { data: waba, error: wabaError } = await supabase
      .from('wabas')
      .select('access_token')
      .eq('id', phoneNumber.waba_ref)
      .single();

    if (wabaError || !waba) {
      throw new Error('WABA not found');
    }

    // Test webhook configuration
    const webhookTest = await testWebhookConfiguration(waba.access_token, phoneNumber.phone_number_id);

    return new Response(JSON.stringify({
      success: true,
      webhookConfigured: webhookTest.webhookConfigured,
      canReceiveMessages: webhookTest.canReceiveMessages,
      message: webhookTest.error || 'Webhook configurado e funcionando',
      instructions: webhookTest.webhookConfigured ? 
        'Webhook configurado corretamente' : 
        'Configure o webhook no Meta for Developers com a URL: ' + supabaseUrl + '/functions/v1/webhook-meta'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Webhook validation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      webhookConfigured: false,
      canReceiveMessages: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});