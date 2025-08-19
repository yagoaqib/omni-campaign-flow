import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async (workspaceId: string) => {
    if (!workspaceId) {
      console.error("No workspaceId provided to loadProfile");
      return;
    }
    
    console.log("Loading profile for workspace:", workspaceId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Database error loading profile:", error);
        throw error;
      }

      if (data) {
        console.log("Profile loaded successfully:", data);
        setProfile(data);
      } else {
        console.log("No profile found, creating default profile");
        // Create default profile if none exists
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            workspace_id: workspaceId,
            name: "Usuário"
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating default profile:", createError);
          throw createError;
        }
        console.log("Default profile created:", newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) {
      console.error("No profile loaded");
      return false;
    }

    console.log("Updating profile:", { profileId: profile.id, updates });

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Profile updated successfully:", data);
      setProfile(data);
      return true;
    } catch (error) {
      console.error("Failed to update profile:", error);
      return false;
    }
  }, [profile]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return {
    profile,
    loading,
    loadProfile,
    updateProfile,
    getInitials,
  };
}