import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { format } from "date-fns";
import type { Aposta, ApostaSurebet, SaquesAportes, CaixaGeral } from "@/types/database";

interface Cassino {
  id: string;
  data: string;
  tipo_registro: string;
  plataforma?: string | null;
  jogo?: string | null;
  valor_resultado?: number | null;
  tipo?: string | null;
}

interface TabelaDadosPeriodoProps {
  apostas: Aposta[];
  surebets: ApostaSurebet[];
  cassino: Cassino[];
  saquesAportes: SaquesAportes[];
  caixaGeral: CaixaGeral[];
  periodoInicio: string;
  periodoFim: string;
}

export function TabelaDadosPeriodo({
  apostas,
  surebets,
  cassino,
  saquesAportes,
  caixaGeral,
  periodoInicio,
  periodoFim,
}: TabelaDadosPeriodoProps) {
  // Filtrar dados por período
  const apostasFiltradas = useMemo(() => 
    apostas?.filter(a => a.data >= periodoInicio && a.data <= periodoFim) || [],
    [apostas, periodoInicio, periodoFim]
  );

  const surebetsFiltradas = useMemo(() => 
    surebets?.filter(s => s.data >= periodoInicio && s.data <= periodoFim) || [],
    [surebets, periodoInicio, periodoFim]
  );

  const cassinoFiltrado = useMemo(() => 
    cassino?.filter(c => c.data >= periodoInicio && c.data <= periodoFim) || [],
    [cassino, periodoInicio, periodoFim]
  );

  const movimentacoesFiltradas = useMemo(() => 
    saquesAportes?.filter(s => s.data >= periodoInicio && s.data <= periodoFim) || [],
    [saquesAportes, periodoInicio, periodoFim]
  );

  const caixaFiltrada = useMemo(() => 
    caixaGeral?.filter(c => c.data >= periodoInicio && c.data <= periodoFim) || [],
    [caixaGeral, periodoInicio, periodoFim]
  );

  const formatDate = (date: string) => {
    try {
      return format(new Date(date + "T00:00:00"), "dd/MM/yyyy");
    } catch {
      return date;
    }
  };

  const getResultadoBadge = (resultado: string | null) => {
    if (!resultado) return <Badge variant="secondary">Pendente</Badge>;
    if (resultado === "green") return <Badge className="bg-success text-success-foreground">Green</Badge>;
    if (resultado === "red") return <Badge variant="destructive">Red</Badge>;
    if (resultado === "void") return <Badge variant="secondary">Void</Badge>;
    return <Badge variant="outline">{resultado}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          📋 Dados Detalhados do Período
        </CardTitle>
        <CardDescription>
          Todos os registros de {formatDate(periodoInicio)} a {formatDate(periodoFim)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="apostas" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="apostas">
              Apostas ({apostasFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="surebets">
              Surebets ({surebetsFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="cassino">
              Cassino ({cassinoFiltrado.length})
            </TabsTrigger>
            <TabsTrigger value="movimentacoes">
              Mov. Casas ({movimentacoesFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="caixa">
              Caixa Geral ({caixaFiltrada.length})
            </TabsTrigger>
          </TabsList>

          {/* Apostas */}
          <TabsContent value="apostas">
            {apostasFiltradas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma aposta no período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Casa</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Seleção</TableHead>
                      <TableHead className="text-right">Stake</TableHead>
                      <TableHead className="text-right">Odd</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Lucro/Prej.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apostasFiltradas.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.data)}</TableCell>
                        <TableCell>{a.casa_nome || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{a.evento || "-"}</TableCell>
                        <TableCell>{a.selecao || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.stake)}</TableCell>
                        <TableCell className="text-right">{a.odd?.toFixed(2) || "-"}</TableCell>
                        <TableCell>{getResultadoBadge(a.resultado)}</TableCell>
                        <TableCell className={`text-right font-medium ${(a.lucro_prejuizo || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(a.lucro_prejuizo || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Surebets */}
          <TabsContent value="surebets">
            {surebetsFiltradas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma surebet no período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Casas</TableHead>
                      <TableHead className="text-right">Investimento</TableHead>
                      <TableHead className="text-right">% Surebet</TableHead>
                      <TableHead className="text-right">Lucro/Prej.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surebetsFiltradas.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{formatDate(s.data)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{s.evento || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {[s.casa1_nome, s.casa2_nome, s.casa3_nome].filter(Boolean).join(", ") || "-"}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(s.investimento_total || 0)}</TableCell>
                        <TableCell className="text-right">{s.percentual_surebet?.toFixed(2)}%</TableCell>
                        <TableCell className={`text-right font-medium ${(s.lucro_prejuizo || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(s.lucro_prejuizo || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Cassino */}
          <TabsContent value="cassino">
            {cassinoFiltrado.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma sessão de cassino no período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Jogo</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cassinoFiltrado.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{formatDate(c.data)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.tipo_registro === "diario" ? "Diário" : "Sessão"}</Badge>
                        </TableCell>
                        <TableCell>{c.plataforma || "-"}</TableCell>
                        <TableCell>{c.jogo || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${(c.valor_resultado || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(c.valor_resultado || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Movimentações nas Casas */}
          <TabsContent value="movimentacoes">
            {movimentacoesFiltradas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma movimentação nas casas no período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Casa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Obs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoesFiltradas.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatDate(m.data)}</TableCell>
                        <TableCell>
                          <Badge variant={m.tipo === "deposito" ? "default" : "secondary"}>
                            {m.tipo === "deposito" ? "Depósito" : "Saque"}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.casa_nome || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${m.tipo === 'deposito' ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(m.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.status || "concluido"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{m.obs || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Caixa Geral */}
          <TabsContent value="caixa">
            {caixaFiltrada.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum registro no caixa geral no período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caixaFiltrada.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{formatDate(c.data)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={c.tipo === "aporte" ? "default" : c.tipo === "saque" ? "secondary" : "destructive"}
                          >
                            {c.tipo === "aporte" ? "Aporte" : c.tipo === "saque" ? "Saque" : "Custo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{c.descricao || "-"}</TableCell>
                        <TableCell>{c.banco || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${c.tipo === 'aporte' ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(c.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
