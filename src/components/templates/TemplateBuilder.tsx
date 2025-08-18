import React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Upload } from "lucide-react"
import TemplatePreview from "./TemplatePreview"
import { TemplateButton, TemplateButtonType, TemplateHeaderType, TemplateMedia, TemplateModel } from "./types"
import { useAvailableNumbers } from "@/hooks/useAvailableNumbers"
import { useWorkspace } from "@/hooks/useWorkspace"

function useFileAsDataUrl() {
  const [file, setFile] = React.useState<File | null>(null)
  const [dataUrl, setDataUrl] = React.useState<string | undefined>()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setDataUrl(reader.result as string)
    reader.readAsDataURL(f)
  }

  return { file, dataUrl, onFileChange }
}

function extractVariableNumbers(text: string) {
  const matches = Array.from(text.matchAll(/\{\{(\d+)\}\}/g))
  const set = new Set(matches.map((m) => m[1]))
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
}

function insertAtCursor(textarea: HTMLTextAreaElement, insertText: string) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = textarea.value.substring(0, start)
  const after = textarea.value.substring(end)
  const next = before + insertText + after
  const pos = start + insertText.length
  return { next, pos }
}

interface BuilderProps {
  onSave: (tpl: TemplateModel) => void
  initial?: TemplateModel
}

