export type TemplateHeaderType = "NONE" | "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO"

export type TemplateButtonType = "QUICK_REPLY" | "URL" | "PHONE"

export interface TemplateButton {
  id: string
  type: TemplateButtonType
  text: string
  url?: string
  phone?: string
}

export interface TemplateMedia {
  type: Exclude<TemplateHeaderType, "NONE" | "TEXT">
  dataUrl: string
  name?: string
}

export type TemplateStatus = "DRAFT" | "APPROVED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED"

export interface WABAStatus {
  wabaId: string
  phoneName: string
  status: Exclude<TemplateStatus, "DRAFT"> | "NOT_SUBMITTED"
  lastSyncAt?: string
  error?: string
}

export interface TemplateModel {
  id: string
  name: string
  language: string // e.g. pt_BR
  category?: "MARKETING" | "TRANSACTIONAL" | "UTILITY"
  headerType: TemplateHeaderType
  headerText?: string
  headerMedia?: TemplateMedia
  body: string
  footer?: string
  buttons: TemplateButton[]
  createdAt: string
  updatedAt: string
  wabaStatuses: WABAStatus[]
}

export const defaultWABAs: { wabaId: string; phoneName: string }[] = [
  { wabaId: "waba-1", phoneName: "Sender-01" },
  { wabaId: "waba-2", phoneName: "Sender-02" },
  { wabaId: "waba-3", phoneName: "Sender-03" },
]
