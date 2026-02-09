import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowRight, Check, X, Link2, Unlink, RefreshCw, AlertTriangle,
  Loader2, CheckCircle2
} from "lucide-react";
import { 
  ColumnMapping, 
  TABLE_SCHEMAS, 
  autoDetectColumnMappings,
  normalizeColumnName 
} from "@/services/sheetColumnMapper";

interface ColumnMappingEditorProps {
  sheetHeaders: string[];
  tableName: string;
  initialMappings?: ColumnMapping[];
  sampleData?: any[][]; // Primeiras linhas para preview
  onConfirm: (mappings: ColumnMapping[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ColumnMappingEditor({
  sheetHeaders,
  tableName,
  initialMappings,
  sampleData = [],
  onConfirm,
  onCancel,
  isLoading = false,
}: ColumnMappingEditorProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const schema = TABLE_SCHEMAS[tableName];

  // Inicializar com detecção automática ou mappings fornecidos
  useEffect(() => {
    if (initialMappings && initialMappings.length > 0) {
      setMappings(initialMappings);
    } else {
      const detected = autoDetectColumnMappings(sheetHeaders, tableName);
      setMappings(detected);
    }
  }, [sheetHeaders, tableName, initialMappings]);

  // Obter colunas do sistema que ainda não foram mapeadas
  const getAvailableSystemFields = (currentField: string) => {
    const usedFields = new Set(
      mappings.filter(m => m.matched && m.systemField !== currentField).map(m => m.systemField)
    );
    return schema?.columns.filter(c => !usedFields.has(c.name) && !c.readOnly) || [];
  };

  // Atualizar mapeamento de uma coluna
  const updateMapping = (sheetColumn: string, systemField: string) => {
    setMappings(prev => {
      // Remover mapeamento anterior para esse campo do sistema (se existir)
      const updated = prev.map(m => {
        if (m.systemField === systemField && m.sheetColumn !== sheetColumn) {
          return { ...m, matched: false, sheetColumn: systemField };
        }
        if (m.sheetColumn === sheetColumn) {
          return { ...m, systemField, matched: true };
        }
        return m;
      });
      return updated;
    });
  };

  // Remover mapeamento
  const removeMapping = (sheetColumn: string) => {
    setMappings(prev => prev.map(m => {
      if (m.sheetColumn === sheetColumn) {
        return { ...m, matched: false };
      }
      return m;
    }));
  };

  // Resetar para detecção automática
  const resetToAutoDetect = () => {
    const detected = autoDetectColumnMappings(sheetHeaders, tableName);
    setMappings(detected);
  };

  // Colunas mapeadas e não mapeadas
  const mappedColumns = mappings.filter(m => m.matched);
  const unmappedSheetColumns = sheetHeaders.filter(
    h => !mappings.some(m => m.matched && m.sheetColumn === h)
  );
  const unmappedSystemFields = schema?.columns.filter(
    c => !mappings.some(m => m.matched && m.systemField === c.name)
  ) || [];

  // Campos obrigatórios não mapeados
  const missingRequired = schema?.columns.filter(
    c => c.required && !mappings.some(m => m.matched && m.systemField === c.name)
  ) || [];

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Mapeamento de Colunas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Conecte as colunas da planilha com os campos do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {mappedColumns.length} / {sheetHeaders.length} mapeadas
            </Badge>
            <Button variant="ghost" size="sm" onClick={resetToAutoDetect}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Auto-detectar
            </Button>
          </div>
        </div>

        {/* Alerta para campos obrigatórios */}
        {missingRequired.length > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-warning/10 border border-warning/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm">
              Campos obrigatórios não mapeados: {missingRequired.map(c => c.name).join(', ')}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabela de mapeamento */}
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Coluna na Planilha</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[200px]">Campo no Sistema</TableHead>
                <TableHead>Amostra de Dados</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheetHeaders.map((header, idx) => {
                const mapping = mappings.find(m => m.sheetColumn === header);
                const isMatched = mapping?.matched;
                const sampleValue = sampleData[0]?.[idx];

                return (
                  <TableRow key={header} className={!isMatched ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={isMatched ? "default" : "outline"} className="font-mono">
                          {header}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMatched ? (
                        <Link2 className="h-4 w-4 text-success" />
                      ) : (
                        <Unlink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={isMatched ? mapping?.systemField : "__none__"}
                        onValueChange={(value) => {
                          if (value === "__none__") {
                            removeMapping(header);
                          } else {
                            updateMapping(header, value);
                          }
                        }}
                      >
                        <SelectTrigger className={isMatched ? "border-success/50" : ""}>
                          <SelectValue placeholder="Selecionar campo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Não mapear</span>
                          </SelectItem>
                          {schema?.columns.map((col) => {
                            const isUsed = mappings.some(
                              m => m.matched && m.systemField === col.name && m.sheetColumn !== header
                            );
                            return (
                              <SelectItem 
                                key={col.name} 
                                value={col.name}
                                disabled={isUsed}
                              >
                                <span className="flex items-center gap-2">
                                  {col.name}
                                  {col.required && (
                                    <Badge variant="destructive" className="text-[10px] h-4 px-1">*</Badge>
                                  )}
                                  {isUsed && <span className="text-muted-foreground">(em uso)</span>}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {sampleValue !== undefined ? String(sampleValue) : '-'}
                    </TableCell>
                    <TableCell>
                      {isMatched && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeMapping(header)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Campos do sistema não mapeados */}
        {unmappedSystemFields.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">
              Campos do sistema sem mapeamento (serão vazios):
            </p>
            <div className="flex flex-wrap gap-1">
              {unmappedSystemFields.map((col) => (
                <Badge 
                  key={col.name} 
                  variant="outline"
                  className={col.required ? "border-warning text-warning" : "opacity-50"}
                >
                  {col.name}
                  {col.required && " *"}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {mappedColumns.length} coluna(s) mapeada(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={() => onConfirm(mappings)}
              disabled={isLoading || missingRequired.length > 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Mapeamento
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
