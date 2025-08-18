import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  DollarSign,
  Phone,
  Trash2,
  Download
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NumberValidationProps {
  audienceId: string;
  totalContacts: number;
  onValidationComplete?: (results: ValidationResults) => void;
}

interface ValidationResults {
  validNumbers: number;
  invalidNumbers: number;
  totalSavings: number;
}

interface InvalidNumber {
  id: string;
  phone: string;
  name?: string;
  reason: "invalid_format" | "landline" | "no_whatsapp" | "blocked" | "duplicate";
  description: string;
  cost: number;
}

// Remove mock data - will be populated from API

export function NumberValidation({ audienceId, totalContacts, onValidationComplete }: NumberValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [selectedInvalids, setSelectedInvalids] = useState<string[]>([]);
  const [mockInvalidNumbers, setMockInvalidNumbers] = useState<InvalidNumber[]>([]);

  const startValidation = async () => {
    setIsValidating(true);
    
    try {
      const response = await supabase.functions.invoke('validate-numbers', {
        body: { audienceId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { validCount, invalidCount, totalCost } = response.data;
      
      // Get detailed invalid results
      const { data: invalidResults } = await supabase
        .from('number_validation_results')
        .select(`
          id,
          reason,
          description,
          cost,
          contacts!inner(phone)
        `)
        .order('validated_at', { ascending: false });

      const invalidNumbers = (invalidResults || []).map(result => ({
        id: result.id,
        phone: result.contacts.phone,
        reason: result.reason as InvalidNumber['reason'],
        description: result.description || 'Número inválido',
        cost: Number(result.cost)
      }));

      setValidationResults({
        validNumbers: validCount,
        invalidNumbers: invalidCount,
        totalSavings: totalCost
      });

      setMockInvalidNumbers(invalidNumbers);
      setSelectedInvalids(invalidNumbers.map(n => n.phone));
      
      onValidationComplete?.({
        validNumbers: validCount,
        invalidNumbers: invalidCount,
        totalSavings: totalCost
      });
      
    } catch (error) {
      console.error('Validation error:', error);
      toast.error("Erro na validação: " + (error as Error).message);
    } finally {
      setIsValidating(false);
    }
  };

  const removeSelectedInvalids = async () => {
    if (!validationResults || selectedInvalids.length === 0) return;
    
    try {
      // Remove selected invalid numbers from database
      await supabase
        .from('number_validation_results')
        .delete()
        .in('id', mockInvalidNumbers.filter(n => selectedInvalids.includes(n.phone)).map(n => n.id));

      const remaining = mockInvalidNumbers.filter(n => !selectedInvalids.includes(n.phone));
      const removedCount = selectedInvalids.length;
      
      setMockInvalidNumbers(remaining);
      setValidationResults({
        ...validationResults,
        invalidNumbers: remaining.length,
        totalSavings: remaining.reduce((sum, n) => sum + n.cost, 0)
      });
      setSelectedInvalids([]);
      
      toast.success(`${removedCount} números irregulares removidos`);
    } catch (error) {
      console.error('Error removing invalid numbers:', error);
      toast.error("Erro ao remover números irregulares");
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvalids.length === mockInvalidNumbers.length) {
      setSelectedInvalids([]);
    } else {
      setSelectedInvalids(mockInvalidNumbers.map(n => n.phone));
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "landline": return <Phone className="w-4 h-4 text-warning" />;
      case "invalid_format": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "no_whatsapp": return <X className="w-4 h-4 text-muted-foreground" />;
      case "blocked": return <Shield className="w-4 h-4 text-destructive" />;
      case "duplicate": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "landline": return "bg-warning/10 text-warning border-warning/20";
      case "invalid_format": return "bg-destructive/10 text-destructive border-destructive/20";
      case "no_whatsapp": return "bg-muted/10 text-muted-foreground border-muted/20";
      case "blocked": return "bg-destructive/10 text-destructive border-destructive/20";
      case "duplicate": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Validação de Números & Economia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Identifique e remova números irregulares para economizar créditos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {!validationResults && !isValidating && (
          <div className="text-center py-8">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Validar Lista de Contatos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analise {totalContacts.toLocaleString()} contatos e remova números irregulares
            </p>
            <Button onClick={startValidation} className="gap-2">
              <Shield className="w-4 h-4" />
              Iniciar Validação
            </Button>
          </div>
        )}

        {isValidating && (
          <div className="text-center py-8">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Validando números...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analisando formato, WhatsApp e duplicatas
            </p>
            <Progress value={66} className="w-48 mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">
              Processando... 2.847 / 4.335 contatos
            </p>
          </div>
        )}

        {validationResults && (
          <div className="space-y-6">
            {/* Resumo da Validação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-success/50 bg-success/5">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold text-success">{validationResults.validNumbers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Números Válidos</div>
                </CardContent>
              </Card>
              
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold text-warning">{mockInvalidNumbers.length}</div>
                  <div className="text-sm text-muted-foreground">Números Irregulares</div>
                </CardContent>
              </Card>
              
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">R$ {validationResults.totalSavings.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Economia Estimada</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Números Irregulares */}
            {mockInvalidNumbers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Números Irregulares Encontrados</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleSelectAll}
                      className="gap-1"
                    >
                      <Checkbox 
                        checked={selectedInvalids.length === mockInvalidNumbers.length}
                        className="w-3 h-3"
                      />
                      Selecionar Todos
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={removeSelectedInvalids}
                      disabled={selectedInvalids.length === 0}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover Selecionados ({selectedInvalids.length})
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mockInvalidNumbers.map((invalid) => (
                    <div 
                      key={invalid.phone} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${getReasonColor(invalid.reason)}`}
                    >
                      <Checkbox
                        checked={selectedInvalids.includes(invalid.phone)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvalids([...selectedInvalids, invalid.phone]);
                          } else {
                            setSelectedInvalids(selectedInvalids.filter(p => p !== invalid.phone));
                          }
                        }}
                      />
                      
                      {getReasonIcon(invalid.reason)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invalid.phone}</span>
                          {invalid.name && (
                            <span className="text-sm text-muted-foreground">({invalid.name})</span>
                          )}
                        </div>
                        <p className="text-sm">{invalid.description}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">R$ {invalid.cost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">economia</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações Finais */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedInvalids.length > 0 && (
                  <span>
                    {selectedInvalids.length} números selecionados • 
                    Economia: R$ {mockInvalidNumbers
                      .filter(n => selectedInvalids.includes(n.phone))
                      .reduce((sum, n) => sum + n.cost, 0)
                      .toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Irregulares
                </Button>
                <Button 
                  onClick={() => console.log("Lista limpa aplicada")}
                  disabled={selectedInvalids.length === 0}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aplicar Lista Limpa
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}