export default function TemplateBuilder({ onSave, initial }: BuilderProps) {
  const { numbers: AVAILABLE_NUMBERS } = useAvailableNumbers();
  const { activeWorkspace } = useWorkspace();
  
  const [name, setName] = React.useState(initial?.name ?? "")
  const [language, setLanguage] = React.useState(initial?.language ?? "pt_BR")
  const [category, setCategory] = React.useState<"MARKETING" | "TRANSACTIONAL" | "UTILITY">(
    initial?.category ?? "MARKETING"
  )
  const [selectedWabaId, setSelectedWabaId] = React.useState<string>(initial?.assignedNumberId ?? "")
  const [headerType, setHeaderType] = React.useState<TemplateHeaderType>(initial?.headerType ?? "NONE")
  const [headerText, setHeaderText] = React.useState(initial?.headerText ?? "")
  const media = useFileAsDataUrl()
  const [body, setBody] = React.useState(initial?.body ?? "Olá {{1}}, sua compra {{2}} foi aprovada!")
  const [footer, setFooter] = React.useState(initial?.footer ?? "")
const [buttons, setButtons] = React.useState<TemplateButton[]>(initial?.buttons ?? [])
const [variableValues, setVariableValues] = React.useState<Record<string, string>>({})
const [assignedNumberId, setAssignedNumberId] = React.useState<string>(initial?.assignedNumberId ?? "")

  // Get unique WABAs from phone numbers
  const wabaOptions = AVAILABLE_NUMBERS.reduce((acc, number) => {
    if (!acc.find(w => w.id === number.id)) {
      acc.push({
        id: number.id,
        label: number.displayNumber
      });
    }
    return acc;
  }, [] as { id: string; label: string }[]);

  const variableNumbers = React.useMemo(() => extractVariableNumbers(body), [body])
  const headerVariableNumbers = React.useMemo(
    () => (headerType === "TEXT" ? extractVariableNumbers(headerText) : []),
    [headerType, headerText]
  )

  const [bodyExampleSets, setBodyExampleSets] = React.useState<string[][]>(
    initial?.examples?.bodyTextSets?.length
      ? initial.examples.bodyTextSets
      : [Array(variableNumbers.length).fill("")]
  )
  const [headerExampleValues, setHeaderExampleValues] = React.useState<string[]>(
    initial?.examples?.headerTextValues ?? Array(headerVariableNumbers.length).fill("")
  )

  const [bodyVarKeys, setBodyVarKeys] = React.useState<{ number: string; key: string }[]>(
    initial?.variableMap?.body ?? variableNumbers.map((n) => ({ number: n, key: "" }))
  )
  const [headerVarKeys, setHeaderVarKeys] = React.useState<{ number: string; key: string }[]>(
    initial?.variableMap?.header ?? headerVariableNumbers.map((n) => ({ number: n, key: "" }))
  )

  React.useEffect(() => {
    setBodyExampleSets((prev) => {
      const ensureLen = (arr: string[]) => {
        const next = Array(variableNumbers.length).fill("") as string[]
        for (let i = 0; i < Math.min(arr.length, next.length); i++) next[i] = arr[i]
        return next
      }
      if (!prev.length) return [ensureLen([])]
      return prev.map(ensureLen)
    })
  }, [variableNumbers])

  React.useEffect(() => {
    setHeaderExampleValues((prev) => {
      const next = Array(headerVariableNumbers.length).fill("") as string[]
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i]
      return next
    })
  }, [headerVariableNumbers])

  React.useEffect(() => {
    setBodyVarKeys((prev) => {
      const map = new Map(prev.map((v) => [v.number, v.key]))
      return variableNumbers.map((n) => ({ number: n, key: map.get(n) ?? "" }))
    })
  }, [variableNumbers])

  React.useEffect(() => {
    setHeaderVarKeys((prev) => {
      const map = new Map(prev.map((v) => [v.number, v.key]))
      return headerVariableNumbers.map((n) => ({ number: n, key: map.get(n) ?? "" }))
    })
  }, [headerVariableNumbers])
  React.useEffect(() => {
    // ensure variable values keys
    setVariableValues((prev) => {
      const next: Record<string, string> = { ...prev }
      variableNumbers.forEach((n) => (next[n] = next[n] ?? ""))
      Object.keys(next).forEach((k) => {
        if (!variableNumbers.includes(k)) delete next[k]
      })
      return next
    })
  }, [variableNumbers])

  const onAddButton = (type: TemplateButtonType) => {
    const base: TemplateButton = { id: crypto.randomUUID(), type, text: "Botão" }
    if (type === "URL") base.url = "https://"
    if (type === "PHONE") base.phone = "+55"
    setButtons((b) => [...b, base])
  }

  const onRemoveButton = (id: string) => setButtons((b) => b.filter((x) => x.id !== id))

  const onHeaderTypeChange = (val: TemplateHeaderType) => {
    setHeaderType(val)
    if (val !== "TEXT") setHeaderText("")
  }

  const handleInsertVariable = (ta: HTMLTextAreaElement) => {
    const nextIndex = (variableNumbers.map(Number).reduce((a, b) => Math.max(a, b), 0) || 0) + 1
    const { next, pos } = insertAtCursor(ta, `{{${nextIndex}}}`)
    setBody(next)
    setTimeout(() => ta.setSelectionRange(pos, pos))
  }

  const fillFromPreview = () => {
    const first = variableNumbers.map((n) => variableValues[n] ?? "")
    setBodyExampleSets((prev) => {
      const next = [...prev]
      if (next.length === 0) next.push(first)
      else next[0] = first
      return next
    })
  }

  const onSubmit = () => {
    if (!selectedWabaId) {
      alert('Selecione um número/WABA para o template');
      return;
    }

    // Build components schema for Meta API
    const components: any[] = [];

    // Add header component
    if (headerType && headerType !== "NONE" && headerText) {
      components.push({
        type: 'HEADER',
        format: headerType,
        text: headerType === 'TEXT' ? headerText : undefined
      });
    }

    // Add body component
    if (body) {
      components.push({
        type: 'BODY',
        text: body
      });
    }

    // Add footer component
    if (footer) {
      components.push({
        type: 'FOOTER',
        text: footer
      });
    }

    // Add buttons component
    if (buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map(button => ({
          type: button.type.toUpperCase(),
          text: button.text,
          url: button.url,
          phone_number: button.phone
        }))
      });
    }

    const now = new Date().toISOString()
    const headerMedia: TemplateMedia | undefined =
      headerType === "IMAGE" || headerType === "DOCUMENT" || headerType === "VIDEO"
        ? media.dataUrl
          ? { type: headerType, dataUrl: media.dataUrl }
          : undefined
        : undefined

    const model: TemplateModel = {
      id: initial?.id ?? crypto.randomUUID(),
      name,
      language,
      category,
      headerType,
      headerText: headerType === "TEXT" ? headerText : undefined,
      headerMedia,
      body,
      footer,
      buttons,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      wabaStatuses: initial?.wabaStatuses ?? [],
      examples: {
        bodyTextSets: bodyExampleSets,
        headerTextValues: headerType === "TEXT" && headerVariableNumbers.length ? headerExampleValues : undefined,
      },
      variableMap: {
        body: bodyVarKeys,
        header: headerType === "TEXT" && headerVariableNumbers.length ? headerVarKeys : undefined,
      },
      assignedNumberId: selectedWabaId || undefined
    }
    onSave(model)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Modelo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: welcome_message_v2" />
              </div>
              <div>
                <Label>Idioma</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v)}>
                  <SelectTrigger className="z-50 bg-popover">
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="es_ES">Español (ES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger className="z-50 bg-popover">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="TRANSACTIONAL">Transacional</SelectItem>
                    <SelectItem value="UTILITY">Utilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Número/WABA *</Label>
                <Select value={selectedWabaId} onValueChange={(v) => setSelectedWabaId(v)}>
                  <SelectTrigger className="z-50 bg-popover">
                    <SelectValue placeholder="Selecione um número" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {wabaOptions.map((waba) => (
                      <SelectItem key={waba.id} value={waba.id}>{waba.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Cabeçalho</Label>
                <Select value={headerType} onValueChange={(v: TemplateHeaderType) => onHeaderTypeChange(v)}>
                  <SelectTrigger className="z-50 bg-popover">
                    <SelectValue placeholder="Cabeçalho" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="NONE">Sem Cabeçalho</SelectItem>
                    <SelectItem value="TEXT">Texto</SelectItem>
                    <SelectItem value="IMAGE">Imagem</SelectItem>
                    <SelectItem value="DOCUMENT">Documento</SelectItem>
                    <SelectItem value="VIDEO">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {headerType === "TEXT" && (
                <div>
                  <Label>Texto do Cabeçalho</Label>
                  <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="ex.: Promoção Black Friday" />
                </div>
              )}
              {(headerType === "IMAGE" || headerType === "DOCUMENT" || headerType === "VIDEO") && (
                <div className="md:col-span-2">
                  <Label>Upload de Mídia</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept={headerType === "IMAGE" ? "image/*" : headerType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx"} onChange={media.onFileChange} />
                    <Button type="button" variant="outline" className="gap-2"><Upload className="w-4 h-4"/>Selecionar</Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Corpo</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escreva o corpo com variáveis {{1}}, {{2}}..."
                ref={(el) => {
                  if (!el) return
                  ;(el as any)._insertVar = () => handleInsertVariable(el)
                }}
              />
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => (document.activeElement as any)?._insertVar?.()}>Inserir {"{{N}}"}</Button>
              </div>
            </div>

            <div>
              <Label>Rodapé</Label>
              <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Texto opcional de rodapé" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Botões</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onAddButton("QUICK_REPLY")} className="gap-2"><Plus className="w-4 h-4"/>Quick Reply</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onAddButton("URL")} className="gap-2"><Plus className="w-4 h-4"/>URL</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onAddButton("PHONE")} className="gap-2"><Plus className="w-4 h-4"/>Telefone</Button>
                </div>
              </div>
              <div className="space-y-2">
                {buttons.map((b) => (
                  <div key={b.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center rounded-md border p-3">
                    <div className="md:col-span-1">
                      <Select value={b.type} onValueChange={(v: TemplateButtonType) => setButtons((prev) => prev.map(x => x.id === b.id ? { ...x, type: v } : x))}>
                        <SelectTrigger className="z-50 bg-popover"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-50 bg-popover">
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE">Telefone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <Input value={b.text} onChange={(e) => setButtons((prev) => prev.map(x => x.id === b.id ? { ...x, text: e.target.value } : x))} placeholder="Texto" />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {b.type === "URL" && (
                        <Input value={b.url ?? ""} onChange={(e) => setButtons((prev) => prev.map(x => x.id === b.id ? { ...x, url: e.target.value } : x))} placeholder="https://" />
                      )}
                      {b.type === "PHONE" && (
                        <Input value={b.phone ?? ""} onChange={(e) => setButtons((prev) => prev.map(x => x.id === b.id ? { ...x, phone: e.target.value } : x))} placeholder="+55..." />
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveButton(b.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nomes de variáveis (disparo) */}
            <div className="space-y-3">
              <Label>Nomes de variáveis (disparo pelo app)</Label>
              {variableNumbers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="font-medium">Corpo – nomeie cada variável</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {bodyVarKeys.map((v, idx) => (
                      <Input
                        key={v.number}
                        value={v.key}
                        onChange={(e) => setBodyVarKeys((prev) => {
                          const copy = [...prev]
                          copy[idx] = { ...copy[idx], key: e.target.value }
                          return copy
                        })}
                        placeholder={`{{${v.number}}} • ex.: nome`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {headerType === "TEXT" && headerVariableNumbers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="font-medium">Cabeçalho – nomeie cada variável</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {headerVarKeys.map((v, idx) => (
                      <Input
                        key={v.number}
                        value={v.key}
                        onChange={(e) => setHeaderVarKeys((prev) => {
                          const copy = [...prev]
                          copy[idx] = { ...copy[idx], key: e.target.value }
                          return copy
                        })}
                        placeholder={`{{${v.number}}} • ex.: cupom`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exemplos para publicação */}
            <div className="space-y-3">
              <Label>Exemplos para publicação (Meta)</Label>
              {variableNumbers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Corpo – Conjuntos de exemplo</div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={fillFromPreview}>Usar valores do preview</Button>
                      <Button type="button" size="sm" onClick={() => setBodyExampleSets((prev) => [...prev, Array(variableNumbers.length).fill("")])}>Adicionar conjunto</Button>
                    </div>
                  </div>
                  {bodyExampleSets.map((set, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-start">
                      {variableNumbers.map((n, idx) => (
                        <Input
                          key={n}
                          value={set[idx] ?? ""}
                          onChange={(e) => setBodyExampleSets((prev) => {
                            const copy = prev.map((x) => [...x])
                            copy[i][idx] = e.target.value
                            return copy
                          })}
                          placeholder={`Conj. ${i + 1} • {{${n}}}`}
                        />
                      ))}
                      {i > 0 && (
                        <div className="flex">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setBodyExampleSets((prev) => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {headerType === "TEXT" && headerVariableNumbers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="font-medium">Cabeçalho – Exemplos</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {headerVariableNumbers.map((n, idx) => (
                      <Input
                        key={n}
                        value={headerExampleValues[idx] ?? ""}
                        onChange={(e) => setHeaderExampleValues((prev) => {
                          const arr = [...prev]
                          arr[idx] = e.target.value
                          return arr
                        })}
                        placeholder={`{{${n}}}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onSubmit} className="">Salvar Modelo</Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {variableNumbers.map((n) => (
                    <div key={n} className="space-y-1">
                      <Label>Variável {n}</Label>
                      <Input value={variableValues[n] ?? ""} onChange={(e) => setVariableValues((prev) => ({ ...prev, [n]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                <TemplatePreview
                  headerType={headerType}
                  headerText={headerText}
                  headerMediaDataUrl={media.dataUrl}
                  body={body}
                  footer={footer}
                  buttons={buttons}
                  variableValues={variableValues}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
