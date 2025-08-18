import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type PhoneNumber = Database["public"]["Tables"]["phone_numbers"]["Row"];
type WABA = Database["public"]["Tables"]["wabas"]["Row"];

export interface PhoneNumberWithWaba extends PhoneNumber {
  waba?: WABA;
  label: string;
  provider: "meta" | "infobip" | "gupshup";
  usage?: "marketing" | "transacional" | "ambos";
  pools?: string[];
  canFallback: boolean;
}

export function usePhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberWithWaba[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar números de telefone
  const loadPhoneNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select(`
          *,
          wabas!waba_ref (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const numbersWithWaba: PhoneNumberWithWaba[] = (data || []).map(number => ({
        ...number,
        waba: (number as any).wabas,
        label: `${number.display_number}`,
        provider: "meta" as const, // Default provider
        canFallback: true,
        usage: undefined,
        pools: undefined
      }));

      setPhoneNumbers(numbersWithWaba);

    } catch (error) {
      console.error("Failed to load phone numbers:", error);
      toast({
        title: "Erro ao carregar números",
        description: "Não foi possível carregar os números de telefone.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Salvar novo número
  const savePhoneNumber = useCallback(async (
    numberData: {
      display_number: string;
      phone_number_id: string;
      waba_ref: string;
      workspace_id: string;
      mps_target: number;
      quality_rating?: string;
      status?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from("phone_numbers")
        .insert([{
          ...numberData,
          quality_rating: numberData.quality_rating || "UNKNOWN",
          status: numberData.status || "ACTIVE"
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Número salvo",
        description: `Número ${numberData.display_number} salvo com sucesso.`,
      });

      await loadPhoneNumbers();
      return data;

    } catch (error) {
      console.error("Failed to save phone number:", error);
      toast({
        title: "Erro ao salvar número",
        description: "Não foi possível salvar o número de telefone.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadPhoneNumbers]);

  // Atualizar número
  const updatePhoneNumber = useCallback(async (
    numberId: string,
    updates: Partial<PhoneNumber>
  ) => {
    try {
      const { error } = await supabase
        .from("phone_numbers")
        .update(updates)
        .eq("id", numberId);

      if (error) throw error;

      // Atualizar estado local
      setPhoneNumbers(prev => prev.map(number => 
        number.id === numberId ? { ...number, ...updates } : number
      ));

      toast({
        title: "Número atualizado",
        description: "Número de telefone atualizado com sucesso.",
      });

    } catch (error) {
      console.error("Failed to update phone number:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o número de telefone.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Deletar número
  const deletePhoneNumber = useCallback(async (numberId: string) => {
    try {
      const { error } = await supabase
        .from("phone_numbers")
        .delete()
        .eq("id", numberId);

      if (error) throw error;

      // Remover do estado local
      setPhoneNumbers(prev => prev.filter(number => number.id !== numberId));

      toast({
        title: "Número removido",
        description: "Número de telefone removido com sucesso.",
      });

    } catch (error) {
      console.error("Failed to delete phone number:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o número de telefone.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadPhoneNumbers();
  }, [loadPhoneNumbers]);

  return {
    phoneNumbers,
    loading,
    loadPhoneNumbers,
    savePhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber
  };
}