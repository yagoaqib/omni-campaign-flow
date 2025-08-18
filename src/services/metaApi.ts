interface MetaApiConfig {
  access_token: string;
  waba_id: string;
  phone_number_id: string;
  graph_version?: string;
}

interface MetaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PhoneNumberInfo {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  messaging_limit_tier: string;
  status: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  language: string;
  components: any[];
}

export class MetaApi {
  private config: MetaApiConfig;
  private baseUrl: string;

  constructor(config: MetaApiConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.graph_version || 'v19.0'}`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<MetaApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Validar access token e obter informações básicas da WABA
  async validateConnection(): Promise<MetaApiResponse<any>> {
    return this.makeRequest(`/${this.config.waba_id}?fields=id,name,currency,timezone_offset_minutes,message_template_namespace`);
  }

  // Obter informações do número de telefone
  async getPhoneNumberInfo(): Promise<MetaApiResponse<PhoneNumberInfo>> {
    return this.makeRequest(`/${this.config.phone_number_id}?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier,status`);
  }

  // Verificar qualidade e tier do número
  async checkQualityTier(): Promise<MetaApiResponse<{ quality_rating: string; messaging_limit_tier: string }>> {
    const response = await this.getPhoneNumberInfo();
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          quality_rating: response.data.quality_rating,
          messaging_limit_tier: response.data.messaging_limit_tier
        }
      };
    }
    return response;
  }

  // Sincronizar templates da WABA
  async syncTemplates(): Promise<MetaApiResponse<{ templates: Template[]; stats: { approved: number; pending: number; rejected: number } }>> {
    const response = await this.makeRequest<{ data: Template[] }>(`/${this.config.waba_id}/message_templates?fields=id,name,category,status,language,components&limit=100`);
    
    if (response.success && response.data) {
      const templates = response.data.data || [];
      const stats = {
        approved: templates.filter(t => t.status === "APPROVED").length,
        pending: templates.filter(t => t.status === "PENDING").length,
        rejected: templates.filter(t => t.status === "REJECTED").length
      };

      return {
        success: true,
        data: { templates, stats }
      };
    }

    return {
      success: false,
      error: response.error || "Failed to sync templates"
    };
  }

  // Testar envio de mensagem (para validação)
  async testMessage(to: string, template_name: string): Promise<MetaApiResponse<any>> {
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template_name,
        language: {
          code: "pt_BR"
        }
      }
    };

    return this.makeRequest(`/${this.config.phone_number_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Validar webhook (verificar se pode receber webhooks)
  async validateWebhook(): Promise<MetaApiResponse<any>> {
    // Para validar webhook, verificamos se conseguimos obter informações da WABA
    // Em um cenário real, também verificaríamos se o webhook está configurado corretamente
    return this.validateConnection();
  }
}

// Factory function para criar instância da API
export function createMetaApi(config: MetaApiConfig): MetaApi {
  return new MetaApi(config);
}

// Função utilitária para testar conexão rapidamente
export async function testMetaConnection(config: MetaApiConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const api = createMetaApi(config);
  const result = await api.validateConnection();

  if (result.success) {
    return {
      success: true,
      message: "Conexão validada com sucesso",
      details: result.data
    };
  }

  return {
    success: false,
    message: result.error || "Falha na conexão"
  };
}