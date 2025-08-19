import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateStatus {
  id: string;
  phone_number_ref: string;
  status: string;
  review_reason?: string;
  phone_numbers?: {
    display_number: string;
  };
}

interface Props {
  templateId: string;
  templateName: string;
  workspaceId: string;
}

export function TemplateStatusDisplay({ templateId, templateName, workspaceId }: Props) {
  const [statuses, setStatuses] = useState<TemplateStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadStatuses = async () => {
    setLoading(true);
    try {
      // Get template statuses
      const { data: statusData, error: statusError } = await supabase
        .from('template_statuses')
        .select('id, phone_number_ref, status, review_reason')
        .eq('template_id', templateId);

      if (statusError) throw statusError;

      // Get phone numbers separately to avoid relation issues
      const phoneNumberIds = (statusData || []).map(s => s.phone_number_ref);
      const { data: phoneData } = await supabase
        .from('phone_numbers')
        .select('id, display_number')
        .in('id', phoneNumberIds);

      // Combine the data
      const statusesWithNumbers = (statusData || []).map(status => ({
        ...status,
        phone_numbers: phoneData?.find(p => p.id === status.phone_number_ref)
      }));

      setStatuses(statusesWithNumbers);
    } catch (error) {
      console.error('Error loading template statuses:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar status dos templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncTemplate = async () => {
    setLoading(true);
    try {
      // Get all phone numbers for this workspace
      const { data: phoneNumbers } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('workspace_id', workspaceId);

      if (!phoneNumbers || phoneNumbers.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum número encontrado para sincronização",
          variant: "destructive"
        });
        return;
      }

      // Sync template for each phone number
      for (const phoneNumber of phoneNumbers) {
        const response = await supabase.functions.invoke('sync-template-statuses', {
          body: { 
            phoneNumberId: phoneNumber.id,
            workspaceId
          }
        });

        if (response.error) {
          console.error('Sync error for phone:', phoneNumber.id, response.error);
        }
      }

      // Reload statuses
      await loadStatuses();
      
      toast({
        title: "Sucesso",
        description: "Template sincronizado com sucesso"
      });
      
    } catch (error) {
      console.error('Error syncing template:', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, [templateId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-success-soft text-success">Aprovado</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pendente</Badge>;
      case 'REJECTED':
        return <Badge className="bg-destructive-soft text-destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Status por Número - {templateName}</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncTemplate}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && statuses.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando status...</p>
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Nenhum status encontrado. Clique em "Sincronizar" para buscar status da Meta.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {status.phone_numbers?.display_number || status.phone_number_ref}
                  </div>
                  {status.review_reason && (
                    <div className="text-sm text-muted-foreground">
                      {status.review_reason}
                    </div>
                  )}
                </div>
                <div>
                  {getStatusBadge(status.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}