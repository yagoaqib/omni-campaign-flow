interface GupshupApiConfig {
  api_key: string;
  app: string;
  source: string;
  environment: "live" | "sandbox";
}

interface GupshupApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GupshupTemplate {
  id: string;
  elementName: string;
  languageCode: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: string;
  vertical: string;
  templateType: string;
  data: any[];
}

export class GupshupApi {
  private config: GupshupApiConfig;
  private baseUrl: string;

  constructor(config: GupshupApiConfig) {
    this.config = config;
    this.baseUrl = config.environment === "sandbox" 
      ? "https://api.gupshup.io/sm/api/v1"
      : "https://api.gupshup.io/sm/api/v1";
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<GupshupApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'apikey': this.config.api_key,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
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

  // Validar conexão obtendo informações da app
  async validateConnection(): Promise<GupshupApiResponse<any>> {
    const params = new URLSearchParams({
      channel: 'whatsapp',
      source: this.config.source,
      'src.name': this.config.app
    });

    return this.makeRequest(`/app/opt/in?${params.toString()}`, { method: 'POST' });
  }

  // Obter informações do app
  async getAppInfo(): Promise<GupshupApiResponse<any>> {
    const params = new URLSearchParams({
      channel: 'whatsapp'
    });

    return this.makeRequest(`/app?${params.toString()}`);
  }

  // Sincronizar templates
  async syncTemplates(): Promise<GupshupApiResponse<{ templates: GupshupTemplate[]; stats: { approved: number; pending: number; rejected: number } }>> {
    const params = new URLSearchParams({
      appName: this.config.app
    });

    const response = await this.makeRequest<{ templates: GupshupTemplate[] }>(`/template/list?${params.toString()}`);
    
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
  async testMessage(to: string, message: string): Promise<GupshupApiResponse<any>> {
    const params = new URLSearchParams({
      channel: 'whatsapp',
      source: this.config.source,
      destination: to.replace(/\D/g, ''), // Remove non-digits
      'src.name': this.config.app,
      message: message
    });

    return this.makeRequest('/msg', {
      method: 'POST',
      body: params.toString()
    });
  }

  // Verificar status do número/source
  async checkSourceStatus(): Promise<GupshupApiResponse<any>> {
    return this.getAppInfo();
  }

  // Obter estatísticas da app
  async getAppStats(): Promise<GupshupApiResponse<any>> {
    const params = new URLSearchParams({
      appName: this.config.app,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
      endDate: new Date().toISOString().split('T')[0]
    });

    return this.makeRequest(`/app/analytics?${params.toString()}`);
  }
}

// Factory function para criar instância da API
export function createGupshupApi(config: GupshupApiConfig): GupshupApi {
  return new GupshupApi(config);
}

// Função utilitária para testar conexão rapidamente
export async function testGupshupConnection(config: GupshupApiConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const api = createGupshupApi(config);
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