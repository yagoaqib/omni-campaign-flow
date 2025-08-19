import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WABACredentials } from "./useWorkspace";

export function useWABACredentials() {
  const [loading, setLoading] = useState(false);

  const getCredentials = useCallback(async (workspaceId: string, wabaId?: string): Promise<WABACredentials[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_waba_credentials' as any, {
        p_workspace_id: workspaceId,
        p_waba_id: wabaId || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get WABA credentials:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCredentials = useCallback(async (
    wabaId: string,
    credentials: {
      name?: string;
      meta_business_id?: string;
      waba_id_text?: string;
      verify_token?: string;
      app_secret?: string;
      access_token?: string;
    }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_waba_credentials' as any, {
        p_waba_id: wabaId,
        p_name: credentials.name || null,
        p_meta_business_id: credentials.meta_business_id || null,
        p_waba_id_text: credentials.waba_id_text || null,
        p_verify_token: credentials.verify_token || null,
        p_app_secret: credentials.app_secret || null,
        p_access_token: credentials.access_token || null
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to update WABA credentials:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWABA = useCallback(async (
    workspaceId: string,
    credentials: {
      name: string;
      meta_business_id: string;
      waba_id: string;
      verify_token?: string;
      app_secret?: string;
      access_token?: string;
    }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_waba_secure' as any, {
        p_workspace_id: workspaceId,
        p_name: credentials.name,
        p_meta_business_id: credentials.meta_business_id,
        p_waba_id: credentials.waba_id,
        p_verify_token: credentials.verify_token || null,
        p_app_secret: credentials.app_secret || null,
        p_access_token: credentials.access_token || null
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to create WABA:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getCredentials,
    updateCredentials,
    createWABA,
  };
}