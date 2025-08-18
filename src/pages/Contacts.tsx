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
import { useContacts } from "@/hooks/useContacts"

const Contacts = () => {
  const [tags, setTags] = useState([]);
  const { contacts, contactLists, totalStats, loading, createContactList } = useContacts();
  const lists = contactLists.length > 0 ? contactLists : [
    {
      id: 1,
      name: "Clientes Premium",
      contacts: 2847,
      lastUpdated: "2 horas atrás",
      tags: ["premium", "vip"],
      status: "active"
    },
    {
      id: 2,
      name: "Newsletter Subscribers", 
      contacts: 18234,
      lastUpdated: "1 dia atrás",
      tags: ["newsletter", "marketing"],
      status: "active"
    },
    {
      id: 3,
      name: "Cart Abandoners",
      contacts: 5689,
      lastUpdated: "3 horas atrás", 
      tags: ["ecommerce", "abandoned"],
      status: "active"
    },
    {
      id: 4,
      name: "Black Friday 2023",
      contacts: 12456,
      lastUpdated: "30 dias atrás",
      tags: ["campaign", "archived"],
      status: "archived"
    }
  ]

  const recentContacts = [
    {
      phone: "+55 11 99999-9999",
      name: "João Silva",
      email: "joao@email.com",
      tags: ["premium", "vip"],
      hasWhatsapp: true,
      lastContact: "2 min atrás"
    },
    {
      phone: "+55 21 88888-8888", 
      name: "Maria Santos",
      email: "maria@email.com",
      tags: ["newsletter"],
      hasWhatsapp: true,
      lastContact: "15 min atrás"
    },
    {
      phone: "+55 85 77777-7777",
      name: "Pedro Costa",
      email: "pedro@email.com", 
      tags: ["abandoned"],
      hasWhatsapp: false,
      lastContact: "1 hora atrás"
    }
  ]

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
              {lists.map((list) => (
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
                      {list.contacts.toLocaleString()} contatos • {list.lastUpdated}
                    </div>
                    <div className="flex gap-1">
                      {list.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
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
              {recentContacts.map((contact, index) => (
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
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Tag Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TagManager onTagsChange={setTags} />
          <ContactTagging 
            tags={tags}
            contacts={contacts}
            onContactUpdate={(contactId, newTags) => 
              console.log(`Contact ${contactId} updated with tags:`, newTags)
            } 
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