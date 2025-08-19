import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  UserPlus, 
  Tags,
  Phone,
  Mail,
  Calendar,
  Target,
  Plus
} from "lucide-react";
import { useState } from "react";
import { ContactTag } from "@/hooks/useContactsManagement";

interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  source: string;
  hasWhatsapp: boolean;
  lastContact?: string;
  tags: string[];
}

interface ContactTaggingProps {
  tags: ContactTag[];
  contacts: Contact[];
  onContactUpdate?: (contactId: string, newTags: string[]) => Promise<void>;
}

export function ContactTagging({ tags, contacts: initialContacts, onContactUpdate }: ContactTaggingProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  // Criar um mapa de tags para facilitar a busca
  const tagMap = tags.reduce((acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  }, {} as Record<string, ContactTag>);

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || "Sem nome";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === "all" || contact.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  // Aplicar tags em massa
  const applyTagsToSelected = async (tagIds: string[]) => {
    try {
      for (const contactId of selectedContacts) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          const updatedTags = [...new Set([...contact.tags, ...tagIds])];
          await onContactUpdate?.(contactId, updatedTags);
        }
      }
      // Reload contacts to show updated tags
      window.location.reload(); // TODO: improve this with proper state management
    } catch (error) {
      console.error('Error applying tags:', error);
    }
    setSelectedContacts([]);
    setIsTagDialogOpen(false);
  };

  // Remover tag específica de um contato
  const removeTagFromContact = async (contactId: string, tagId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        const updatedTags = contact.tags.filter(t => t !== tagId);
        await onContactUpdate?.(contactId, updatedTags);
        window.location.reload(); // TODO: improve this with proper state management
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  // Adicionar tag específica a um contato
  const addTagToContact = async (contactId: string, tagId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (contact && !contact.tags.includes(tagId)) {
        const updatedTags = [...contact.tags, tagId];
        await onContactUpdate?.(contactId, updatedTags);
        window.location.reload(); // TODO: improve this with proper state management
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  // Toggle seleção de contato
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Selecionar todos os contatos filtrados
  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Contatos com Tags
          </CardTitle>
          
          {selectedContacts.length > 0 && (
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Tags className="w-4 h-4" />
                  Aplicar Tags ({selectedContacts.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aplicar Tags aos Contatos Selecionados</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione as tags para aplicar aos {selectedContacts.length} contatos selecionados:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {tags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              applyTagsToSelected([tag.id]);
                            }
                          }}
                        />
                        <Badge className={`${tag.color} text-white`}>
                          {tag.name}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Filtros */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Header da Lista */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            {filteredContacts.length} contatos
            {selectedContacts.length > 0 && ` • ${selectedContacts.length} selecionados`}
          </span>
        </div>

        {/* Lista de Contatos */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30">
              <Checkbox
                checked={selectedContacts.includes(contact.id)}
                onCheckedChange={() => toggleContactSelection(contact.id)}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{contact.name || "Sem nome"}</span>
                    <div className={`w-2 h-2 rounded-full ${contact.hasWhatsapp ? 'bg-success' : 'bg-muted'}`} />
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {contact.source}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span>{contact.phone}</span>
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </span>
                  )}
                  {contact.lastContact && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {contact.lastContact}
                    </span>
                  )}
                </div>
                
                {/* Tags do Contato */}
                <div className="flex items-center gap-2 flex-wrap">
                  {contact.tags.map(tagId => {
                    const tag = tagMap[tagId];
                    if (!tag) return null;
                    
                    return (
                      <Badge 
                        key={tagId} 
                        className={`${tag.color} text-white cursor-pointer hover:opacity-80`}
                        onClick={() => removeTagFromContact(contact.id, tagId)}
                      >
                        {tag.name} ×
                      </Badge>
                    );
                  })}
                  
                  {/* Adicionar Tag Rápida */}
                  <Select onValueChange={(tagId) => addTagToContact(contact.id, tagId)}>
                    <SelectTrigger className="w-auto h-6 text-xs">
                      <Plus className="w-3 h-3" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.filter(tag => !contact.tags.includes(tag.id)).map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum contato encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}