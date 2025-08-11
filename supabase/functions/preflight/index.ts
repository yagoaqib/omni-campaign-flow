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

    // Load campaign to get audience_id
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, audience_id')
      .eq('id', campaign_id)
      .maybeSingle();

    if (campErr) throw campErr;
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Aggregate audience items counts by validation_status
    const { data: agg, error: aggErr } = await supabase
      .from('audience_items')
      .select('validation_status, count:count(*)')
      .eq('audience_id', campaign.audience_id as string);

    if (aggErr) throw aggErr;

    const map: Record<string, number> = {};
    (agg ?? []).forEach((r: any) => {
      map[r.validation_status] = Number(r.count) || 0;
    });

    const valid = map['VALID'] || 0;
    const invalid = map['INVALID'] || 0;
    const nowa = map['NO_WA'] || 0;

    // Stub for template validation for now
    const templateErrors: string[] = [];

    return new Response(
      JSON.stringify({ valid, invalid, nowa, templateErrors }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('preflight error', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
