// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id } = await req.json().catch(() => ({}));
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure campaign exists
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', campaign_id)
      .maybeSingle();
    if (campErr) throw campErr;
    if (!campaign) return new Response(JSON.stringify({ error: 'campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

    // Mark RUNNING and create jobs for VALID audience
    const { data: cmpUpd, error: updErr } = await supabase
      .from('campaigns')
      .update({ status: 'RUNNING' })
      .eq('id', campaign_id)
      .select('id')
      .maybeSingle();
    if (updErr) throw updErr;

    // Fetch VALID audience items
    const { data: items, error: itemsErr } = await supabase
      .from('audience_items')
      .select('id')
      .in('validation_status', ['VALID'])
      .limit(10000);
    if (itemsErr) throw itemsErr;

    const jobs = (items ?? []).map((it: any) => ({
      campaign_id,
      audience_item_id: it.id,
      status: 'QUEUED' as const,
    }));

    if (jobs.length > 0) {
      const chunkSize = 1000;
      for (let i = 0; i < jobs.length; i += chunkSize) {
        const slice = jobs.slice(i, i + chunkSize);
        const { error: insErr } = await supabase.from('dispatch_jobs').insert(slice);
        if (insErr) throw insErr;
      }
    }

    return new Response(JSON.stringify({ status: 'RUNNING', queued: jobs.length }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e) {
    console.error('campaigns-start error', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
