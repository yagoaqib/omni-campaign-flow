import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface RealPhoneNumber {
  id: string;
  display_number: string;
  status: 'ACTIVE' | 'PAUSED' | 'BLOCKED';
  quality_rating: 'HIGH' | 'MEDIUM' | 'LOW';
  mps_target: number;
  phone_number_id: string;
  created_at: string;
  last_health_at?: string;
  // Real stats from dispatch jobs
  todayStats: {
    sent: number;
    delivered: number;
    failed: number;
    delivery_rate: number;
  };
  // WABA info
  waba?: {
    name: string;
    waba_id: string;
  };
}

export function useRealPhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<RealPhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadPhoneNumbers = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);

      // Load phone numbers with WABA info
      const { data: phoneNumbersData } = await supabase
        .from('phone_numbers')
        .select(`
          id,
          display_number,
          status,
          quality_rating,
          mps_target,
          phone_number_id,
          created_at,
          last_health_at,
          wabas(name, waba_id)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: true });

      if (!phoneNumbersData) {
        setPhoneNumbers([]);
        return;
      }

      // Get today's dispatch job stats for each phone number
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const numbersWithStats = await Promise.all(
        phoneNumbersData.map(async (phoneNumber) => {
          // Get today's dispatch jobs for this phone number
          const { data: todayJobs } = await supabase
            .from('dispatch_jobs')
            .select('status')
            .eq('phone_number_ref', phoneNumber.id)
            .gte('created_at', today.toISOString());

          const jobs = todayJobs || [];
          const sent = jobs.length;
          const delivered = jobs.filter(j => j.status === 'DELIVERED').length;
          const failed = jobs.filter(j => j.status === 'FAILED').length;
          const delivery_rate = sent > 0 ? (delivered / sent) * 100 : 0;

          return {
            ...phoneNumber,
            todayStats: {
              sent,
              delivered,
              failed,
              delivery_rate
            },
            waba: phoneNumber.wabas ? {
              name: phoneNumber.wabas.name,
              waba_id: phoneNumber.wabas.waba_id
            } : undefined
          } as RealPhoneNumber;
        })
      );

      setPhoneNumbers(numbersWithStats);

    } catch (error) {
      console.error('Error loading phone numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePhoneNumberStatus = async (id: string, status: 'ACTIVE' | 'PAUSED' | 'BLOCKED') => {
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPhoneNumbers(prev => 
        prev.map(pn => 
          pn.id === id ? { ...pn, status } : pn
        )
      );

    } catch (error) {
      console.error('Error updating phone number status:', error);
      throw error;
    }
  };

  const updateMpsTarget = async (id: string, mps_target: number) => {
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ mps_target })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPhoneNumbers(prev => 
        prev.map(pn => 
          pn.id === id ? { ...pn, mps_target } : pn
        )
      );

    } catch (error) {
      console.error('Error updating MPS target:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
    
    // Refresh every 30 seconds for real-time stats
    const interval = setInterval(loadPhoneNumbers, 30000);
    return () => clearInterval(interval);
  }, [activeWorkspace?.id]);

  return { 
    phoneNumbers, 
    loading, 
    refreshNumbers: loadPhoneNumbers,
    updatePhoneNumberStatus,
    updateMpsTarget
  };
}