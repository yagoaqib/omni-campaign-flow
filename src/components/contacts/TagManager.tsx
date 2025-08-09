import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tags, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Target,
  TrendingUp,
  ShoppingCart,
  Heart,
  Star
} from "lucide-react";
import { useState } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
  category: "funnel" | "behavior" | "custom";
  description?: string;
  contactCount: number;
}

interface TagManagerProps {
  onTagsChange?: (tags: Tag[]) => void;
}

const defaultTags: Tag[] = [
  // Funil de Vendas
  { id: "lead", name: "Lead", color: "bg-blue-500", category: "funnel", description: "Contato inicial", contactCount: 1247 },
  { id: "prospect", name: "Prospect", color: "bg-yellow-500", category: "funnel", description: "Interesse demonstrado", contactCount: 892 },
  { id: "customer", name: "Cliente", color: "bg-green-500", category: "funnel", description: "Comprou pelo menos 1x", contactCount: 2156 },
  { id: "vip", name: "VIP", color: "bg-purple-500", category: "funnel", description: "Cliente premium", contactCount: 234 },
  
  // Comportamento
  { id: "engaged", name: "Engajado", color: "bg-emerald-500", category: "behavior", description: "Abre e interage", contactCount: 3421 },
  { id: "cart_abandon", name: "Carrinho Abandonado", color: "bg-orange-500", category: "behavior", description: "Adicionou mas não comprou", contactCount: 756 },
  { id: "inactive", name: "Inativo", color: "bg-gray-500", category: "behavior", description: "Sem interação há 30+ dias", contactCount: 445 },
  
  // Personalizadas
  { id: "black_friday", name: "Black Friday 2024", color: "bg-red-500", category: "custom", description: "Campanha especial", contactCount: 1890 },
];

const tagColors = [
  "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", 
  "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-gray-500"
];

const categoryIcons = {
  funnel: <Target className="w-4 h-4" />,
  behavior: <TrendingUp className="w-4 h-4" />,
  custom: <Star className="w-4 h-4" />
};

export function TagManager({ onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>(defaultTags);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({
    name: "",
    color: "bg-blue-500",
    category: "custom" as Tag["category"],
    description: ""
  });

  const saveTag = () => {
    if (!newTag.name.trim()) return;
    
    const tag: Tag = {
      id: editingTag?.id || Date.now().toString(),
      name: newTag.name,
      color: newTag.color,
      category: newTag.category,
      description: newTag.description,
      contactCount: editingTag?.contactCount || 0
    };

    if (editingTag) {
      setTags(tags.map(t => t.id === editingTag.id ? tag : t));
    } else {
      setTags([...tags, tag]);
    }

    resetForm();
    onTagsChange?.(tags);
  };

  const deleteTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id));
    onTagsChange?.(tags);
  };

  const editTag = (tag: Tag) => {
    setEditingTag(tag);
    setNewTag({
      name: tag.name,
      color: tag.color,
      category: tag.category,
      description: tag.description || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setNewTag({ name: "", color: "bg-blue-500", category: "custom", description: "" });
    setEditingTag(null);
    setIsDialogOpen(false);
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "funnel": return "Funil de Vendas";
      case "behavior": return "Comportamento"; 
      case "custom": return "Personalizada";
      default: return category;
    }
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Gerenciar Tags
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => resetForm()}>
                <Plus className="w-4 h-4" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? "Editar Tag" : "Criar Nova Tag"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tagName">Nome da Tag</Label>
                  <Input
                    id="tagName"
                    value={newTag.name}
                    onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                    placeholder="Ex: Lead Qualificado"
                  />
                </div>

                <div>
                  <Label htmlFor="tagCategory">Categoria</Label>
                  <Select 
                    value={newTag.category} 
                    onValueChange={(value: Tag["category"]) => setNewTag({...newTag, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funnel">Funil de Vendas</SelectItem>
                      <SelectItem value="behavior">Comportamento</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cor da Tag</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full ${color} border-2 ${
                          newTag.color === color ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => setNewTag({...newTag, color})}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tagDescription">Descrição (opcional)</Label>
                  <Input
                    id="tagDescription"
                    value={newTag.description}
                    onChange={(e) => setNewTag({...newTag, description: e.target.value})}
                    placeholder="Descreva quando usar esta tag"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={saveTag} className="gap-2">
                    <Save className="w-4 h-4" />
                    {editingTag ? "Salvar Alterações" : "Criar Tag"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {Object.entries(groupedTags).map(([category, categoryTags]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              {categoryIcons[category as keyof typeof categoryIcons]}
              <h4 className="font-medium">{getCategoryName(category)}</h4>
              <Badge variant="outline">{categoryTags.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge className={`${tag.color} text-white`}>
                    {tag.name}
                  </Badge>
                  
                  <div className="flex-1">
                    {tag.description && (
                      <p className="text-sm text-muted-foreground">{tag.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {tag.contactCount.toLocaleString()} contatos
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editTag(tag)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTag(tag.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Tags className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tag criada ainda</p>
            <p className="text-sm">Crie tags para organizar seus contatos por estágio do funil</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}