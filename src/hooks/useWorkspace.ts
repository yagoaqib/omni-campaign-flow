import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type WABAFull = Database["public"]["Tables"]["wabas"]["Row"];
type WABAPublic = Pick<
  Database["public"]["Tables"]["wabas"]["Row"], 
  "id" | "name" | "waba_id" | "meta_business_id" | "workspace_id" | "created_at"
>;

// Export types for use in other components
export type { WABAFull, WABAPublic };

export function useWorkspace() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wabas, setWabas] = useState<WABAPublic[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    console.log("useWorkspace - loadWorkspaces called");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("name");

      if (error) throw error;
      console.log("useWorkspace - workspaces loaded:", data);
      setWorkspaces(data || []);
      if (!activeWorkspace && data?.length) {
        const firstWorkspace = data[0];
        console.log("useWorkspace - setting activeWorkspace:", firstWorkspace);
        setActiveWorkspace(firstWorkspace);
        await loadWabas(firstWorkspace.id);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  const loadWabas = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from("wabas")
        .select("id, name, waba_id, meta_business_id, workspace_id, created_at")
        .eq("workspace_id", workspaceId)
        .order("name");

      if (error) throw error;
      setWabas(data || []);
    } catch (error) {
      console.error("Failed to load WABAs:", error);
    }
  }, []);

  const switchWorkspace = useCallback(async (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    await loadWabas(workspace.id);
  }, [loadWabas]);

  const updateWaba = useCallback(async (waba: WABAFull) => {
    try {
      const { error } = await supabase
        .from("wabas")
        .update({
          verify_token: waba.verify_token,
          app_secret: waba.app_secret,
          access_token: waba.access_token,
          name: waba.name,
          meta_business_id: waba.meta_business_id,
          waba_id: waba.waba_id,
        })
        .eq("id", waba.id);

      if (error) throw error;
      
      // Reload WABAs for current workspace
      if (activeWorkspace) {
        await loadWabas(activeWorkspace.id);
      }
      return true;
    } catch (error) {
      console.error("Failed to update WABA:", error);
      return false;
    }
  }, [activeWorkspace, loadWabas]);

  const createWaba = useCallback(async (wabaData: Partial<WABAFull>) => {
    if (!activeWorkspace) return false;

    try {
      const { error } = await supabase
        .from("wabas")
        .insert({
          workspace_id: activeWorkspace.id,
          name: wabaData.name || "",
          meta_business_id: wabaData.meta_business_id || "",
          waba_id: wabaData.waba_id || "",
          verify_token: wabaData.verify_token,
          app_secret: wabaData.app_secret,
          access_token: wabaData.access_token,
        });

      if (error) throw error;
      
      // Reload WABAs for current workspace
      await loadWabas(activeWorkspace.id);
      return true;
    } catch (error) {
      console.error("Failed to create WABA:", error);
      return false;
    }
  }, [activeWorkspace, loadWabas]);

  const createWorkspace = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      
      await loadWorkspaces();
      return data;
    } catch (error) {
      console.error("Failed to create workspace:", error);
      return null;
    }
  }, [loadWorkspaces]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);

      if (error) throw error;
      
      // If we deleted the active workspace, switch to first available
      if (activeWorkspace?.id === workspaceId) {
        await loadWorkspaces();
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
        if (remainingWorkspaces.length > 0) {
          setActiveWorkspace(remainingWorkspaces[0]);
        } else {
          setActiveWorkspace(null);
        }
      } else {
        await loadWorkspaces();
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      return false;
    }
  }, [activeWorkspace, workspaces, loadWorkspaces]);

  return {
    activeWorkspace,
    workspaces,
    wabas,
    loading,
    loadWorkspaces,
    loadWabas,
    switchWorkspace,
    updateWaba,
    createWaba,
    createWorkspace,
    deleteWorkspace,
  };
}