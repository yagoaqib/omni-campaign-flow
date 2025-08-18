import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface PhoneNumberForTemplate {
  id: string;
  label: string;
  display_number: string;
  quality_rating: string;
  status: string;
}

export function usePhoneNumbersForTemplates() {
  const { activeWorkspace } = useWorkspace();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberForTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPhoneNumbers = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('id, display_number, quality_rating, status')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'ACTIVE')
        .order('display_number');

      if (error) throw error;

      const formattedNumbers = (data || []).map(num => ({
        id: num.id,
        label: `${num.display_number} (${num.quality_rating})`,
        display_number: num.display_number,
        quality_rating: num.quality_rating,
        status: num.status
      }));

      setPhoneNumbers(formattedNumbers);
    } catch (error) {
      console.error('Erro ao carregar números:', error);
      setPhoneNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
  }, [activeWorkspace]);

  return {
    phoneNumbers,
    loading,
    refresh: loadPhoneNumbers
  };
}