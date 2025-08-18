// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple in-memory token bucket per number for a single function instance
const buckets = new Map<string, { tokens: number; last: number; rate: number }>();

function canSend(id: string, rate: number) {
  const now = Date.now() / 1000;
  const b = buckets.get(id) ?? { tokens: rate, last: now, rate };
  // refill
  const delta = now - b.last;
  b.tokens = Math.min(b.rate, b.tokens + delta * b.rate);
  b.last = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  b.rate = rate;
  buckets.set(id, b);
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, tick = 1 } = await req.json().catch(() => ({}));
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load campaign numbers with randomization for load balancing
    const { data: cnums, error: cnErr } = await supabase
      .from('campaign_numbers')
      .select('phone_number_ref, pos, quota, min_quality')
      .eq('campaign_id', campaign_id)
      .order('pos', { ascending: true });
    
    // Shuffle numbers for load balancing
    if (cnums && cnums.length > 1) {
      for (let i = cnums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cnums[i], cnums[j]] = [cnums[j], cnums[i]];
      }
    }
    if (cnErr) throw cnErr;

    const numberIds = (cnums ?? []).map((n: any) => n.phone_number_ref);
    const { data: numbers, error: pnErr } = await supabase
      .from('phone_numbers')
      .select('id, mps_target, quality_rating, status, phone_number_id, waba_ref')
      .in('id', numberIds.length ? numberIds : ['00000000-0000-0000-0000-000000000000']);
    if (pnErr) throw pnErr;
    const numMap = new Map(numbers?.map((n: any) => [n.id, n]) ?? []);

    // How many we can try to send this tick (sum mps)
    const capacity = (numbers ?? []).reduce((acc: number, n: any) => acc + Math.max(1, n.mps_target || 1), 0) * Number(tick || 1);

    let processed = 0;
    let cursor = 0;

    // Fetch a small batch of queued jobs to assign/send
    const { data: jobs, error: jobsErr } = await supabase
      .from('dispatch_jobs')
      .select('id, attempts')
      .eq('campaign_id', campaign_id)
      .eq('status', 'QUEUED')
      .lt('attempts', 3) // Only retry up to 3 times
      .limit(capacity);
    if (jobsErr) throw jobsErr;

    const updates: any[] = [];

    function qualityRank(q?: string) {
      if (q === 'HIGH') return 3;
      if (q === 'MEDIUM') return 2;
      if (q === 'LOW') return 1;
      return 0;
    }

    for (const job of jobs ?? []) {
      if (processed >= capacity) break;
      let attempts = 0;
      while (attempts < (cnums?.length ?? 0)) {
        const n = cnums![cursor % cnums!.length];
        cursor++;
        attempts++;
        const meta = numMap.get(n.phone_number_ref);
        if (!meta) continue;
        if (meta.status !== 'ACTIVE') continue;
        if (qualityRank(meta.quality_rating) < qualityRank(n.min_quality)) continue;
        if (!canSend(meta.id, Math.max(1, meta.mps_target || 1))) continue;

        // Real Meta API call
        try {
          // Get full job details
          const { data: fullJob } = await supabase
            .from('dispatch_jobs')
            .select('audience_item_id, template_ref, campaign_id')
            .eq('id', job.id)
            .single();

          // Get recipient details
          const { data: audienceItem } = await supabase
            .from('audience_items')
            .select('wa_id, e164')
            .eq('id', fullJob.audience_item_id)
            .single();

          // Get template details
          const { data: template } = await supabase
            .from('message_templates')
            .select('name, components_schema')
            .eq('id', fullJob.template_ref)
            .single();

          // Get WABA details
          const { data: phoneNumber } = await supabase
            .from('phone_numbers')
            .select('phone_number_id, waba_ref')
            .eq('id', meta.id)
            .single();

          const { data: waba } = await supabase
            .from('wabas')
            .select('access_token')
            .eq('id', phoneNumber.waba_ref)
            .single();

          // Send message via Meta API
          const messagePayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: audienceItem.wa_id || audienceItem.e164,
            type: "template",
            template: {
              name: template.name,
              language: { code: "pt_BR" },
              components: template.components_schema
            }
          };

          const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumber.phone_number_id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waba.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
          });

          const metaResult = await metaResponse.json();

          if (metaResponse.ok && metaResult.messages?.[0]?.id) {
            updates.push({ 
              id: job.id, 
              phone_number_ref: meta.id, 
              status: 'SENT', 
              client_msg_id: metaResult.messages[0].id,
              sent_at: new Date().toISOString(), 
              last_status_at: new Date().toISOString() 
            });
          } else {
            // Handle API error - mark for retry or failure
            updates.push({ 
              id: job.id, 
              phone_number_ref: meta.id, 
              status: 'FAILED', 
              error_code: metaResult.error?.code || 'UNKNOWN_ERROR',
              attempts: (job.attempts || 0) + 1,
              last_status_at: new Date().toISOString() 
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          updates.push({ 
            id: job.id, 
            phone_number_ref: meta.id, 
            status: 'FAILED', 
            error_code: 'API_ERROR',
            attempts: (job.attempts || 0) + 1,
            last_status_at: new Date().toISOString() 
          });
        }
        processed++;
        break;
      }
    }

    // Batch updates
    if (updates.length) {
      const { error: updErr } = await supabase.from('dispatch_jobs').upsert(updates, { onConflict: 'id' });
      if (updErr) throw updErr;
    }

    return new Response(JSON.stringify({ processed, capacity }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e) {
    console.error('dispatcher error', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
