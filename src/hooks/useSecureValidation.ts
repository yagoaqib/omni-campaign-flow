import { useCallback } from 'react';
import { 
  validateAndSanitize, 
  safeValidate, 
  wabaConfigSchema, 
  contactSchema, 
  workspaceNameSchema,
  defaultRateLimit 
} from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

export function useSecureValidation() {
  const { toast } = useToast();

  const validateWABAConfig = useCallback((data: unknown) => {
    const result = safeValidate(wabaConfigSchema, data);
    if (!result.success) {
      toast({
        title: 'Dados inválidos',
        description: result.error,
        variant: 'destructive',
      });
      return null;
    }
    return result.data;
  }, [toast]);

  const validateContact = useCallback((data: unknown) => {
    const result = safeValidate(contactSchema, data);
    if (!result.success) {
      toast({
        title: 'Dados de contato inválidos',
        description: result.error,
        variant: 'destructive',
      });
      return null;
    }
    return result.data;
  }, [toast]);

  const validateWorkspaceName = useCallback((name: string) => {
    const result = safeValidate(workspaceNameSchema, name);
    if (!result.success) {
      toast({
        title: 'Nome do workspace inválido',
        description: result.error,
        variant: 'destructive',
      });
      return null;
    }
    return result.data;
  }, [toast]);

  const checkRateLimit = useCallback((key: string) => {
    if (!defaultRateLimit.canAttempt(key)) {
      toast({
        title: 'Muitas tentativas',
        description: 'Aguarde um momento antes de tentar novamente.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  }, [toast]);

  return {
    validateWABAConfig,
    validateContact,
    validateWorkspaceName,
    checkRateLimit,
  };
}