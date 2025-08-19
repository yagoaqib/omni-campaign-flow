import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface BalanceData {
  current_balance: number;
  total_spent: number;
  pending_charges: number;
  currency: string;
}

export function useBalance() {
  const [balance, setBalance] = useState<BalanceData>({
    current_balance: 0,
    total_spent: 0,
    pending_charges: 0,
    currency: 'BRL'
  });
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadBalance = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);

      // Calculate costs from validation results
      const { data: validationResults } = await supabase
        .from('number_validation_results')
        .select(`
          cost,
          contacts!inner(workspace_id)
        `)
        .eq('contacts.workspace_id', activeWorkspace.id);

      // Calculate costs from dispatch jobs (estimated message costs)
      const { data: dispatchJobs } = await supabase
        .from('dispatch_jobs')
        .select(`
          status,
          campaigns!inner(workspace_id)
        `)
        .eq('campaigns.workspace_id', activeWorkspace.id);

      const validationCosts = (validationResults || []).reduce((sum, result) => {
        return sum + (Number(result.cost) || 0);
      }, 0);

      // Estimate message costs (R$ 0.05 per sent message)
      const messageCosts = (dispatchJobs || []).filter(job => 
        job.status === 'SENT' || job.status === 'DELIVERED' || job.status === 'READ'
      ).length * 0.05;

      const totalSpent = validationCosts + messageCosts;

      // For now, assume no current balance and no pending charges
      // In a real scenario, this would come from a billing/credits table
      setBalance({
        current_balance: 0,
        total_spent: totalSpent,
        pending_charges: 0,
        currency: 'BRL'
      });

    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [activeWorkspace?.id]);

  return { balance, loading, refreshBalance: loadBalance };
}