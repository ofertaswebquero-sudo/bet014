import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Settings, Shield, Trash2, AlertTriangle, FileSpreadsheet, FileText, Database, BookOpen, BarChart3, Palette, Target, Terminal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCasas, useCaixaGeral, useSaquesAportes, useDiarioOperacoes, useApostas, useApostasSurebet, useFechamentos, useDadosReferencia } from "@/hooks/useSupabaseData";
import { useBulkDelete } from "@/hooks/useBulkDelete";
import { useOKRs } from "@/hooks/useOKRs";
import * as XLSX from 'xlsx';

type TableName = 
  | 'apostas' 
  | 'apostas_surebet' 
  | 'casas' 
  | 'caixa_geral' 
  | 'saques_aportes' 
  | 'diario_operacoes' 
  | 'fechamento' 
  | 'dados_referencia' 
  | 'okrs';

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

// Função utilitária para exportar CSV
function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast({ title: "Nenhum dado para exportar", variant: "destructive" });
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(';')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({ title: `${filename}.csv exportado com sucesso!` });
}

// Função para exportar XLSX
function exportToXLSX(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast({ title: "Nenhum dado para exportar", variant: "destructive" });
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, filename.substring(0, 31));
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  toast({ title: `${filename}.xlsx exportado com sucesso!` });
}

