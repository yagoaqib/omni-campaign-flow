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
    const { type, workspaceId, userId, title, message, metadata = {} } = await req.json();

    if (!type || !workspaceId || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, workspaceId, title, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        type,
        title,
        message,
        metadata,
        read: false
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Notification created: ${type} for workspace ${workspaceId}`);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error creating notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notification' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});