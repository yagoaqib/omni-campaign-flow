interface InfobipApiConfig {
  base_url: string;
  api_key: string;
  from: string;
}

interface InfobipApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface InfobipAccountInfo {
  accountKey: string;
  name: string;
  currency: {
    currencyCode: string;
    currencySymbol: string;
  };
  balance: number;
}

interface InfobipTemplate {
  id: string;
  businessAccountId: string;
  name: string;
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: string;
  structure: {
    header?: any;
    body: any;
    footer?: any;
    buttons?: any[];
  };
}

export class InfobipApi {
  private config: InfobipApiConfig;

  constructor(config: InfobipApiConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<InfobipApiResponse<T>> {
    try {
      const url = `${this.config.base_url.replace(/\/$/, '')}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `App ${this.config.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.requestError?.serviceException?.text || `HTTP ${response.status}: ${response.statusText}`
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

  // Validar conexão obtendo informações da conta
  async validateConnection(): Promise<InfobipApiResponse<InfobipAccountInfo>> {
    return this.makeRequest('/account/1/balance');
  }

  // Obter informações do sender (número)
  async getSenderInfo(): Promise<InfobipApiResponse<any>> {
    return this.makeRequest(`/whatsapp/1/senders/${this.config.from}`);
  }

  // Sincronizar templates do WhatsApp
  async syncTemplates(): Promise<InfobipApiResponse<{ templates: InfobipTemplate[]; stats: { approved: number; pending: number; rejected: number } }>> {
    const response = await this.makeRequest<{ templates: InfobipTemplate[] }>('/whatsapp/2/message-templates');
    
    if (response.success && response.data) {
      const templates = response.data.templates || [];
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

  // Testar envio de mensagem simples
  async testMessage(to: string, text: string): Promise<InfobipApiResponse<any>> {
    const body = {
      messages: [
        {
          from: this.config.from,
          to: to.replace(/\D/g, ''), // Remove non-digits
          messageId: `test-${Date.now()}`,
          content: {
            text: text
          }
        }
      ]
    };

    return this.makeRequest('/whatsapp/1/message/text', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Verificar status do sender
  async checkSenderStatus(): Promise<InfobipApiResponse<any>> {
    return this.getSenderInfo();
  }
}

// Factory function para criar instância da API
export function createInfobipApi(config: InfobipApiConfig): InfobipApi {
  return new InfobipApi(config);
}

// Função utilitária para testar conexão rapidamente
export async function testInfobipConnection(config: InfobipApiConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const api = createInfobipApi(config);
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