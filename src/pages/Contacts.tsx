import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Upload, Download, Users, Filter, Plus, Shield, Tags } from "lucide-react"
import { NumberValidation } from "@/components/contacts/NumberValidation"
import { TagManager } from "@/components/contacts/TagManager"
import { ContactTagging } from "@/components/contacts/ContactTagging"
import { useState } from "react"
import { useContactsManagement } from "@/hooks/useContactsManagement"

const Contacts = () => {
  const { 
    tags, 
    contacts, 
    contactLists, 
    totalStats, 
    loading, 
    saveTag,
    updateTag,
    deleteTag,
    updateContactTags,
    createContactList 
  } = useContactsManagement();

  // Pegar os 3 contatos mais recentes da base de dados
  const recentContacts = contacts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(contact => ({
      id: contact.id,
      phone: contact.phone,
      name: contact.name || "Sem nome",
      email: contact.email || "",
      tags: contact.tags,
      hasWhatsapp: contact.has_whatsapp,
      lastContact: contact.last_contact ? new Date(contact.last_contact).toLocaleString() : "Nunca"
    }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contatos & Listas</h1>
            <p className="text-muted-foreground">
              Gerencie seus contatos e listas de envio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Lista
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.total.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total de Contatos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStats.withWhatsapp.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Com WhatsApp</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStats.withoutWhatsapp.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Sem WhatsApp</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStats.activeLists}</div>
                  <div className="text-sm text-muted-foreground">Listas Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Lists */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Listas de Contatos</CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-3 h-3" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactLists.map((list) => (
                <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{list.name}</span>
                      <Badge 
                        variant="secondary"
                        className={list.status === "active" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}
                      >
                        {list.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {list.contact_count.toLocaleString()} contatos • {new Date(list.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver Lista
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contatos Recentes</CardTitle>
                <div className="relative w-60">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contatos..."
                    className="pl-10 h-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum contato encontrado</p>
                  <p className="text-sm">Importe contatos para começar</p>
                </div>
              ) : (
                recentContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      <div className={`w-2 h-2 rounded-full ${contact.hasWhatsapp ? 'bg-success' : 'bg-muted'}`}></div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contact.phone} • {contact.email}
                    </div>
                    <div className="flex gap-1">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Último contato: {contact.lastContact}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Detalhes
                  </Button>
                </div>
              )))}
            </CardContent>
          </Card>
        </div>

        {/* Tag Management */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TagManager 
            tags={tags}
            onSaveTag={saveTag}
            onUpdateTag={updateTag}
            onDeleteTag={deleteTag}
          />
          <ContactTagging 
            tags={tags}
            contacts={contacts.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              source: c.source,
              hasWhatsapp: c.has_whatsapp,
              lastContact: c.last_contact,
              tags: c.tags
            }))}
            onContactUpdate={updateContactTags}
          />
        </div>

        {/* Number Validation Section */}
        <NumberValidation 
          audienceId="list-1" 
          totalContacts={totalStats.total}
          onValidationComplete={(results) => console.log("Validation results:", results)}
        />
      </div>
    </AppLayout>
  )
}

export default Contacts