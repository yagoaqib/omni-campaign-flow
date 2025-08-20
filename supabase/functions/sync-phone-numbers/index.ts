import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  wabaId: string;
  workspaceId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { wabaId, workspaceId }: RequestBody = await req.json()
    
    console.log('Syncing phone numbers for WABA:', wabaId)

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get WABA credentials
    const { data: wabaData, error: wabaError } = await supabase
      .from('wabas')
      .select('*')
      .eq('id', wabaId)
      .single()

    if (wabaError || !wabaData) {
      throw new Error('WABA not found or access denied')
    }

    // Check if we have access token
    if (!wabaData.access_token) {
      throw new Error('Access token not configured for this WABA. Please update credentials.')
    }

    // Fetch phone numbers from Meta API
    const metaUrl = `https://graph.facebook.com/v18.0/${wabaData.waba_id}/phone_numbers`
    console.log('Fetching from Meta API:', metaUrl)

    const metaResponse = await fetch(metaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${wabaData.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!metaResponse.ok) {
      const errorText = await metaResponse.text()
      console.error('Meta API error:', metaResponse.status, errorText)
      throw new Error(`Meta API error: ${metaResponse.status} - ${errorText}`)
    }

    const metaData = await metaResponse.json()
    console.log('Meta API response:', metaData)

    if (!metaData.data || metaData.data.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum número encontrado nesta WABA',
          count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    // Insert/update phone numbers in database
    const phoneNumbers = metaData.data.map((number: any) => ({
      phone_number_id: number.id,
      display_number: number.display_phone_number,
      waba_ref: wabaId,
      workspace_id: workspaceId,
      quality_rating: number.quality_rating || 'UNKNOWN',
      status: number.code_verification_status === 'VERIFIED' ? 'ACTIVE' : 'PAUSED',
      mps_target: 80, // Default MPS target
    }))

    // Use upsert to avoid duplicates
    const { data: insertedNumbers, error: insertError } = await supabase
      .from('phone_numbers')
      .upsert(phoneNumbers, { 
        onConflict: 'phone_number_id,workspace_id',
        ignoreDuplicates: false 
      })
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    console.log('Successfully synced phone numbers:', insertedNumbers?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${phoneNumbers.length} número(s) importado(s) com sucesso`,
        count: phoneNumbers.length,
        numbers: insertedNumbers
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error syncing phone numbers:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to sync phone numbers' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})