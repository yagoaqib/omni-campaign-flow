import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, FileText, Video } from "lucide-react"
import { TemplateButton, TemplateHeaderType } from "./types"

interface PreviewProps {
  headerType: TemplateHeaderType
  headerText?: string
  headerMediaDataUrl?: string
  body: string
  footer?: string
  buttons: TemplateButton[]
  variableValues: Record<string, string>
}

function renderWithVariables(text: string, values: Record<string, string>) {
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => values[n] ?? `{{${n}}}`)
}

export default function TemplatePreview({
  headerType,
  headerText,
  headerMediaDataUrl,
  body,
  footer,
  buttons,
  variableValues,
}: PreviewProps) {
  return (
    <Card className="bg-muted/40">
      <CardContent className="p-4 space-y-3">
        {headerType !== "NONE" && (
          <div className="rounded-md border bg-background p-3">
            {headerType === "TEXT" && (
              <p className="text-sm font-medium">{headerText}</p>
            )}
            {headerType === "IMAGE" && (
              headerMediaDataUrl ? (
                <img src={headerMediaDataUrl} alt="imagem do cabeçalho" className="w-full rounded" />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground"><ImageIcon className="w-4 h-4"/>Imagem</div>
              )
            )}
            {headerType === "DOCUMENT" && (
              <div className="flex items-center gap-2 text-muted-foreground"><FileText className="w-4 h-4"/>Documento</div>
            )}
            {headerType === "VIDEO" && (
              headerMediaDataUrl ? (
                <video src={headerMediaDataUrl} controls className="w-full rounded" />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground"><Video className="w-4 h-4"/>Vídeo</div>
              )
            )}
          </div>
        )}

        <div className="rounded-md bg-background p-3">
          <p className="text-sm whitespace-pre-wrap">{renderWithVariables(body, variableValues)}</p>
        </div>

        {footer && (
          <div className="rounded-md bg-background p-2">
            <p className="text-xs text-muted-foreground">{footer}</p>
          </div>
        )}

        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttons.map((b) => (
              <Badge key={b.id} variant="outline" className="cursor-default">{b.text}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
