import { z } from 'zod';
import DOMPurify from 'dompurify';

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/(?!^\+)[^\d]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Validation schemas
export const phoneNumberSchema = z.string()
  .min(10, 'Número de telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Número de telefone deve ter no máximo 15 dígitos')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de telefone inválido');

export const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório');

export const workspaceNameSchema = z.string()
  .min(1, 'Nome do workspace é obrigatório')
  .max(100, 'Nome do workspace deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contém caracteres inválidos');

export const wabaConfigSchema = z.object({
  name: z.string()
    .min(1, 'Nome da WABA é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(sanitizeHtml),
  waba_id: z.string()
    .min(1, 'WABA ID é obrigatório')
    .regex(/^\d+$/, 'WABA ID deve conter apenas números'),
  meta_business_id: z.string()
    .min(1, 'Meta Business ID é obrigatório')
    .regex(/^\d+$/, 'Meta Business ID deve conter apenas números'),
  access_token: z.string().optional(),
  app_secret: z.string().optional(),
  verify_token: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string()
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .transform(sanitizeHtml)
    .optional(),
  phone: z.string()
    .transform(sanitizePhoneNumber)
    .pipe(phoneNumberSchema),
  email: z.string()
    .transform(sanitizeEmail)
    .pipe(emailSchema)
    .optional(),
});

export const templateNameSchema = z.string()
  .min(1, 'Nome do template é obrigatório')
  .max(512, 'Nome do template deve ter no máximo 512 caracteres')
  .regex(/^[a-z0-9_]+$/, 'Nome do template deve conter apenas letras minúsculas, números e underscore');

export const messageContentSchema = z.string()
  .min(1, 'Conteúdo da mensagem é obrigatório')
  .max(4096, 'Mensagem deve ter no máximo 4096 caracteres')
  .transform(sanitizeHtml);

// Validation helper functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  error?: string; 
} => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      };
    }
    return { success: false, error: 'Erro de validação' };
  }
};

// Rate limiting helper (client-side)
export class ClientRateLimit {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 60000) {}
  
  canAttempt(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const defaultRateLimit = new ClientRateLimit();