import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Database, Tag, Target, Landmark, Activity, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDadosReferencia, useDadosReferenciaMutations } from "@/hooks/useSupabaseData";
import { TagsManager } from "@/components/tags/TagsManager";
import { OKRsManager } from "@/components/okrs/OKRsManager";
import type { DadosReferencia } from "@/types/database";

// Categorias pré-definidas
const CATEGORIAS = [
  { value: "banco", label: "Bancos", icon: Landmark },
  { value: "mercado", label: "Mercados", icon: Activity },
  { value: "esporte", label: "Esportes", icon: Target },
  { value: "liga", label: "Ligas/Campeonatos", icon: Layers },
  { value: "metodo", label: "Métodos de Pagamento", icon: Database },
  { value: "status", label: "Status", icon: Database },
  { value: "tipo_caixa", label: "Tipos Caixa", icon: Database },
  { value: "motivo", label: "Motivos", icon: Database },
  { value: "situacao", label: "Situação Casas", icon: Database },
  { value: "resultado", label: "Resultados", icon: Database },
  { value: "outro", label: "Outros", icon: Database },
];

export default function DadosReferenciaPage() {
  const { data: dados, isLoading } = useDadosReferencia(undefined, true);
  const { create, update, remove } = useDadosReferenciaMutations();
  const [activeTab, setActiveTab] = useState("dados");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DadosReferencia | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");

  const [formData, setFormData] = useState({
    categoria: "banco",
    valor: "",
    descricao: "",
    ativo: true,
    ordem: 0,
  });

  // Agrupar dados por categoria
  const dadosAgrupados = useMemo(() => {
    if (!dados) return {};
    const filtrados = categoriaFiltro === "all" 
      ? dados 
      : dados.filter(d => d.categoria === categoriaFiltro);
    
    return filtrados.reduce((acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria].push(item);
      return acc;
    }, {} as Record<string, typeof dados>);
  }, [dados, categoriaFiltro]);

  const resetForm = () => {
    setFormData({ categoria: "banco", valor: "", descricao: "", ativo: true, ordem: 0 });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: DadosReferencia) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        categoria: item.categoria,
        valor: item.valor,
        descricao: item.descricao || "",
        ativo: item.ativo,
        ordem: item.ordem || 0,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        categoria: formData.categoria,
        valor: formData.valor,
        descricao: formData.descricao || null,
        ativo: formData.ativo,
        ordem: formData.ordem,
      };

      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        toast({ title: "Item atualizado!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Item criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este item?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "Item excluído!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const getCategoriaLabel = (cat: string) => {
    return CATEGORIAS.find(c => c.value === cat)?.label || cat;
  };

  return (
    <AppLayout title="Central de Dados" subtitle="Gerencie tags, OKRs e dados de referência em um só lugar">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="dados" className="gap-2">
            <Database className="h-4 w-4" />
            Referência
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="okrs" className="gap-2">
            <Target className="h-4 w-4" />
            OKRs
          </TabsTrigger>
        </TabsList>

        {/* Aba Dados de Referência */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Dados de Referência
              </CardTitle>
              <CardDescription>
                Bancos, mercados, esportes, ligas e outros dados reutilizáveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtro + Botão */}
              <div className="flex items-center justify-between gap-4">
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="mr-2 h-4 w-4" /> Novo Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Categoria *</Label>
                        <Select 
                          value={formData.categoria} 
                          onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {CATEGORIAS.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor *</Label>
                        <Input
                          value={formData.valor}
                          onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                          placeholder="Ex: Nubank, Over 2.5 Gols, Brasileirão..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descrição opcional..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ordem</Label>
                          <Input
                            type="number"
                            value={formData.ordem}
                            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Switch
                            checked={formData.ativo}
                            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                          />
                          <Label>Ativo</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingItem ? "Salvar" : "Criar"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tabela de dados */}
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : Object.keys(dadosAgrupados).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum dado de referência cadastrado
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(dadosAgrupados).map(([categoria, items]) => (
                    <div key={categoria} className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        {getCategoriaLabel(categoria)} ({items.length})
                      </h4>
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Valor</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((item) => (
                              <TableRow key={item.id} className={!item.ativo ? "opacity-50" : ""}>
                                <TableCell className="font-medium">{item.valor}</TableCell>
                                <TableCell className="text-muted-foreground">{item.descricao || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant={item.ativo ? "default" : "secondary"}>
                                    {item.ativo ? "Ativo" : "Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Tags */}
        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Gerenciador de Tags
              </CardTitle>
              <CardDescription>
                Crie e gerencie tags para categorizar suas casas de apostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba OKRs */}
        <TabsContent value="okrs">
          <OKRsManager />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
