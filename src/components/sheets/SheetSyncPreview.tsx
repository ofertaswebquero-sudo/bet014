import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Plus, Edit, Trash2, X, ArrowRight } from "lucide-react";
import { ColumnMapping } from "@/services/sheetColumnMapper";

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SyncPreviewData {
  sheetName: string;
  tableName: string;
  columnMappings: ColumnMapping[];
  toAdd: any[];
  toUpdate: any[];
  toDelete: any[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface SheetSyncPreviewProps {
  preview: SyncPreviewData;
  onConfirm: (options: { skipErrors: boolean; selectedRows?: string[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SheetSyncPreview({ preview, onConfirm, onCancel, isLoading }: SheetSyncPreviewProps) {
  const [skipErrors, setSkipErrors] = useState(true);
  const [activeTab, setActiveTab] = useState<'add' | 'update' | 'delete' | 'issues'>('add');
  
  const totalChanges = preview.toAdd.length + preview.toUpdate.length + preview.toDelete.length;
  const hasErrors = preview.errors.length > 0;
  const hasWarnings = preview.warnings.length > 0;

  const tabs = [
    { id: 'add' as const, label: 'Adicionar', count: preview.toAdd.length, icon: Plus, color: 'text-success' },
    { id: 'update' as const, label: 'Atualizar', count: preview.toUpdate.length, icon: Edit, color: 'text-warning' },
    { id: 'delete' as const, label: 'Remover', count: preview.toDelete.length, icon: Trash2, color: 'text-destructive' },
    { id: 'issues' as const, label: 'Problemas', count: preview.errors.length + preview.warnings.length, icon: AlertTriangle, color: hasErrors ? 'text-destructive' : 'text-warning' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'add': return preview.toAdd;
      case 'update': return preview.toUpdate;
      case 'delete': return preview.toDelete;
      default: return [];
    }
  };

  const displayColumns = preview.columnMappings.filter(m => m.matched).slice(0, 5);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Pré-visualização: {preview.sheetName}
              <ArrowRight className="h-4 w-4" />
              {preview.tableName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalChanges} alteração(ões) detectada(s)
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Column Mappings */}
        <div className="flex flex-wrap gap-2 mt-3">
          {preview.columnMappings.slice(0, 8).map((mapping) => (
            <Badge 
              key={mapping.sheetColumn} 
              variant={mapping.matched ? "default" : "outline"}
              className={!mapping.matched ? "border-dashed opacity-50" : ""}
            >
              {mapping.sheetColumn}
              {mapping.matched && mapping.sheetColumn !== mapping.systemField && (
                <span className="ml-1 text-xs opacity-70">→ {mapping.systemField}</span>
              )}
            </Badge>
          ))}
          {preview.columnMappings.length > 8 && (
            <Badge variant="outline">+{preview.columnMappings.length - 8}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <tab.icon className={`h-3 w-3 ${activeTab === tab.id ? '' : tab.color}`} />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">{tab.count}</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'issues' ? (
          <ScrollArea className="h-[300px]">
            {preview.errors.length === 0 && preview.warnings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 text-success" />
                <p>Nenhum problema encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {preview.errors.map((issue, i) => (
                  <div key={`error-${i}`} className="p-2 rounded bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Linha {issue.row}</span>
                      <Badge variant="outline" className="text-xs">{issue.field}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{issue.message}</p>
                  </div>
                ))}
                {preview.warnings.map((issue, i) => (
                  <div key={`warning-${i}`} className="p-2 rounded bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Linha {issue.row}</span>
                      <Badge variant="outline" className="text-xs">{issue.field}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[300px]">
            {getActiveData().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Nenhum registro para {activeTab === 'add' ? 'adicionar' : activeTab === 'update' ? 'atualizar' : 'remover'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayColumns.map((col) => (
                      <TableHead key={col.systemField} className="text-xs">
                        {col.systemField}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getActiveData().slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      {displayColumns.map((col) => (
                        <TableCell key={col.systemField} className="text-xs py-1">
                          {String(row[col.systemField] ?? '-').slice(0, 30)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {getActiveData().length > 50 && (
                    <TableRow>
                      <TableCell colSpan={displayColumns.length} className="text-center text-muted-foreground">
                        ... e mais {getActiveData().length - 50} registro(s)
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            {hasErrors && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={skipErrors} onCheckedChange={(v) => setSkipErrors(!!v)} />
                Pular linhas com erro
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={() => onConfirm({ skipErrors })}
              disabled={isLoading || (hasErrors && !skipErrors)}
            >
              {isLoading ? 'Sincronizando...' : `Confirmar ${totalChanges} alteração(ões)`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
