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

export interface WABACredentials {
  id: string;
  waba_id: string;
  name: string | null;
  access_token: string | null;
  app_secret: string | null;
  verify_token: string | null;
  meta_business_id: string;
}

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

  const updateWaba = useCallback(async (waba: WABAPublic) => {
    try {
      const { error } = await supabase.rpc('update_waba_credentials' as any, {
        p_waba_id: waba.id,
        p_name: waba.name,
        p_meta_business_id: waba.meta_business_id,
        p_waba_id_text: waba.waba_id,
        p_verify_token: null,
        p_app_secret: null,
        p_access_token: null
      });

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

  const createWaba = useCallback(async (wabaData: Partial<WABAPublic>) => {
    if (!activeWorkspace) return false;

    try {
      const { error } = await supabase.rpc('create_waba_secure' as any, {
        p_workspace_id: activeWorkspace.id,
        p_name: wabaData.name || "",
        p_meta_business_id: wabaData.meta_business_id || "",
        p_waba_id: wabaData.waba_id || "",
        p_verify_token: null,
        p_app_secret: null,
        p_access_token: null
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
      // Check if this is the first user (no workspaces exist)
      const { data: existingWorkspaces } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1);

      if (!existingWorkspaces || existingWorkspaces.length === 0) {
        // First user - use setup function with provided name
        const { data: workspaceId, error } = await supabase.rpc('setup_first_user_workspace', { p_name: name });
        
        if (error) throw error;
        
        await loadWorkspaces();
        return { id: workspaceId, name };
      } else {
        // Normal workspace creation - via secure RPC that also inserts membership
        const { data: workspaceId, error: rpcError } = await supabase
          .rpc('create_workspace_for_current_user', { p_name: name });

        if (rpcError) throw rpcError;

        await loadWorkspaces();
        return { id: workspaceId, name } as any;
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
      throw error; // Re-throw to let caller handle it
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