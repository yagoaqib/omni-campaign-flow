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
    const url = new URL(req.url);
    const { campaign_id } = (req.method === 'GET')
      ? { campaign_id: url.searchParams.get('campaign_id') }
      : await req.json().catch(() => ({}));

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load campaign and numbers
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, audience_id')
      .eq('id', campaign_id)
      .maybeSingle();
    if (campErr) throw campErr;
    if (!campaign) return new Response(JSON.stringify({ error: 'campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

    const { data: cnums, error: cnErr } = await supabase
      .from('campaign_numbers')
      .select('phone_number_ref, pos, quota')
      .eq('campaign_id', campaign_id)
      .order('pos', { ascending: true });
    if (cnErr) throw cnErr;

    const numberIds = (cnums ?? []).map((n: any) => n.phone_number_ref);
    const { data: numbers, error: pnErr } = await supabase
      .from('phone_numbers')
      .select('id, mps_target')
      .in('id', numberIds.length ? numberIds : ['00000000-0000-0000-0000-000000000000']);
    if (pnErr) throw pnErr;
    const mpsMap = Object.fromEntries((numbers ?? []).map((n: any) => [n.id, n.mps_target || 80]));

    // Count valid recipients
    const { data: validAgg, error: vErr } = await supabase
      .from('audience_items')
      .select('count:count(*)')
      .eq('audience_id', campaign.audience_id as string)
      .eq('validation_status', 'VALID')
      .maybeSingle();
    if (vErr) throw vErr;
    const validTotal = Number(validAgg?.count || 0);

    // Assign in order with quotas until run out of valid recipients
    let remaining = validTotal;
    const perNumber: { id: string; etaSec: number; assigned: number }[] = [];
    let totalMps = 0;
    for (const n of cnums ?? []) {
      const mps = Math.max(1, mpsMap[n.phone_number_ref] ?? 80);
      totalMps += mps;
      const assigned = Math.max(0, Math.min(n.quota ?? 0, remaining));
      const etaSec = Math.ceil(assigned / mps);
      perNumber.push({ id: n.phone_number_ref, etaSec, assigned });
      remaining -= assigned;
    }

    const etaTotalSec = totalMps > 0 ? Math.ceil(validTotal / totalMps) : 0;

    return new Response(
      JSON.stringify({ etaTotalSec, perNumber }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('eta error', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
