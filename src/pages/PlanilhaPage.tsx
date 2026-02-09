import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Clock,
  FileJson,
  FileText,
  Trash2,
  ChevronDown,
  FileDown,
  CloudUpload,
  HardDrive,
  Settings,
  BookOpen,
} from "lucide-react";
import { useLocalBackup } from "@/hooks/useLocalBackup";
import { LocalBackupData } from "@/services/localStorageService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TableName = keyof Omit<LocalBackupData, 'lastUpdated'>;

const tableLabels: Record<TableName, string> = {
  apostas: "Apostas",
  apostas_surebet: "Surebets",
  casas: "Casas",
  caixa_geral: "Caixa Geral",
  saques_aportes: "Saques & Aportes",
  diario_operacoes: "Diário Operações",
  fechamento: "Fechamento",
  dados_referencia: "Dados Referência",
  okrs: "OKRs",
};

const tableOrder: TableName[] = [
  'apostas',
  'apostas_surebet',
  'casas',
  'caixa_geral',
  'saques_aportes',
  'diario_operacoes',
  'fechamento',
  'dados_referencia',
  'okrs',
];

export default function PlanilhaPage() {
  const [activeTable, setActiveTable] = useState<TableName>('apostas');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputDbRef = useRef<HTMLInputElement>(null);

  const {
    syncFromSupabase,
    exportToCSV,
    exportToXLSX,
    exportFullBackup,
    exportFullBackupXLSX,
    importBackup,
    importBackupToDatabase,
    syncLocalToDatabase,
    deleteSelectedItems,
    getBackupData,
    lastBackupTime,
  } = useLocalBackup();

  const backupData = getBackupData();
  const currentTableData = backupData[activeTable] as any[];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncFromSupabase();
      setRefreshKey(prev => prev + 1);
      setSelectedIds(new Set());
    } finally {
      setIsSyncing(false);
    }
  };

  // Importar JSON para localStorage apenas
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importBackup(file);
      setRefreshKey(prev => prev + 1);
      e.target.value = '';
    }
  };

  // Importar JSON direto para o banco de dados
  const handleImportToDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      try {
        await importBackupToDatabase(file);
        setRefreshKey(prev => prev + 1);
        setImportDialogOpen(false);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    }
  };

  // Enviar dados locais para o banco
  const handleSyncLocalToDb = async () => {
    setIsImporting(true);
    try {
      await syncLocalToDatabase();
      setRefreshKey(prev => prev + 1);
      setImportDialogOpen(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAll = useCallback(() => {
    if (!currentTableData) return;
    
    if (selectedIds.size === currentTableData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentTableData.map((row: any) => row.id)));
    }
  }, [currentTableData, selectedIds.size]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleDeleteSelected = () => {
    deleteSelectedItems(activeTable, Array.from(selectedIds));
    setSelectedIds(new Set());
    setRefreshKey(prev => prev + 1);
    setDeleteDialogOpen(false);
  };

  const handleTableChange = (table: string) => {
    setActiveTable(table as TableName);
    setSelectedIds(new Set());
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return value;
      }
    }
    return String(value);
  };

  const getColumnHeaders = (): string[] => {
    if (!currentTableData || currentTableData.length === 0) return [];
    const allKeys = Object.keys(currentTableData[0]);
    const priority = ['id', 'data', 'nome', 'tipo', 'valor', 'casa_nome', 'evento'];
    const end = ['created_at', 'updated_at'];
    
    const middle = allKeys.filter(k => !priority.includes(k) && !end.includes(k));
    const priorityPresent = priority.filter(k => allKeys.includes(k));
    const endPresent = end.filter(k => allKeys.includes(k));
    
    return [...priorityPresent, ...middle, ...endPresent];
  };

  const columns = getColumnHeaders();
  const isAllSelected = currentTableData && currentTableData.length > 0 && selectedIds.size === currentTableData.length;
  const hasSelection = selectedIds.size > 0;

  return (
    <AppLayout>
      <div className="space-y-6" key={refreshKey}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              Planilha Local
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e exporte seus dados offline
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>

            {/* Dropdown de Exportar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar Tudo
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem onClick={exportFullBackup} className="gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  JSON (Backup)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportFullBackupXLSX} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (XLSX)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão de Importar */}
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>
          </div>
        </div>

        {/* Links rápidos */}
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">Acesso rápido:</span>
              <Link to="/dados">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Database className="h-4 w-4" />
                  Central de Dados
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Documentação
                </Button>
              </Link>
              <Link to="/configuracoes">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="bg-card/50">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="font-medium">Backup Local</span>
                </div>
                {lastBackupTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Último sync: {format(new Date(lastBackupTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tableOrder.map((table) => (
                  <Badge key={table} variant="secondary" className="text-xs">
                    {tableLabels[table]}: {(backupData[table] as any[])?.length || 0}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de tabelas */}
        <Tabs value={activeTable} onValueChange={handleTableChange}>
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {tableOrder.map((table) => (
              <TabsTrigger
                key={table}
                value={table}
                className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tableLabels[table]}
                <span className="ml-1 text-xs opacity-70">
                  ({(backupData[table] as any[])?.length || 0})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tableOrder.map((table) => (
            <TabsContent key={table} value={table} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {tableLabels[table]}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasSelection && activeTable === table && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir ({selectedIds.size})
                        </Button>
                      )}
                      
                      {/* Dropdown de Exportar Tabela */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!currentTableData || currentTableData.length === 0}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Exportar
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover z-50">
                          <DropdownMenuItem onClick={() => exportToCSV(table)} className="gap-2 cursor-pointer">
                            <FileText className="h-4 w-4" />
                            CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportToXLSX(table)} className="gap-2 cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel (XLSX)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {table === activeTable && (
                    <>
                      {!currentTableData || currentTableData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Database className="h-12 w-12 mb-4 opacity-50" />
                          <p>Nenhum dado encontrado</p>
                          <p className="text-sm">Clique em "Sincronizar" para buscar dados do banco</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border overflow-hidden">
                          <div className="overflow-x-auto max-h-[500px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                                <TableRow>
                                  <TableHead className="w-12 text-center">
                                    <Checkbox
                                      checked={isAllSelected}
                                      onCheckedChange={handleSelectAll}
                                      aria-label="Selecionar todos"
                                    />
                                  </TableHead>
                                  <TableHead className="w-12 text-center">#</TableHead>
                                  {columns.map((col) => (
                                    <TableHead 
                                      key={col} 
                                      className="whitespace-nowrap text-xs font-semibold uppercase"
                                    >
                                      {col.replace(/_/g, ' ')}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentTableData.map((row, index) => (
                                  <TableRow 
                                    key={row.id || index} 
                                    className={`hover:bg-muted/50 ${selectedIds.has(row.id) ? 'bg-primary/10' : ''}`}
                                  >
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={selectedIds.has(row.id)}
                                        onCheckedChange={() => handleSelectItem(row.id)}
                                        aria-label={`Selecionar linha ${index + 1}`}
                                      />
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground text-xs">
                                      {index + 1}
                                    </TableCell>
                                    {columns.map((col) => (
                                      <TableCell 
                                        key={col} 
                                        className="whitespace-nowrap text-sm max-w-[200px] truncate"
                                        title={String(row[col] || '')}
                                      >
                                        {formatValue(row[col])}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedIds.size} registro(s) do backup local?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Importação */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Dados
              </DialogTitle>
              <DialogDescription>
                Escolha como deseja importar seus dados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Opção 1: Importar para banco */}
              <div className="p-4 border rounded-lg space-y-3 bg-primary/5">
                <div className="flex items-center gap-2">
                  <CloudUpload className="h-5 w-5 text-primary" />
                  <span className="font-medium">Importar para o Banco de Dados</span>
                  <Badge variant="default" className="ml-auto">Recomendado</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Salva os dados diretamente no banco de dados. Ficam disponíveis em todo o sistema.
                </p>
                <Button
                  onClick={() => fileInputDbRef.current?.click()}
                  disabled={isImporting}
                  className="w-full gap-2"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileJson className="h-4 w-4" />
                  )}
                  Selecionar arquivo JSON
                </Button>
                <input
                  ref={fileInputDbRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportToDatabase}
                  className="hidden"
                />
              </div>

              {/* Opção 2: Importar apenas local */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Importar apenas Local</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Salva apenas no navegador. Útil para visualizar antes de enviar ao banco.
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Importar para Local
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </div>

              {/* Opção 3: Enviar local para banco */}
              {backupData.apostas.length > 0 || backupData.casas.length > 0 ? (
                <div className="p-4 border rounded-lg space-y-3 border-dashed">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Enviar dados locais para o Banco</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Já tem dados no backup local? Envie-os para o banco de dados.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleSyncLocalToDb}
                    disabled={isImporting}
                    className="w-full gap-2"
                  >
                    {isImporting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CloudUpload className="h-4 w-4" />
                    )}
                    Enviar para o Banco
                  </Button>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
