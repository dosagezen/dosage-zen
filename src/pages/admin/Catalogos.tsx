import { useState } from "react";
import { Plus, Edit, Archive, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { catalogData } from "@/data/adminMockData";

interface CatalogItem {
  id: string;
  name: string;
  status: 'active' | 'archived';
}

const transformToItems = (items: string[]): CatalogItem[] => 
  items.map((item, index) => ({
    id: `${index + 1}`,
    name: item,
    status: 'active' as const
  }));

export function Catalogos() {
  const [especialidades, setEspecialidades] = useState(transformToItems(catalogData.especialidades));
  const [tiposExame, setTiposExame] = useState(transformToItems(catalogData.tiposExame));
  const [tiposAtividade, setTiposAtividade] = useState(transformToItems(catalogData.tiposAtividade));
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAdd = (type: string, name: string) => {
    if (!name.trim()) return;
    
    const newItem: CatalogItem = {
      id: Date.now().toString(),
      name: name.trim(),
      status: 'active'
    };

    switch (type) {
      case 'especialidades':
        setEspecialidades(prev => [...prev, newItem]);
        break;
      case 'exames':
        setTiposExame(prev => [...prev, newItem]);
        break;
      case 'atividades':
        setTiposAtividade(prev => [...prev, newItem]);
        break;
    }

    toast({
      title: "Item adicionado",
      description: `${name} foi adicionado ao catálogo (mock)`,
    });
  };

  const handleEdit = (type: string, id: string, newName: string) => {
    if (!newName.trim()) return;

    const updateItems = (items: CatalogItem[]) =>
      items.map(item => item.id === id ? { ...item, name: newName.trim() } : item);

    switch (type) {
      case 'especialidades':
        setEspecialidades(updateItems);
        break;
      case 'exames':
        setTiposExame(updateItems);
        break;
      case 'atividades':
        setTiposAtividade(updateItems);
        break;
    }

    toast({
      title: "Item editado",
      description: `Item atualizado para "${newName}" (mock)`,
    });
  };

  const handleArchive = (type: string, id: string) => {
    const updateItems = (items: CatalogItem[]) =>
      items.map(item => 
        item.id === id 
          ? { ...item, status: item.status === 'active' ? 'archived' as const : 'active' as const }
          : item
      );

    switch (type) {
      case 'especialidades':
        setEspecialidades(updateItems);
        break;
      case 'exames':
        setTiposExame(updateItems);
        break;
      case 'atividades':
        setTiposAtividade(updateItems);
        break;
    }

    toast({
      title: "Status alterado",
      description: "Item arquivado/ativado (mock)",
    });
  };

  const filterItems = (items: CatalogItem[]) =>
    items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const CatalogSection = ({ 
    title, 
    items, 
    type 
  }: { 
    title: string; 
    items: CatalogItem[]; 
    type: string;
  }) => {
    const [newItemName, setNewItemName] = useState("");
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [editName, setEditName] = useState("");

    const filteredItems = filterItems(items);
    const activeCount = items.filter(item => item.status === 'active').length;
    const archivedCount = items.filter(item => item.status === 'archived').length;

    return (
      <Card className="hover:shadow-soft transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                {activeCount} ativos
              </Badge>
              {archivedCount > 0 && (
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                  {archivedCount} arquivados
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Item */}
          <div className="flex gap-2">
            <Input
              placeholder={`Novo ${title.toLowerCase().slice(0, -1)}...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd(type, newItemName);
                  setNewItemName("");
                }
              }}
            />
            <Button 
              size="sm"
              onClick={() => {
                handleAdd(type, newItemName);
                setNewItemName("");
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  item.status === 'archived' 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-card border-border/50'
                }`}
              >
                <span className={`text-sm ${
                  item.status === 'archived' 
                    ? 'text-muted-foreground line-through' 
                    : 'text-foreground'
                }`}>
                  {item.name}
                </span>
                <div className="flex items-center gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setEditName(item.name);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Item</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nome</Label>
                          <Input
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEdit(type, item.id, editName);
                                setEditingItem(null);
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              handleEdit(type, item.id, editName);
                              setEditingItem(null);
                            }}
                            className="flex-1"
                          >
                            Salvar
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleArchive(type, item.id)}
                  >
                    <Archive className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Catálogos</h2>
          <p className="text-muted-foreground">Gerencie as listas de referência do sistema</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em todos os catálogos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Catalogs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CatalogSection
          title="Especialidades"
          items={especialidades}
          type="especialidades"
        />
        <CatalogSection
          title="Tipos de Exame"
          items={tiposExame}
          type="exames"
        />
        <CatalogSection
          title="Tipos de Atividade"
          items={tiposAtividade}
          type="atividades"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-semibold text-foreground">
                  {especialidades.length + tiposExame.length + tiposAtividade.length}
                </p>
              </div>
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-semibold text-success">
                  {[...especialidades, ...tiposExame, ...tiposAtividade]
                    .filter(item => item.status === 'active').length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Arquivados</p>
                <p className="text-2xl font-semibold text-muted-foreground">
                  {[...especialidades, ...tiposExame, ...tiposAtividade]
                    .filter(item => item.status === 'archived').length}
                </p>
              </div>
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}