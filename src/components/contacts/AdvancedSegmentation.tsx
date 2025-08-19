import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Users,
  Target,
  Plus,
  Download,
  Zap
} from "lucide-react";
import { useState, useMemo } from "react";
import { Contact, ContactTag } from "@/hooks/useContactsManagement";

import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdvancedSegmentationProps {
  contacts: Contact[];
  tags: ContactTag[];
  onCreateAudience?: (name: string, filters: SegmentationFilters) => void;
}

interface SegmentationFilters {
  tags: string[];
  hasWhatsapp?: boolean;
  source?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  phonePattern?: string;
}

export function AdvancedSegmentation({ contacts, tags, onCreateAudience }: AdvancedSegmentationProps) {
  const [filters, setFilters] = useState<SegmentationFilters>({
    tags: [],
    hasWhatsapp: undefined,
    source: undefined,
    phonePattern: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceName, setAudienceName] = useState("");
  const { activeWorkspace } = useWorkspace();

  // Apply filters to contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Tags filter - contact must have ALL selected tags
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.every(tagId => contact.tags.includes(tagId));

      // WhatsApp filter
      const matchesWhatsapp = filters.hasWhatsapp === undefined || 
        contact.has_whatsapp === filters.hasWhatsapp;

      // Source filter
      const matchesSource = !filters.source || contact.source === filters.source;

      // Phone pattern filter
      const matchesPhone = !filters.phonePattern || 
        contact.phone.includes(filters.phonePattern);

      return matchesSearch && matchesTags && matchesWhatsapp && matchesSource && matchesPhone;
    });
  }, [contacts, filters, searchTerm]);

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    return Array.from(new Set(contacts.map(c => c.source))).sort();
  }, [contacts]);

  const toggleTag = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      tags: [],
      hasWhatsapp: undefined,
      source: undefined,
      phonePattern: ""
    });
    setSearchTerm("");
  };

  const exportSegment = () => {
    const csvData = filteredContacts.map(contact => ({
      name: contact.name || "",
      phone: contact.phone,
      email: contact.email || "",
      source: contact.source,
      hasWhatsapp: contact.has_whatsapp ? "Sim" : "Não",
      tags: contact.tags.map(tagId => tags.find(t => t.id === tagId)?.name).filter(Boolean).join(", ")
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segmento-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createAudience = async () => {
    if (!audienceName.trim() || !activeWorkspace?.id) {
      toast.error("Nome da audiência é obrigatório");
      return;
    }

    try {
      // Create audience
      const { data: audience, error: audienceError } = await supabase
        .from('audiences')
        .insert({
          name: audienceName,
          workspace_id: activeWorkspace.id,
          total: filteredContacts.length,
          valid_count: filteredContacts.filter(c => c.has_whatsapp).length,
          invalid_count: filteredContacts.filter(c => !c.has_whatsapp).length
        })
        .select()
        .single();

      if (audienceError) throw audienceError;

      // Add contacts to audience
      const audienceItems = filteredContacts.map(contact => ({
        audience_id: audience.id,
        e164: contact.phone,
        raw_msisdn: contact.phone,
        validation_status: contact.has_whatsapp ? 'VALID' : 'INVALID'
      }));

      const { error: itemsError } = await supabase
        .from('audience_items')
        .insert(audienceItems);

      if (itemsError) throw itemsError;

      toast.success(`Audiência "${audienceName}" criada com ${filteredContacts.length} contatos`);
      setAudienceName("");
      onCreateAudience?.(audienceName, filters);

    } catch (error) {
      console.error('Error creating audience:', error);
      toast.error('Erro ao criar audiência');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Segmentação Avançada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Search and Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={filters.hasWhatsapp?.toString() || "all"} 
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              hasWhatsapp: value === "all" ? undefined : value === "true" 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="WhatsApp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Com WhatsApp</SelectItem>
              <SelectItem value="false">Sem WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.source || "all"} 
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              source: value === "all" ? undefined : value 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {uniqueSources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone Pattern Filter */}
        <div>
          <Label htmlFor="phonePattern">Filtro por padrão de telefone</Label>
          <Input
            id="phonePattern"
            placeholder="Ex: 11, 21, 85..."
            value={filters.phonePattern}
            onChange={(e) => setFilters(prev => ({ ...prev, phonePattern: e.target.value }))}
          />
        </div>

        {/* Tags Filter */}
        <div className="space-y-3">
          <Label>Filtrar por tags (deve ter TODAS as tags selecionadas)</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={filters.tags.includes(tag.id) ? "default" : "outline"}
                className={`cursor-pointer ${filters.tags.includes(tag.id) ? tag.color + " text-white" : ""}`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
                {filters.tags.includes(tag.id) && " ✓"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{filteredContacts.length} contatos encontrados</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredContacts.filter(c => c.has_whatsapp).length} com WhatsApp
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={exportSegment} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Create Audience */}
        <div className="space-y-3 p-4 border rounded-lg">
          <Label htmlFor="audienceName">Criar audiência com estes contatos</Label>
          <div className="flex gap-2">
            <Input
              id="audienceName"
              placeholder="Nome da audiência..."
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
            />
            <Button 
              onClick={createAudience} 
              disabled={!audienceName.trim() || filteredContacts.length === 0}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Criar Audiência
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            A audiência será criada com {filteredContacts.length} contatos para uso em campanhas
          </p>
        </div>

        {/* Contact Preview */}
        {filteredContacts.length > 0 && (
          <div className="space-y-3">
            <Label>Preview dos contatos (primeiros 5)</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredContacts.slice(0, 5).map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div>
                    <div className="font-medium">{contact.name || "Sem nome"}</div>
                    <div className="text-muted-foreground">{contact.phone} • {contact.source}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contact.has_whatsapp ? 'bg-success' : 'bg-muted'}`} />
                    <div className="flex gap-1">
                      {contact.tags.slice(0, 2).map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ) : null;
                      })}
                      {contact.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{contact.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredContacts.length > 5 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {filteredContacts.length - 5} contatos
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}