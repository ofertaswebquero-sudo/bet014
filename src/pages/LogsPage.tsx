import { useLogs, LogEntry } from "@/hooks/useLogs";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, RefreshCw, Terminal, Info, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/shared/TablePagination";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

function LogRow({ log }: { log: LogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getLevelBadge = (level: string) => {
    const l = level.toLowerCase();
    switch (l) {
      case 'info':
        return <Badge variant="secondary" className="gap-1 text-[10px] h-5"><Info className="h-3 w-3" /> INFO</Badge>;
      case 'warn':
        return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500 text-[10px] h-5"><AlertTriangle className="h-3 w-3" /> WARN</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1 text-[10px] h-5"><XCircle className="h-3 w-3" /> ERROR</Badge>;
      case 'success':
        return <Badge variant="default" className="gap-1 bg-emerald-500 text-[10px] h-5"><CheckCircle className="h-3 w-3" /> SUCCESS</Badge>;
      default:
        return <Badge className="text-[10px] h-5">{level}</Badge>;
    }
  };

  return (
    <>
      <TableRow 
        className={`font-mono text-[11px] cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="w-8 p-0 text-center">
          {log.details ? (isExpanded ? <ChevronDown className="h-3 w-3 mx-auto" /> : <ChevronRight className="h-3 w-3 mx-auto" />) : null}
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString('pt-BR')}
        </TableCell>
        <TableCell>{getLevelBadge(log.level)}</TableCell>
        <TableCell className="font-bold text-primary">{log.module}</TableCell>
        <TableCell className="max-w-md truncate" title={log.message}>
          {log.message}
        </TableCell>
      </TableRow>
      {isExpanded && log.details && (
        <TableRow className="bg-muted/20 border-l-2 border-l-primary">
          <TableCell colSpan={5} className="p-4">
            <div className="bg-black/20 p-3 rounded-md overflow-x-auto">
              <pre className="text-[10px] text-muted-foreground leading-relaxed">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function LogsPage() {
  const { logs, clearLogs } = useLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(log => 
      log.message.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
    );
  }, [logs, search]);

  const {
    currentPage,
    totalPages,
    pageSize,
    totalRecords,
    paginatedData,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredLogs, 20);

  return (
    <AppLayout title="Logs do Sistema" subtitle="Histórico de atividades e eventos do sistema">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs (mensagens, módulos ou detalhes)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (confirm("Deseja realmente limpar todos os logs?")) {
                clearLogs();
              }
            }} className="gap-2">
              <Trash2 className="h-4 w-4" /> Limpar Logs
            </Button>
          </div>
        </div>

        <Card className="border-border/40 shadow-md">
          <CardHeader className="p-4 border-b bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Console de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Nível</TableHead>
                    <TableHead className="w-[120px]">Módulo</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((log) => (
                      <LogRow key={log.id} log={log} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={totalRecords}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
