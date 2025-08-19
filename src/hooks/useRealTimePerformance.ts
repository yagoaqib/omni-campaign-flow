import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface NumberPerformance {
  id: string;
  label: string;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'PAUSED' | 'BLOCKED';
  displayNumber: string;
  mpsTarget: number;
  messagesPerSecond: number;
  totalSent: number;
  lastUpdated: string;
}

export function useRealTimePerformance() {
  const { activeWorkspace } = useWorkspace();
  const [performances, setPerformances] = useState<NumberPerformance[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadPerformanceData = async () => {
    if (!activeWorkspace?.id || !isMonitoring) return;

    try {
      setLoading(true);

      // Get phone numbers with their recent dispatch jobs
      const { data: phoneNumbers } = await supabase
        .from('phone_numbers')
        .select(`
          id,
          display_number,
          quality_rating,
          status,
          mps_target
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'ACTIVE');

      if (!phoneNumbers) return;

      // Get recent dispatch jobs for rate calculation (last 60 seconds)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: recentJobs } = await supabase
        .from('dispatch_jobs')
        .select(`
          phone_number_ref,
          sent_at,
          campaign_id,
          campaigns!inner(workspace_id)
        `)
        .eq('campaigns.workspace_id', activeWorkspace.id)
        .gte('sent_at', oneMinuteAgo)
        .not('sent_at', 'is', null);

      // Get total sent count for each number (today)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayJobs } = await supabase
        .from('dispatch_jobs')
        .select(`
          phone_number_ref,
          campaign_id,
          campaigns!inner(workspace_id)
        `)
        .eq('campaigns.workspace_id', activeWorkspace.id)
        .gte('sent_at', todayStart.toISOString())
        .not('sent_at', 'is', null);

      // Calculate performance metrics
      const performanceData: NumberPerformance[] = phoneNumbers.map(phone => {
        // Count messages sent in last minute for rate calculation
        const recentCount = (recentJobs || []).filter(
          job => job.phone_number_ref === phone.id
        ).length;
        
        // Count total messages sent today
        const todayCount = (todayJobs || []).filter(
          job => job.phone_number_ref === phone.id
        ).length;

        return {
          id: phone.id,
          label: phone.display_number,
          quality: phone.quality_rating as 'HIGH' | 'MEDIUM' | 'LOW',
          status: phone.status as 'ACTIVE' | 'PAUSED' | 'BLOCKED',
          displayNumber: phone.display_number,
          mpsTarget: phone.mps_target,
          messagesPerSecond: recentCount / 60, // Convert to messages per second
          totalSent: todayCount,
          lastUpdated: new Date().toISOString()
        };
      });

      setPerformances(performanceData);

    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates every 5 seconds when monitoring
  useEffect(() => {
    if (!isMonitoring) {
      setPerformances([]);
      return;
    }

    // Load initial data
    loadPerformanceData();

    // Set up interval for updates
    const interval = setInterval(loadPerformanceData, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring, activeWorkspace?.id]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const totalRate = performances.reduce((sum, p) => sum + p.messagesPerSecond, 0);
  const activeNumbers = performances.filter(p => p.status === "ACTIVE").length;
  const bestPerformer = performances.reduce((best, current) => 
    current.messagesPerSecond > best.messagesPerSecond ? current : best, 
    performances[0] || { messagesPerSecond: 0, label: "N/A" }
  );

  return {
    performances,
    isMonitoring,
    loading,
    toggleMonitoring,
    totalRate,
    activeNumbers,
    bestPerformer,
    refreshData: loadPerformanceData
  };
}