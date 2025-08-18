import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

export interface CascadePolicy {
  id: string;
  campaign_id: string;
  workspace_id: string;
  numbers_order: string[];
  number_quotas: Record<string, number>;
  min_quality: 'HIGH' | 'MEDIUM' | 'LOW';
  template_stack_util?: string;
  template_stack_mkt?: string;
  desired_category: 'UTILITY' | 'MARKETING';
  retry_max: number;
  retry_backoff_sec: number;
  per_number: Record<string, any>;
  rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useCascadePolicy(campaignId?: string) {
  const [policy, setPolicy] = useState<CascadePolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();

  const loadPolicy = useCallback(async () => {
    if (!campaignId || !activeWorkspace?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cascade_policies')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('workspace_id', activeWorkspace.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setPolicy(data as any);
    } catch (error) {
      console.error('Error loading cascade policy:', error);
      toast.error('Erro ao carregar política de cascata');
    } finally {
      setLoading(false);
    }
  }, [campaignId, activeWorkspace?.id]);

  const savePolicy = useCallback(async (policyData: Partial<CascadePolicy>) => {
    if (!campaignId || !activeWorkspace?.id) return;

    try {
      const dataToSave = {
        campaign_id: campaignId,
        workspace_id: activeWorkspace.id,
        ...policyData
      };

      const { data, error } = await supabase
        .from('cascade_policies')
        .upsert(dataToSave)
        .select()
        .single();

      if (error) throw error;

      setPolicy(data as any);
      toast.success('Política de cascata salva com sucesso');
      return data as any;
    } catch (error) {
      console.error('Error saving cascade policy:', error);
      toast.error('Erro ao salvar política de cascata');
      throw error;
    }
  }, [campaignId, activeWorkspace?.id]);

  const updatePolicy = useCallback(async (updates: Partial<CascadePolicy>) => {
    if (!policy?.id) return;

    try {
      const { data, error } = await supabase
        .from('cascade_policies')
        .update(updates)
        .eq('id', policy.id)
        .select()
        .single();

      if (error) throw error;

      setPolicy(data as any);
      return data as any;
    } catch (error) {
      console.error('Error updating cascade policy:', error);
      toast.error('Erro ao atualizar política de cascata');
      throw error;
    }
  }, [policy?.id]);

  const deletePolicy = useCallback(async () => {
    if (!policy?.id) return;

    try {
      const { error } = await supabase
        .from('cascade_policies')
        .delete()
        .eq('id', policy.id);

      if (error) throw error;

      setPolicy(null);
      toast.success('Política de cascata removida');
    } catch (error) {
      console.error('Error deleting cascade policy:', error);
      toast.error('Erro ao remover política de cascata');
      throw error;
    }
  }, [policy?.id]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  return {
    policy,
    loading,
    loadPolicy,
    savePolicy,
    updatePolicy,
    deletePolicy
  };
}