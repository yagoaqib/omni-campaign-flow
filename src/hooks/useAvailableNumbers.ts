import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useToast } from './use-toast';

export interface AvailableNumber {
  id: string;
  label: string;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'PAUSED' | 'BLOCKED';
  displayNumber: string;
  mpsTarget: number;
}

export function useAvailableNumbers() {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNumbers = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('id, display_number, quality_rating, status, mps_target')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const availableNumbers = (data || []).map(number => ({
        id: number.id,
        label: number.display_number,
        quality: number.quality_rating as 'HIGH' | 'MEDIUM' | 'LOW',
        status: number.status as 'ACTIVE' | 'PAUSED' | 'BLOCKED',
        displayNumber: number.display_number,
        mpsTarget: number.mps_target
      }));

      setNumbers(availableNumbers);
    } catch (error) {
      console.error('Erro ao carregar números:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar números disponíveis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNumbers();
  }, [activeWorkspace]);

  return {
    numbers,
    loading,
    loadNumbers
  };
}