// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Meta WhatsApp Business API validation
async function validateWithMeta(phone: string, accessToken: string): Promise<{
  isValid: boolean;
  hasWhatsApp: boolean;
  isLandline: boolean;
  description?: string;
}> {
  try {
    // Use Meta's Phone Number Insights API to check if number has WhatsApp
    const response = await fetch(`https://graph.facebook.com/v19.0/phone_number_insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: phone,
        fields: ['carrier', 'line_type']
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        hasWhatsApp: true, // Meta API only returns data for WhatsApp-enabled numbers
        isLandline: data.line_type === 'LANDLINE',
        description: `Validado via Meta API - ${data.carrier || 'Operadora desconhecida'}`
      };
    } else {
      // Number not found in Meta API = no WhatsApp
      return {
        isValid: true,
        hasWhatsApp: false,
        isLandline: false,
        description: 'Número válido mas sem WhatsApp (verificado via Meta API)'
      };
    }
  } catch (error) {
    console.error('Meta API validation error:', error);
    throw error;
  }
}

// Infobip Number Lookup API validation
async function validateWithInfobip(phone: string, apiKey: string): Promise<{
  isValid: boolean;
  hasWhatsApp: boolean;
  isLandline: boolean;
  description?: string;
}> {
  try {
    // Use Infobip Number Lookup to validate number and check type
    const response = await fetch(`https://api.infobip.com/number/1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [phone]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.results?.[0];
      
      if (result) {
        return {
          isValid: result.status === 'VALID',
          hasWhatsApp: result.mccMnc !== null, // Available for mobile numbers
          isLandline: result.numberType === 'LANDLINE',
          description: `Validado via Infobip - ${result.numberType} (${result.originalNetwork || 'Rede desconhecida'})`
        };
      }
    }
    
    throw new Error('Infobip API validation failed');
  } catch (error) {
    console.error('Infobip API validation error:', error);
    throw error;
  }
}

// Twilio Lookup API validation
async function validateWithTwilio(phone: string, accountSid: string, authToken: string): Promise<{
  isValid: boolean;
  hasWhatsApp: boolean;
  isLandline: boolean;
  description?: string;
}> {
  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Use Twilio Lookup API with carrier and line type info
    const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}?Fields=line_type_intelligence,carrier`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const lineType = data.line_type_intelligence?.type;
      
      return {
        isValid: data.valid,
        hasWhatsApp: lineType === 'mobile', // Assume mobile numbers can have WhatsApp
        isLandline: lineType === 'landline',
        description: `Validado via Twilio - ${lineType} (${data.carrier?.name || 'Operadora desconhecida'})`
      };
    }
    
    throw new Error('Twilio API validation failed');
  } catch (error) {
    console.error('Twilio API validation error:', error);
    throw error;
  }
}

// Enhanced phone number validation using real APIs
async function validatePhoneNumber(phone: string, workspace_id: string): Promise<{
  isValid: boolean;
  hasWhatsApp: boolean;
  isLandline: boolean;
  reason?: string;
  description?: string;
  cost: number;
}> {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Basic format check
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for duplicates first (free check)
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('phone', phone)
      .limit(2);

    if (existingContacts && existingContacts.length > 1) {
      return {
        isValid: false,
        hasWhatsApp: false,
        isLandline: false,
        reason: 'duplicate',
        description: 'Número duplicado na base de contatos',
        cost: 0.005
      };
    }

    // Get API credentials from Supabase secrets
    const metaToken = Deno.env.get('META_ACCESS_TOKEN');
    const infobipApiKey = Deno.env.get('INFOBIP_API_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    let validationResult;
    let validationCost = 0.01; // Base cost for API validation

    // Try Meta API first (most accurate for WhatsApp)
    if (metaToken) {
      try {
        const metaResult = await validateWithMeta(phone, metaToken);
        validationResult = metaResult;
        validationCost = 0.015; // Meta API cost
      } catch (error) {
        console.log('Meta API failed, trying fallback:', error.message);
      }
    }

    // Fallback to Infobip if Meta fails
    if (!validationResult && infobipApiKey) {
      try {
        const infobipResult = await validateWithInfobip(phone, infobipApiKey);
        validationResult = infobipResult;
        validationCost = 0.012; // Infobip cost
      } catch (error) {
        console.log('Infobip API failed, trying Twilio:', error.message);
      }
    }

    // Final fallback to Twilio
    if (!validationResult && twilioSid && twilioToken) {
      try {
        const twilioResult = await validateWithTwilio(phone, twilioSid, twilioToken);
        validationResult = twilioResult;
        validationCost = 0.01; // Twilio cost
      } catch (error) {
        console.log('Twilio API failed:', error.message);
      }
    }

    // If all APIs fail, use basic validation
    if (!validationResult) {
      console.log('All APIs failed, using basic validation for:', phone);
      const isValidBrazilianNumber = cleanPhone.length >= 10 && cleanPhone.length <= 11;
      
      return {
        isValid: isValidBrazilianNumber,
        hasWhatsApp: isValidBrazilianNumber, // Conservative assumption
        isLandline: false,
        reason: isValidBrazilianNumber ? undefined : 'invalid_format',
        description: isValidBrazilianNumber 
          ? 'Número válido (validação básica - APIs indisponíveis)' 
          : 'Formato de número brasileiro inválido',
        cost: 0.001
      };
    }

    return {
      ...validationResult,
      reason: !validationResult.isValid ? 'invalid_number' : 
              !validationResult.hasWhatsApp ? 'no_whatsapp' : undefined,
      cost: validationCost
    };

  } catch (error) {
    console.error('Validation error for phone:', phone, error);
    return {
      isValid: false,
      hasWhatsApp: false,
      isLandline: false,
      reason: 'validation_error',
      description: 'Erro na validação do número',
      cost: 0.001
    };
  }
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

    // Get workspace ID for duplicate checking
    const { data: audience } = await supabase
      .from('audiences')
      .select('workspace_id')
      .eq('id', audienceId)
      .single();

    if (!audience) {
      throw new Error('Audience not found');
    }

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
        const validation = await validatePhoneNumber(phone, audience.workspace_id);
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