export default function ConfiguracoesPage() {
  const { data: casas } = useCasas();
  const { data: caixaGeral } = useCaixaGeral();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: diario } = useDiarioOperacoes();
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();
  const { data: fechamentos } = useFechamentos();
  const { data: dados } = useDadosReferencia();
  const { data: okrs } = useOKRs();
  const { deleteAll } = useBulkDelete();
  const [deletingTable, setDeletingTable] = useState<TableName | null>(null);

  // Configurações de Gestão de Risco
  const [riskConfig, setRiskConfig] = useState({
    unitValue: "100",
    maxRiskPerBet: "2",
    maxFloatPercent: "50",
    alertsEnabled: true,
  });

  const [uiConfig, setUiConfig] = useState({
    compactMode: true,
    showCharts: true,
    animationsEnabled: true,
  });

  const [goalsConfig, setGoalsConfig] = useState({
    monthlyProfit: "5000",
    dailyBets: "5",
    winRate: "55",
  });

  const tableData: Record<TableName, any[] | undefined> = {
    apostas,
    apostas_surebet: surebets,
    casas,
    caixa_geral: caixaGeral,
    saques_aportes: saquesAportes,
    diario_operacoes: diario,
    fechamento: fechamentos,
    dados_referencia: dados,
    okrs,
  };

  const handleExportAll = (format: 'csv' | 'xlsx') => {
    const exportFn = format === 'csv' ? exportToCSV : exportToXLSX;
    if (casas) exportFn(casas, 'casas');
    if (caixaGeral) exportFn(caixaGeral, 'caixa_geral');
    if (saquesAportes) exportFn(saquesAportes, 'saques_aportes');
    if (diario) exportFn(diario, 'diario_operacoes');
    if (apostas) exportFn(apostas, 'apostas');
    if (surebets) exportFn(surebets, 'surebets');
    if (fechamentos) exportFn(fechamentos, 'fechamentos');
    if (dados) exportFn(dados, 'dados_referencia');
    if (okrs) exportFn(okrs, 'okrs');
  };

  const handleDeleteAll = async (tableName: TableName) => {
    setDeletingTable(tableName);
    try {
      await deleteAll.mutateAsync(tableName);
    } finally {
      setDeletingTable(null);
    }
  };

  return (
    <AppLayout title="Configurações" subtitle="Gerencie preferências e exporte dados">
      <div className="space-y-6 max-w-4xl">
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
              <Link to="/gestao">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Gestão Estratégica
                </Button>
              </Link>
              <Link to="/planilha">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Planilha Local
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gestão de Risco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Gestão de Risco
            </CardTitle>
            <CardDescription>
              Configure parâmetros de controle de risco e stake sizing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unitValue">Valor da Unidade (Unit) - R$</Label>
                <Input
                  id="unitValue"
                  type="number"
                  value={riskConfig.unitValue}
                  onChange={(e) => setRiskConfig({ ...riskConfig, unitValue: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor base para calcular stakes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRiskPerBet">Risco Máximo por Aposta (%)</Label>
                <Input
                  id="maxRiskPerBet"
                  type="number"
                  step="0.1"
                  value={riskConfig.maxRiskPerBet}
                  onChange={(e) => setRiskConfig({ ...riskConfig, maxRiskPerBet: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Percentual máximo da banca por aposta
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxFloatPercent">Limite de Float (%) - Alerta</Label>
                <Input
                  id="maxFloatPercent"
                  type="number"
                  value={riskConfig.maxFloatPercent}
                  onChange={(e) => setRiskConfig({ ...riskConfig, maxFloatPercent: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando dinheiro nas casas ultrapassar este %
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={riskConfig.alertsEnabled}
                  onCheckedChange={(checked) => setRiskConfig({ ...riskConfig, alertsEnabled: checked })}
                />
                <div>
                  <Label>Alertas de Risco</Label>
                  <p className="text-xs text-muted-foreground">Notificar sobre riscos elevados</p>
                </div>
              </div>
            </div>
            <Button onClick={() => toast({ title: "Configurações salvas!" })}>
              Salvar Configurações de Risco
            </Button>
          </CardContent>
        </Card>

        {/* Personalização de Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Interface e Visualização
            </CardTitle>
            <CardDescription>
              Personalize como as informações são exibidas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Modo Compacto (Dashboard)</Label>
                <p className="text-xs text-muted-foreground">Reduz espaçamentos para mostrar mais dados</p>
              </div>
              <Switch
                checked={uiConfig.compactMode}
                onCheckedChange={(v) => setUiConfig({ ...uiConfig, compactMode: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Exibir Gráficos</Label>
                <p className="text-xs text-muted-foreground">Mostra análises visuais nas páginas</p>
              </div>
              <Switch
                checked={uiConfig.showCharts}
                onCheckedChange={(v) => setUiConfig({ ...uiConfig, showCharts: v })}
              />
            </div>
            <Button variant="outline" onClick={() => toast({ title: "Preferências de interface atualizadas!" })}>
              Atualizar Interface
            </Button>
          </CardContent>
        </Card>

        {/* Metas e Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas e Objetivos
            </CardTitle>
            <CardDescription>
              Defina seus objetivos financeiros e operacionais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Meta Lucro Mensal (R$)</Label>
                <Input
                  type="number"
                  value={goalsConfig.monthlyProfit}
                  onChange={(e) => setGoalsConfig({ ...goalsConfig, monthlyProfit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Win Rate (%)</Label>
                <Input
                  type="number"
                  value={goalsConfig.winRate}
                  onChange={(e) => setGoalsConfig({ ...goalsConfig, winRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Média Apostas/Dia</Label>
                <Input
                  type="number"
                  value={goalsConfig.dailyBets}
                  onChange={(e) => setGoalsConfig({ ...goalsConfig, dailyBets: e.target.value })}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => toast({ title: "Metas salvas com sucesso!" })}>
              Salvar Metas
            </Button>
          </CardContent>
        </Card>

        {/* Sistema de Logs */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Logs e Diagnóstico
            </CardTitle>
            <CardDescription>
              Acesse o histórico de eventos do sistema para auditoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/logs">
              <Button className="gap-2">
                <Terminal className="h-4 w-4" />
                Abrir Console de Logs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Exportação de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Exporte seus dados para análise externa ou backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(tableLabels) as TableName[]).map((table) => (
                <div key={table} className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => tableData[table] && exportToCSV(tableData[table]!, table)}
                    className="flex-1 justify-start text-xs"
                    disabled={!tableData[table]?.length}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => tableData[table] && exportToXLSX(tableData[table]!, table)}
                    disabled={!tableData[table]?.length}
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                  </Button>
                  <Badge variant="secondary" className="text-xs min-w-[80px] justify-center">
                    {tableLabels[table]} ({tableData[table]?.length || 0})
                  </Badge>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button onClick={() => handleExportAll('csv')} className="gap-2">
                <FileText className="h-4 w-4" />
                Exportar Todos (CSV)
              </Button>
              <Button onClick={() => handleExportAll('xlsx')} variant="secondary" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Todos (XLSX)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Zona de Perigo - Excluir Dados */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Exclua todos os dados de uma tabela específica. Esta ação é irreversível!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(tableLabels) as TableName[]).map((table) => (
                <AlertDialog key={table}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="justify-start border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={deletingTable === table}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tableLabels[table]} ({tableData[table]?.length || 0})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Excluir todos os dados de {tableLabels[table]}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {(tableData[table]?.length || 0) > 0 ? (
                          <>
                            Você está prestes a excluir <strong>{tableData[table]?.length || 0} registros</strong> permanentemente.
                            <br /><br />
                            <span className="text-destructive font-semibold">Esta ação NÃO pode ser desfeita!</span>
                            <br /><br />
                            Recomendamos fazer um backup antes de continuar.
                          </>
                        ) : (
                          <span className="text-muted-foreground">Esta tabela já está vazia.</span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteAll(table)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={(tableData[table]?.length || 0) === 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sim, excluir tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Versão:</strong> 1.0.0</p>
              <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="default">Lovable Cloud</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
