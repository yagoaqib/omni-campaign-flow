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

interface NumberValidationProps {
  audienceId: string;
  totalContacts: number;
  onValidationComplete?: (results: ValidationResults) => void;
}

interface ValidationResults {
  valid: number;
  invalid: InvalidNumber[];
  totalSavings: number;
}

interface InvalidNumber {
  phone: string;
  name?: string;
  reason: "invalid_format" | "landline" | "no_whatsapp" | "blocked" | "duplicate";
  description: string;
  cost: number;
}

const mockInvalidNumbers: InvalidNumber[] = [
  {
    phone: "+55 11 3333-3333",
    name: "João Silva",
    reason: "landline",
    description: "Número fixo - não tem WhatsApp",
    cost: 0.08
  },
  {
    phone: "+55 21 9999-999",
    name: "Maria Santos", 
    reason: "invalid_format",
    description: "Formato inválido - dígitos insuficientes",
    cost: 0.08
  },
  {
    phone: "+55 85 77777-7777",
    name: "Pedro Costa",
    reason: "no_whatsapp",
    description: "Número válido mas sem WhatsApp",
    cost: 0.08
  },
  {
    phone: "+55 11 99999-9999",
    name: "Ana Lima",
    reason: "duplicate",
    description: "Número duplicado na lista",
    cost: 0.08
  },
  {
    phone: "+55 21 88888-8888",
    name: "Carlos Souza",
    reason: "blocked",
    description: "Número bloqueado (opt-out)",
    cost: 0.08
  },
];

export function NumberValidation({ audienceId, totalContacts, onValidationComplete }: NumberValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [selectedInvalids, setSelectedInvalids] = useState<string[]>([]);

  const startValidation = async () => {
    setIsValidating(true);
    
    // Simular validação
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const results: ValidationResults = {
      valid: totalContacts - mockInvalidNumbers.length,
      invalid: mockInvalidNumbers,
      totalSavings: mockInvalidNumbers.reduce((sum, num) => sum + num.cost, 0)
    };
    
    setValidationResults(results);
    setSelectedInvalids(mockInvalidNumbers.map(n => n.phone));
    setIsValidating(false);
    onValidationComplete?.(results);
  };

  const removeSelectedInvalids = () => {
    if (!validationResults) return;
    
    const remaining = validationResults.invalid.filter(n => !selectedInvalids.includes(n.phone));
    const removedSavings = validationResults.invalid
      .filter(n => selectedInvalids.includes(n.phone))
      .reduce((sum, n) => sum + n.cost, 0);
    
    setValidationResults({
      ...validationResults,
      invalid: remaining,
      totalSavings: removedSavings
    });
    setSelectedInvalids([]);
  };

  const toggleSelectAll = () => {
    if (!validationResults) return;
    
    if (selectedInvalids.length === validationResults.invalid.length) {
      setSelectedInvalids([]);
    } else {
      setSelectedInvalids(validationResults.invalid.map(n => n.phone));
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
                  <div className="text-2xl font-bold text-success">{validationResults.valid.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Números Válidos</div>
                </CardContent>
              </Card>
              
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold text-warning">{validationResults.invalid.length}</div>
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
            {validationResults.invalid.length > 0 && (
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
                        checked={selectedInvalids.length === validationResults.invalid.length}
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
                  {validationResults.invalid.map((invalid) => (
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
                    Economia: R$ {validationResults.invalid
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