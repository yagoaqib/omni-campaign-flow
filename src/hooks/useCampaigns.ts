import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type DispatchJob = Database["public"]["Tables"]["dispatch_jobs"]["Row"];

export interface CampaignWithStats {
  id: string;
  name: string;
  status: string;
  created_at?: string;
  deadline_at?: string;
  workspace_id: string;
  audience_id?: string;
  desired_category: string;
  // Stats calculadas
  progress: number;
  sent: number;
  delivered: number;
  seen: number;
  failed: number;
  type: string;
  provider: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar campanhas com estatísticas
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Para cada campanha, buscar estatísticas dos dispatch jobs
      const campaignsWithStats: CampaignWithStats[] = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: jobs, error: jobsError } = await supabase
            .from("dispatch_jobs")
            .select("status")
            .eq("campaign_id", campaign.id);

          let stats = {
            sent: 0,
            delivered: 0,
            seen: 0,
            failed: 0,
            progress: 0
          };

          if (!jobsError && jobs) {
            const totalJobs = jobs.length;
            const sentJobs = jobs.filter(j => j.status === "SENT").length;
            const deliveredJobs = jobs.filter(j => j.status === "DELIVERED").length;
            const seenJobs = jobs.filter(j => j.status === "READ").length;
            const failedJobs = jobs.filter(j => j.status === "FAILED").length;

            stats = {
              sent: sentJobs,
              delivered: deliveredJobs,
              seen: seenJobs,
              failed: failedJobs,
              progress: totalJobs > 0 ? Math.round((sentJobs / totalJobs) * 100) : 0
            };
          }

          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            created_at: campaign.created_at,
            deadline_at: campaign.deadline_at,
            workspace_id: campaign.workspace_id,
            audience_id: campaign.audience_id,
            desired_category: campaign.desired_category,
            type: "Template", // Default type
            provider: "Meta", // Default provider, será pego dos números depois
            ...stats
          };
        })
      );

      setCampaigns(campaignsWithStats);

    } catch (error) {
      console.error("Failed to load campaigns:", error);
      toast({
        title: "Erro ao carregar campanhas",
        description: "Não foi possível carregar as campanhas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Criar nova campanha
  const createCampaign = useCallback(async (
    name: string,
    workspaceId: string,
    audienceId?: string,
    desiredCategory: string = "UTILITY"
  ) => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert([{
          name,
          workspace_id: workspaceId,
          audience_id: audienceId,
          desired_category: desiredCategory,
          status: "DRAFT"
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Campanha criada",
        description: `Campanha "${name}" criada com sucesso.`,
      });

      await loadCampaigns();
      return data;

    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast({
        title: "Erro ao criar campanha",
        description: "Não foi possível criar a campanha.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadCampaigns]);

  // Atualizar status da campanha
  const updateCampaignStatus = useCallback(async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status })
        .eq("id", campaignId);

      if (error) throw error;

      // Atualizar estado local
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status } : campaign
      ));

      toast({
        title: "Status atualizado",
        description: `Campanha ${status === "RUNNING" ? "iniciada" : "pausada"}.`,
      });

    } catch (error) {
      console.error("Failed to update campaign status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da campanha.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Duplicar campanha
  const duplicateCampaign = useCallback(async (campaignId: string) => {
    try {
      const { data: originalCampaign, error: fetchError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("campaigns")
        .insert([{
          name: `${originalCampaign.name} (Cópia)`,
          workspace_id: originalCampaign.workspace_id,
          audience_id: originalCampaign.audience_id,
          desired_category: originalCampaign.desired_category,
          status: "DRAFT"
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Campanha duplicada",
        description: "Campanha duplicada com sucesso.",
      });

      await loadCampaigns();
      return data;

    } catch (error) {
      console.error("Failed to duplicate campaign:", error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a campanha.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadCampaigns]);

  // Deletar campanha
  const deleteCampaign = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      // Remover do estado local
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));

      toast({
        title: "Campanha deletada",
        description: "Campanha removida com sucesso.",
      });

    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a campanha.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    loadCampaigns,
    createCampaign,
    updateCampaignStatus,
    duplicateCampaign,
    deleteCampaign
  };
}