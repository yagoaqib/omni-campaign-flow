import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface CampaignReport {
  id: string;
  name: string;
  status: string;
  created_at: string;
  audience_size: number;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  delivery_rate: number;
  read_rate: number;
  estimated_cost: number;
}

export interface HourlyStats {
  hour: string;
  delivered: number;
  read: number;
}

export function useReportsData() {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadReportsData = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);

      // Load campaigns with dispatch job statistics
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          audiences(total),
          dispatch_jobs(status, sent_at, last_status_at)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      // Process campaign reports
      const campaignReports: CampaignReport[] = (campaignsData || []).map(campaign => {
        const jobs = campaign.dispatch_jobs || [];
        const audience_size = campaign.audiences?.total || 0;
        
        const messages_sent = jobs.length;
        const messages_delivered = jobs.filter(j => j.status === 'DELIVERED').length;
        const messages_read = jobs.filter(j => j.status === 'READ').length;
        const messages_failed = jobs.filter(j => j.status === 'FAILED').length;
        
        const delivery_rate = messages_sent > 0 ? (messages_delivered / messages_sent) * 100 : 0;
        const read_rate = messages_delivered > 0 ? (messages_read / messages_delivered) * 100 : 0;
        
        // Estimate cost based on message count (R$ 0.05 per message as example)
        const estimated_cost = messages_sent * 0.05;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          created_at: campaign.created_at,
          audience_size,
          messages_sent,
          messages_delivered,
          messages_read,
          messages_failed,
          delivery_rate,
          read_rate,
          estimated_cost
        };
      });

      setCampaigns(campaignReports);

      // Generate real hourly statistics from dispatch jobs timestamps
      const hourlyStatsArray = [];
      const now = new Date();
      
      // Create 24 hours of real data based on actual timestamps
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        const hourKey = hourStart.toTimeString().substring(0, 5);
        
        // Count actual delivered and read messages for this hour
        let delivered = 0;
        let read = 0;
        
        (campaignsData || []).forEach(campaign => {
          (campaign.dispatch_jobs || []).forEach(job => {
            // Count delivered messages
            if (job.status === 'DELIVERED' || job.status === 'READ') {
              const sentTime = job.sent_at ? new Date(job.sent_at) : null;
              if (sentTime && sentTime >= hourStart && sentTime < hourEnd) {
                delivered++;
              }
            }
            
            // Count read messages  
            if (job.status === 'READ') {
              const readTime = job.last_status_at ? new Date(job.last_status_at) : null;
              if (readTime && readTime >= hourStart && readTime < hourEnd) {
                read++;
              }
            }
          });
        });
        
        hourlyStatsArray.push({
          hour: hourKey,
          delivered,
          read
        });
      }

      setHourlyStats(hourlyStatsArray);

    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [activeWorkspace?.id]);

  return { campaigns, hourlyStats, loading, refreshData: loadReportsData };
}