import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  FileSpreadsheet, Key, CheckCircle2, ExternalLink, Copy, AlertCircle, 
  RefreshCw, Loader2, Settings, Clock, Upload,
  ArrowLeftRight, ArrowDown, ArrowUp, Trash2, LogIn, Database
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  isGoogleSheetsConfigured,
  isOAuthConfigured,
  TableMapping,
} from "@/services/googleSheetsService";
import { useGoogleSheetsSync } from "@/hooks/useGoogleSheetsSync";
import { SheetSyncPreview } from "@/components/sheets/SheetSyncPreview";
import { ColumnMappingEditor } from "@/components/sheets/ColumnMappingEditor";

export default function GoogleSheetsConfigPage() {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Sync controls
  const [syncInterval, setSyncInterval] = useState(5);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  
  // Novo mapeamento
  const [newMappingSheet, setNewMappingSheet] = useState("");
  const [newMappingTable, setNewMappingTable] = useState("");
  const [newMappingDirection, setNewMappingDirection] = useState<'read' | 'write' | 'bidirectional'>('bidirectional');

  const {
    sheets,
    mappings,
    syncStatus,
    isLoading,
    isOAuthReady,
    loadSheets,
    updateMapping,
    removeMapping,
    syncAll,
    syncSelected,
    startAutoSync,
    stopAutoSync,
    loginWithGoogle,
    previewData,
    showPreview,
    confirmSync,
    cancelPreview,
    columnMappingState,
    showColumnMapping,
    confirmColumnMapping,
    cancelColumnMapping,
    openColumnMappingEditor,
  } = useGoogleSheetsSync();

  const tableOptions = [
    { value: "apostas", label: "Apostas" },
    { value: "apostas_surebet", label: "Surebets" },
    { value: "casas", label: "Casas" },
    { value: "caixa_geral", label: "Caixa Geral" },
    { value: "saques_aportes", label: "Saques/Aportes" },
    { value: "diario_operacoes", label: "Diário" },
    { value: "fechamento", label: "Fechamento" },
    { value: "dados_referencia", label: "Dados Referência" },
    { value: "okrs", label: "OKRs" },
  ];

  const directionOptions = [
    { value: "read", label: "Sheets → Sistema", icon: ArrowDown },
    { value: "write", label: "Sistema → Sheets", icon: ArrowUp },
    { value: "bidirectional", label: "Bidirecional", icon: ArrowLeftRight },
  ];

  // Carregar configurações salvas
  useEffect(() => {
    const saved = getGoogleSheetsConfig();
    if (saved) {
      setSpreadsheetId(saved.spreadsheetId || "");
      setApiKey(saved.apiKey || "");
      setClientId(saved.clientId || "");
      setIsConfigured(!!saved.apiKey && !!saved.spreadsheetId);
      setSyncInterval(saved.syncIntervalMinutes || 5);
      setIsAutoSyncEnabled(saved.syncEnabled || false);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey || !spreadsheetId) {
      toast({
        title: "Campos obrigatórios",
        description: "API Key e ID da Planilha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    saveGoogleSheetsConfig({
      spreadsheetId,
      apiKey,
      clientId,
      configuredAt: new Date().toISOString(),
    });

    setIsConfigured(true);
    toast({
      title: "Configuração salva!",
      description: "As credenciais do Google Sheets foram salvas com sucesso.",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('google_sheets_config');
    setSpreadsheetId("");
    setApiKey("");
    setClientId("");
    setIsConfigured(false);
    stopAutoSync();
    toast({
      title: "Configuração removida",
      description: "As credenciais foram removidas.",
    });
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      setSpreadsheetId(match[1]);
      toast({ title: "ID extraído", description: "O ID da planilha foi extraído do link." });
    }
  };

  const handleAddMapping = async () => {
    if (!newMappingSheet || !newMappingTable) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a aba e a tabela de destino.",
        variant: "destructive",
      });
      return;
    }

    // Se for apenas escrita, não precisa de mapeamento de colunas agora
    if (newMappingDirection === 'write') {
      updateMapping({
        sheetName: newMappingSheet,
        tableName: newMappingTable,
        direction: newMappingDirection,
        enabled: true,
      });
      setNewMappingSheet("");
      setNewMappingTable("");
      toast({ title: "Mapeamento de escrita adicionado!" });
      return;
    }

    // Para leitura ou bidirecional, abrir o editor de colunas imediatamente
    try {
      await openColumnMappingEditor(newMappingSheet, newMappingTable as any);
      // Limpar campos após abrir o editor
      setNewMappingSheet("");
      setNewMappingTable("");
      // O salvamento do mapeamento ocorrerá no confirmColumnMapping
    } catch (error: any) {
      toast({
        title: "Erro ao abrir mapeamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleAutoSync = () => {
    if (isAutoSyncEnabled) {
      stopAutoSync();
      setIsAutoSyncEnabled(false);
    } else {
      startAutoSync(syncInterval);
      setIsAutoSyncEnabled(true);
    }
  };

  const handleIntervalChange = (value: string) => {
    const interval = parseInt(value);
    setSyncInterval(interval);
    if (isAutoSyncEnabled) {
      startAutoSync(interval);
    }
  };

  const handleSyncSelected = async () => {
    if (selectedSheets.length === 0) {
      await syncAll();
    } else {
      await syncSelected(selectedSheets);
    }
  };

  const toggleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR');
  };

  return (
    <AppLayout title="Google Sheets" subtitle="Sincronização bidirecional com Google Sheets">
      <div className="space-y-6 max-w-4xl">
        {/* Editor de Mapeamento de Colunas */}
        {showColumnMapping && columnMappingState && (
          <ColumnMappingEditor
            sheetHeaders={columnMappingState.headers}
            tableName={columnMappingState.tableName}
            initialMappings={columnMappingState.mappings}
            sampleData={columnMappingState.sampleData}
            onConfirm={confirmColumnMapping}
            onCancel={cancelColumnMapping}
            isLoading={syncStatus.isRunning}
          />
        )}

        {/* Preview de Sincronização */}
        {showPreview && previewData && !showColumnMapping && (
          <SheetSyncPreview
            preview={previewData}
            onConfirm={confirmSync}
            onCancel={cancelPreview}
            isLoading={syncStatus.isRunning}
          />
        )}

        {/* Status e Controles de Sync */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-success" />
                <div>
                  <CardTitle>Status da Integração</CardTitle>
                  <CardDescription>
                    {syncStatus.lastSync 
                      ? `Última sync: ${formatDateTime(syncStatus.lastSync)}`
                      : 'Nunca sincronizado'
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConfigured ? "default" : "secondary"}>
                  {isConfigured ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Configurado</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Não configurado</>
                  )}
                </Badge>
                {isOAuthReady && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    <Upload className="h-3 w-3 mr-1" /> Escrita OK
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          {isConfigured && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                {/* Botão de Sync Manual */}
                <Button 
                  onClick={handleSyncSelected} 
                  disabled={syncStatus.isRunning || mappings.length === 0}
                  className="gap-2"
                >
                  {syncStatus.isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {selectedSheets.length > 0 
                    ? `Sincronizar ${selectedSheets.length} selecionada(s)`
                    : 'Sincronizar Todas'
                  }
                </Button>

                {/* Controle de Auto-Sync */}
                <div className="flex items-center gap-2 border-l pl-4">
                  <Switch 
                    checked={isAutoSyncEnabled} 
                    onCheckedChange={handleToggleAutoSync}
                    disabled={mappings.length === 0}
                  />
                  <span className="text-sm">Auto-sync</span>
                </div>

                {/* Intervalo */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select value={syncInterval.toString()} onValueChange={handleIntervalChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minuto</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Próxima sync */}
                {isAutoSyncEnabled && syncStatus.nextSync && (
                  <span className="text-xs text-muted-foreground">
                    Próxima: {formatDateTime(syncStatus.nextSync)}
                  </span>
                )}
              </div>

              {/* Erros */}
              {syncStatus.errors.length > 0 && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium mb-1">Erros na última sincronização:</p>
                  <ul className="text-xs text-destructive/80">
                    {syncStatus.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Credenciais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Chave para leitura (obrigatória)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (OAuth)</Label>
                <Input
                  id="clientId"
                  type="password"
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Necessário para escrita na planilha</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadsheetUrl">Link ou ID da Planilha *</Label>
              <div className="flex gap-2">
                <Input
                  id="spreadsheetUrl"
                  placeholder="Cole o link completo ou o ID da planilha..."
                  value={spreadsheetId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes('spreadsheets/d/')) {
                      extractSpreadsheetId(value);
                    } else {
                      setSpreadsheetId(value);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(spreadsheetId);
                    toast({ title: "Copiado!" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvar Configuração
              </Button>
              {isConfigured && (
                <>
                  {clientId && !isOAuthReady && (
                    <Button variant="outline" onClick={loginWithGoogle}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Login Google
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleClear}>
                    Limpar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mapeamento de Tabelas */}
        {isConfigured && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Mapeamento de Abas
                  </CardTitle>
                  <CardDescription>
                    Configure quais abas sincronizam com quais tabelas do sistema
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={loadSheets}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar novo mapeamento */}
              {sheets.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <Label className="text-sm font-medium">Adicionar Mapeamento</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select value={newMappingSheet} onValueChange={setNewMappingSheet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aba do Sheets" />
                      </SelectTrigger>
                      <SelectContent>
                        {sheets.map((sheet) => (
                          <SelectItem key={sheet.sheetId} value={sheet.title}>
                            {sheet.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={newMappingTable} onValueChange={setNewMappingTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tabela destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {tableOptions.map((table) => (
                          <SelectItem key={table.value} value={table.value}>
                            {table.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={newMappingDirection} onValueChange={(v: any) => setNewMappingDirection(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {directionOptions.map((dir) => (
                          <SelectItem key={dir.value} value={dir.value}>
                            <span className="flex items-center gap-2">
                              <dir.icon className="h-3 w-3" />
                              {dir.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={handleAddMapping}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              {sheets.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Clique no botão de atualizar para carregar as abas da planilha</p>
                </div>
              )}

              {/* Lista de mapeamentos */}
              {mappings.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mapeamentos Configurados</Label>
                  <div className="border rounded-lg divide-y">
                    {mappings.map((mapping) => {
                      const DirectionIcon = directionOptions.find(d => d.value === mapping.direction)?.icon || ArrowLeftRight;
                      const tableLabel = tableOptions.find(t => t.value === mapping.tableName)?.label || mapping.tableName;
                      
                      return (
                        <div 
                          key={mapping.sheetName} 
                          className="flex items-center gap-3 p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedSheets.includes(mapping.sheetName)}
                            onCheckedChange={() => toggleSheetSelection(mapping.sheetName)}
                          />
                          
                          <Switch
                            checked={mapping.enabled}
                            onCheckedChange={(enabled) => updateMapping({ ...mapping, enabled })}
                          />
                          
                          <div className="flex-1 flex items-center gap-2">
                            <Badge variant="outline">{mapping.sheetName}</Badge>
                            <DirectionIcon className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">{tableLabel}</Badge>
                          </div>
                          
                          {mapping.lastSyncAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(mapping.lastSyncAt)}
                            </span>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMapping(mapping.sheetName)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Como configurar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">1</Badge>
                <div>
                  <p className="font-medium">Para LEITURA (Sheets → Sistema)</p>
                  <p className="text-sm text-muted-foreground">Crie uma API Key no Google Cloud Console e torne a planilha pública (somente leitura)</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">2</Badge>
                <div>
                  <p className="font-medium">Para ESCRITA (Sistema → Sheets)</p>
                  <p className="text-sm text-muted-foreground">Configure OAuth 2.0: crie Client ID no Google Cloud Console e faça login com sua conta Google</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">3</Badge>
                <div>
                  <p className="font-medium">Configure os mapeamentos</p>
                  <p className="text-sm text-muted-foreground">Defina qual aba da planilha sincroniza com qual tabela do sistema e em qual direção</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">4</Badge>
                <div>
                  <p className="font-medium">Ative a sincronização automática</p>
                  <p className="text-sm text-muted-foreground">Escolha o intervalo desejado ou use o botão para sincronizar manualmente</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a 
                href="https://console.cloud.google.com/apis/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Acessar Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
