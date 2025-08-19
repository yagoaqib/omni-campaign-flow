import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const uploadAvatar = useCallback(async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      await supabase.storage
        .from('avatars')
        .remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload do avatar",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

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
    uploadAvatar,
    getInitials,
  };
}