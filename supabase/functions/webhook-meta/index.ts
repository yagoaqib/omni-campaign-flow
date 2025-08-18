// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.208.0/crypto/crypto.ts';

function verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
  const expectedSignature = 'sha256=' + createHmac('sha256', appSecret).update(payload).digest('hex');
  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      // Webhook verification challenge
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe') {
        // Verify token with database
        const { data: waba } = await supabase
          .from('wabas')
          .select('verify_token')
          .eq('verify_token', token)
          .single();

        if (waba) {
          return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain', ...corsHeaders }
          });
        }
      }

      return new Response('Forbidden', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      });
    }

    if (req.method === 'POST') {
      const payload = await req.text();
      const signature = req.headers.get('x-hub-signature-256');
      
      if (!signature) {
        return new Response('Missing signature', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }

      const data = JSON.parse(payload);
      
      // Find the WABA that owns this webhook
      let validWaba = null;
      const { data: wabas } = await supabase
        .from('wabas')
        .select('app_secret, workspace_id');

      for (const waba of wabas || []) {
        if (verifyWebhookSignature(payload, signature, waba.app_secret)) {
          validWaba = waba;
          break;
        }
      }

      if (!validWaba) {
        return new Response('Invalid signature', { 
          status: 403,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }

      // Process webhook events
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            for (const message of change.value.messages || []) {
              // Update dispatch job status based on message status
              const { data: job } = await supabase
                .from('dispatch_jobs')
                .select('id')
                .eq('client_msg_id', message.id)
                .single();

              if (job) {
                await supabase
                  .from('dispatch_jobs')
                  .update({
                    status: 'DELIVERED',
                    last_status_at: new Date().toISOString()
                  })
                  .eq('id', job.id);
              }
            }
          }

          if (change.field === 'message_template_status_update') {
            // Update template status in message_templates table
            const templateUpdate = change.value;
            await supabase
              .from('message_templates')
              .update({
                status: templateUpdate.event,
                updated_at: new Date().toISOString()
              })
              .eq('name', templateUpdate.message_template_name)
              .eq('workspace_id', validWaba.workspace_id);

            // Create notification for template status change
            if (templateUpdate.event === 'REJECTED') {
              await supabase.functions.invoke('notify', {
                body: {
                  type: 'template_rejected',
                  workspaceId: validWaba.workspace_id,
                  title: 'Template rejeitado',
                  message: `O template "${templateUpdate.message_template_name}" foi rejeitado pela Meta`,
                  metadata: { templateName: templateUpdate.message_template_name, reason: templateUpdate.reason }
                }
              });
            }
          }
        }
      }

      // Store webhook event
      await supabase
        .from('webhook_events')
        .insert({
          workspace_id: validWaba.workspace_id,
          event_type: 'meta_webhook',
          payload: data
        });

      return new Response('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      });
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
  }
});