// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Mock validation service - replace with real API integration
async function validatePhoneNumber(phone: string): Promise<{
  isValid: boolean;
  hasWhatsApp: boolean;
  isLandline: boolean;
  reason?: string;
  description?: string;
  cost: number;
}> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simple validation logic (replace with real API)
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return {
      isValid: false,
      hasWhatsApp: false,
      isLandline: false,
      reason: 'invalid_format',
      description: 'Número com formato inválido',
      cost: 0.001
    };
  }

  // Mock landline detection (starts with certain prefixes)
  const isLandline = ['2', '3', '4', '5'].includes(cleanPhone.charAt(2));
  if (isLandline) {
    return {
      isValid: true,
      hasWhatsApp: false,
      isLandline: true,
      reason: 'landline',
      description: 'Número de linha fixa não possui WhatsApp',
      cost: 0.001
    };
  }

  // Mock WhatsApp detection (80% chance for mobile numbers)
  const hasWhatsApp = Math.random() > 0.2;
  if (!hasWhatsApp) {
    return {
      isValid: true,
      hasWhatsApp: false,
      isLandline: false,
      reason: 'no_whatsapp',
      description: 'Número móvel sem WhatsApp ativo',
      cost: 0.002
    };
  }

  return {
    isValid: true,
    hasWhatsApp: true,
    isLandline: false,
    cost: 0.002
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audienceId } = await req.json();
    if (!audienceId) {
      return new Response(JSON.stringify({ error: 'audienceId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contacts from audience
    const { data: audienceItems, error: audienceError } = await supabase
      .from('audience_items')
      .select('id, e164, raw_msisdn')
      .eq('audience_id', audienceId);

    if (audienceError) throw audienceError;

    if (!audienceItems || audienceItems.length === 0) {
      return new Response(JSON.stringify({ 
        processed: 0, 
        validCount: 0, 
        invalidCount: 0,
        totalCost: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let validCount = 0;
    let invalidCount = 0;
    let totalCost = 0;

    // Process each phone number
    for (const item of audienceItems) {
      const phone = item.e164 || item.raw_msisdn;
      if (!phone) continue;

      try {
        const validation = await validatePhoneNumber(phone);
        totalCost += validation.cost;

        if (!validation.isValid || !validation.hasWhatsApp) {
          invalidCount++;
          
          // Get contact ID from audience item
          const { data: contacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('phone', phone)
            .limit(1);

          if (contacts && contacts.length > 0) {
            // Save validation result
            await supabase
              .from('number_validation_results')
              .insert({
                contact_id: contacts[0].id,
                reason: validation.reason || 'unknown',
                description: validation.description || 'Número inválido',
                cost: validation.cost
              });
          }
        } else {
          validCount++;
        }
      } catch (error) {
        console.error('Error validating phone:', phone, error);
        invalidCount++;
      }
    }

    return new Response(JSON.stringify({
      processed: audienceItems.length,
      validCount,
      invalidCount,
      totalCost: Number(totalCost.toFixed(4))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});