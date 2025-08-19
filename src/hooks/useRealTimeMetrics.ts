import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface RealTimeMetrics {
  campaigns: {
    total: number;
    active: number;
    draft: number;
    completed: number;
  };
  messages: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
  };
  numbers: {
    total: number;
    active: number;
    high_quality: number;
    medium_quality: number;
    low_quality: number;
  };
  audiences: {
    total: number;
    valid_contacts: number;
    invalid_contacts: number;
  };
  costs: {
    today: number;
    this_month: number;
    total: number;
  };
}

export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    campaigns: { total: 0, active: 0, draft: 0, completed: 0 },
    messages: { sent: 0, delivered: 0, read: 0, failed: 0, deliveryRate: 0, readRate: 0 },
    numbers: { total: 0, active: 0, high_quality: 0, medium_quality: 0, low_quality: 0 },
    audiences: { total: 0, valid_contacts: 0, invalid_contacts: 0 },
    costs: { today: 0, this_month: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadMetrics = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);

      // Load campaigns metrics
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status')
        .eq('workspace_id', activeWorkspace.id);

      const campaignStats = (campaigns || []).reduce(
        (acc, campaign) => {
          acc.total++;
          if (campaign.status === 'ACTIVE') acc.active++;
          else if (campaign.status === 'DRAFT') acc.draft++;
          else if (campaign.status === 'COMPLETED') acc.completed++;
          return acc;
        },
        { total: 0, active: 0, draft: 0, completed: 0 }
      );

      // Load dispatch jobs (messages) metrics
      const { data: jobs } = await supabase
        .from('dispatch_jobs')
        .select(`
          status,
          campaigns!inner(workspace_id)
        `)
        .eq('campaigns.workspace_id', activeWorkspace.id);

      const messageStats = (jobs || []).reduce(
        (acc, job) => {
          if (job.status === 'SENT') acc.sent++;
          else if (job.status === 'DELIVERED') acc.delivered++;
          else if (job.status === 'READ') acc.read++;
          else if (job.status === 'FAILED') acc.failed++;
          return acc;
        },
        { sent: 0, delivered: 0, read: 0, failed: 0 }
      );

      const deliveryRate = messageStats.sent > 0 ? (messageStats.delivered / messageStats.sent) * 100 : 0;
      const readRate = messageStats.delivered > 0 ? (messageStats.read / messageStats.delivered) * 100 : 0;

      // Load phone numbers metrics
      const { data: phoneNumbers } = await supabase
        .from('phone_numbers')
        .select('status, quality_rating')
        .eq('workspace_id', activeWorkspace.id);

      const numberStats = (phoneNumbers || []).reduce(
        (acc, number) => {
          acc.total++;
          if (number.status === 'ACTIVE') acc.active++;
          if (number.quality_rating === 'HIGH') acc.high_quality++;
          else if (number.quality_rating === 'MEDIUM') acc.medium_quality++;
          else if (number.quality_rating === 'LOW') acc.low_quality++;
          return acc;
        },
        { total: 0, active: 0, high_quality: 0, medium_quality: 0, low_quality: 0 }
      );

      // Load audiences metrics
      const { data: audiences } = await supabase
        .from('audiences')
        .select('total, valid_count, invalid_count')
        .eq('workspace_id', activeWorkspace.id);

      const audienceStats = (audiences || []).reduce(
        (acc, audience) => {
          acc.total += audience.total || 0;
          acc.valid_contacts += audience.valid_count || 0;
          acc.invalid_contacts += audience.invalid_count || 0;
          return acc;
        },
        { total: 0, valid_contacts: 0, invalid_contacts: 0 }
      );

      // Load costs from validation results
      const { data: validationResults } = await supabase
        .from('number_validation_results')
        .select(`
          cost,
          created_at,
          contacts!inner(workspace_id)
        `)
        .eq('contacts.workspace_id', activeWorkspace.id);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const costStats = (validationResults || []).reduce(
        (acc, result) => {
          const cost = Number(result.cost) || 0;
          const resultDate = new Date(result.created_at);
          
          acc.total += cost;
          if (resultDate >= today) acc.today += cost;
          if (resultDate >= thisMonth) acc.this_month += cost;
          
          return acc;
        },
        { today: 0, this_month: 0, total: 0 }
      );

      setMetrics({
        campaigns: campaignStats,
        messages: { ...messageStats, deliveryRate, readRate },
        numbers: numberStats,
        audiences: audienceStats,
        costs: costStats
      });

    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [activeWorkspace?.id]);

  return { metrics, loading, refreshMetrics: loadMetrics };
}