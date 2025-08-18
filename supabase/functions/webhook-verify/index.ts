import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl, verifyToken } = await req.json();

    if (!webhookUrl || !verifyToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL do webhook e token de verificação são obrigatórios' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Verificando webhook: ${webhookUrl}`);

    // Fazer uma requisição GET para verificar o webhook com Meta
    const challenge = 'test-challenge-' + Date.now();
    const verifyUrl = new URL(webhookUrl);
    verifyUrl.searchParams.set('hub.mode', 'subscribe');
    verifyUrl.searchParams.set('hub.challenge', challenge);
    verifyUrl.searchParams.set('hub.verify_token', verifyToken);

    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Meta-WhatsApp-Webhook-Verifier/1.0'
      },
      signal: AbortSignal.timeout(10000) // timeout de 10 segundos
    });

    if (!response.ok) {
      console.error(`Webhook verification failed: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Webhook retornou status ${response.status}: ${response.statusText}` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const responseText = await response.text();
    
    // A resposta deve ser exatamente o challenge que enviamos
    if (responseText.trim() === challenge) {
      console.log('Webhook verification successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook verificado com sucesso',
          challenge: challenge
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error(`Challenge mismatch. Expected: ${challenge}, Got: ${responseText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Challenge incorreto. Esperado: ${challenge}, Recebido: ${responseText}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in webhook-verify function:', error);
    
    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na verificação do webhook (10s)';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Não foi possível conectar ao webhook URL';
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});