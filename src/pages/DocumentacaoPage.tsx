import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  BookOpen, 
  Calculator, 
  Database, 
  Layers, 
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  Target,
  BarChart3,
  Workflow,
  Info,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

// Estrutura da documentação
const DOCS_SECTIONS = [
  {
    id: "visao-geral",
    title: "Visão Geral",
    icon: BookOpen,
    description: "Entenda o propósito e funcionamento do sistema",
    articles: [
      {
        id: "intro",
        title: "Introdução ao BetManager",
        content: `
O **BetManager** é um sistema completo de gestão de apostas esportivas e cassino, projetado para ajudar apostadores a controlar sua banca, analisar resultados e tomar decisões baseadas em dados.

### Principais Funcionalidades

- **Dashboard**: Visão consolidada de todos os KPIs importantes
- **Casas de Apostas**: Gerenciamento completo de contas em casas de apostas
- **Apostas e Surebets**: Registro detalhado de cada aposta
- **Fechamento**: Reconciliação periódica de resultados
- **Gestão Estratégica**: OKRs e análise de risco avançada

### Filosofia

O sistema foi construído com foco em:
1. **Transparência**: Todas as fórmulas e cálculos são explicados
2. **Automação**: Dados são sincronizados automaticamente entre tabelas
3. **Análise**: Insights e alertas baseados nos seus dados reais
        `
      },
      {
        id: "fluxo-dados",
        title: "Fluxo de Dados",
        content: `
### Como os Dados se Conectam

\`\`\`
Apostas/Surebets → Casas (lucro_prejuizo, saldo_real)
    ↓
Saques/Aportes → Casas (depositos, saques)
    ↓
Diário → Fechamento (resultados do período)
    ↓
Caixa Geral → KPIs (aportes, saques, custos)
\`\`\`

### Sincronização Automática

Os **triggers do banco de dados** garantem que:

- Ao registrar uma **aposta**, o lucro/prejuízo é calculado automaticamente
- Ao marcar resultado (green/red), a **casa** tem seu saldo atualizado
- Ao fazer um **depósito/saque** na casa, os totais são recalculados
- O **saldo real** da casa é sempre: depósitos - saques + lucros
        `
      },
    ]
  },
  {
    id: "formulas",
    title: "Fórmulas e Cálculos",
    icon: Calculator,
    description: "Entenda como cada métrica é calculada",
    articles: [
      {
        id: "kpis-principais",
        title: "KPIs Principais",
        content: `
### Lucro Líquido Total
\`\`\`
Lucro Líquido = Resultado do Diário - Custos Operacionais
\`\`\`
Fonte: Soma de \`valor_resultado\` da tabela \`diario_operacoes\` menos soma de custos da \`caixa_geral\`.

---

### Banca Atual
\`\`\`
Banca Atual = Aportes - Saques + Lucro Líquido
\`\`\`
Representa o capital total disponível para operação.

---

### ROI Geral
\`\`\`
ROI = (Lucro Líquido / Total Depositado nas Casas) × 100
\`\`\`
Mede o retorno sobre o capital investido nas casas.

---

### Velocidade Cruzeiro
\`\`\`
Velocidade = Lucro Líquido Total / Número de Dias Operados
\`\`\`
Média de lucro por dia de operação.

---

### Exposição de Risco (Float)
\`\`\`
Float = Total Depositado - Total Sacado (nas casas)
\`\`\`
Dinheiro "na rua" - valor exposto em casas de apostas.
        `
      },
      {
        id: "kpis-risco",
        title: "KPIs de Risco",
        content: `
### Taxa de Sobrevivência (Runway)
\`\`\`
Runway = Banca Atual / |Pior Dia|
\`\`\`
Quantos dias a banca aguenta no pior cenário (repetindo o pior dia).

**Interpretação:**
- 🟢 > 30 dias: Saudável
- 🟡 15-30 dias: Atenção
- 🔴 < 15 dias: Crítico

---

### Máximo Drawdown (MDD)
\`\`\`
MDD = ((Pico - Vale) / Pico) × 100
\`\`\`
Maior perda percentual desde o pico de lucro acumulado.

**Interpretação:**
- 🟢 < 10%: Excelente
- 🟡 10-20%: Aceitável
- 🔴 > 20%: Revisar estratégia

---

### Float Percentual
\`\`\`
Float % = (Float / Banca Atual) × 100
\`\`\`

**Interpretação:**
- 🟢 < 30%: Seguro
- 🟡 30-50%: Moderado
- 🔴 > 50%: Alto risco de bloqueio
        `
      },
      {
        id: "apostas",
        title: "Cálculos de Apostas",
        content: `
### Lucro/Prejuízo por Aposta
\`\`\`
Se resultado = GREEN:
  Lucro = (Odd - 1) × Stake

Se resultado = RED:
  Prejuízo = -Stake

Se resultado = VOID ou CASHOUT:
  Lucro = 0
\`\`\`

---

### Percentual de Surebet
\`\`\`
% Surebet = 100 - ((1/Odd1 + 1/Odd2 + 1/Odd3) × 100)
\`\`\`
Valores positivos indicam arbitragem garantida.

---

### Taxa de Acerto
\`\`\`
Taxa = (Apostas Ganhas / Total de Apostas) × 100
\`\`\`

---

### Ticket Médio
\`\`\`
Ticket Médio = Soma de todos os Stakes / Número de Apostas
\`\`\`
        `
      },
      {
        id: "fechamento",
        title: "Cálculos do Fechamento",
        content: `
### Saldo Teórico
\`\`\`
Saldo Teórico = Saldo Inicial + Aportes + Lucros - Saques - Custos
\`\`\`
Valor esperado baseado em todos os registros do sistema.

---

### Saldo Real Total
\`\`\`
Saldo Real = Saldo no Banco + Saldo em Todas as Casas
\`\`\`
Valor conferido manualmente pelo usuário.

---

### Divergência
\`\`\`
Divergência = Saldo Real - Saldo Teórico
\`\`\`
- **Positivo**: Há dinheiro não registrado
- **Negativo**: Falta dinheiro ou registros incompletos
- **Zero**: Perfeita reconciliação

---

### ROI do Período
\`\`\`
ROI Período = (Lucro Líquido / Saldo Inicial) × 100
\`\`\`
        `
      },
    ]
  },
  {
    id: "tabelas",
    title: "Tabelas do Sistema",
    icon: Database,
    description: "Estrutura e relacionamento das tabelas",
    articles: [
      {
        id: "casas",
        title: "Casas de Apostas",
        content: `
### Campos Principais

| Campo | Descrição |
|-------|-----------|
| \`nome\` | Nome da casa de apostas |
| \`saldo_real\` | Saldo atual na conta (calculado automaticamente) |
| \`depositos\` | Total depositado (soma de saques_aportes) |
| \`saques\` | Total sacado (soma de saques_aportes) |
| \`lucro_prejuizo\` | Resultado das apostas nesta casa |
| \`situacao\` | ativa, pausada, limitada, encerrada |
| \`percentual_maximo_banca\` | Limite de concentração |

### Campos Automáticos (Calculados por Triggers)

- \`saldo_real\`: depositos - saques + lucro_prejuizo
- \`quantidade_depositos\` e \`quantidade_saques\`: Contadores
- \`data_ultimo_deposito\` e \`ultimo_deposito\`: Último depósito feito
        `
      },
      {
        id: "apostas-tab",
        title: "Apostas e Surebets",
        content: `
### Tabela: apostas

Apostas esportivas simples.

| Campo | Descrição |
|-------|-----------|
| \`data\` | Data da aposta |
| \`casa_id\` | Casa onde foi feita |
| \`evento\` | Ex: "Flamengo x Palmeiras" |
| \`selecao\` | Ex: "Over 2.5 Gols" |
| \`odd\` | Cotação |
| \`stake\` | Valor apostado |
| \`resultado\` | green, red, void, cashout, pendente |
| \`lucro_prejuizo\` | Calculado automaticamente |

### Tabela: apostas_surebet

Surebets (arbitragem) com 2-3 pernas.

| Campo | Descrição |
|-------|-----------|
| \`casa1_id\`, \`casa2_id\`, \`casa3_id\` | Casas envolvidas |
| \`odd1\`, \`odd2\`, \`odd3\` | Cotações |
| \`stake1\`, \`stake2\`, \`stake3\` | Stakes distribuídos |
| \`percentual_surebet\` | % de lucro garantido |
| \`investimento_total\` | Soma dos stakes |
        `
      },
      {
        id: "movimentacoes",
        title: "Movimentações Financeiras",
        content: `
### Tabela: saques_aportes

Movimentações entre banco pessoal e casas de apostas.

| Campo | Descrição |
|-------|-----------|
| \`tipo\` | deposito ou saque |
| \`casa_id\` | Casa envolvida |
| \`valor\` | Valor da movimentação |
| \`valor_deposito\` | Preenchido se for depósito |
| \`valor_saque\` | Preenchido se for saque |
| \`status\` | pendente, concluido, cancelado |

---

### Tabela: caixa_geral

Movimentações do "caixa" pessoal de apostas.

| Campo | Descrição |
|-------|-----------|
| \`tipo\` | aporte, saque, custo |
| \`valor\` | Valor total |
| \`valor_aporte\` | Se for aporte (entrada de capital) |
| \`valor_saque\` | Se for saque (retirada para uso pessoal) |
| \`valor_custo\` | Se for custo operacional |
        `
      },
    ]
  },
  {
    id: "paginas",
    title: "Páginas e Funcionalidades",
    icon: Layers,
    description: "Guia de cada tela do sistema",
    articles: [
      {
        id: "dashboard",
        title: "Dashboard",
        content: `
### Propósito
Visão consolidada de performance e saúde da operação.

### Seções

1. **KPIs Principais**: Lucro, Banca, ROI, Casas Ativas
2. **Movimentação**: Depositado, Sacado, Giro, Custos
3. **Performance**: Velocidade, Dias +/-, Melhor/Pior dia
4. **Apostas**: Total, Taxa de Acerto, Ticket Médio, Runway
5. **Projeções**: Semanal, Mensal, Anual
6. **Semáforo de Risco**: 5 métricas visuais de saúde

### Fonte dos Dados
Todos os dados vêm do hook \`useKPIs()\` que agrega informações de todas as tabelas.
        `
      },
      {
        id: "fechamento-page",
        title: "Fechamento",
        content: `
### Propósito
Reconciliação periódica entre dados do sistema e saldo real.

### Fluxo

1. Selecione o **período** (semanal, mensal, anual)
2. O sistema calcula automaticamente:
   - Lucros de apostas, surebets e cassino
   - Aportes e saques do período
   - Custos operacionais
3. Informe manualmente:
   - Saldo no Banco
   - Saldo nas Casas
4. Compare **Saldo Teórico vs Saldo Real**
5. Analise a **divergência** e investigue se necessário

### Dica
Uma divergência pequena (< 5%) é normal devido a bônus, cashbacks ou arredondamentos.
        `
      },
      {
        id: "gestao",
        title: "Gestão Estratégica",
        content: `
### Propósito
Análise avançada de risco e definição de metas (OKRs).

### Seções

1. **Insights**: Alertas e recomendações automáticas baseadas nos dados
2. **KPIs de Risco**: Float, Custo, Runway, MDD, Lucro Realizado
3. **Gráficos**: ROI Real vs Virtual, Volume por Casa
4. **OKRs**: Objetivos com métricas automáticas ou manuais

### OKRs Automáticos
Métricas como ROI, Lucro, Runway são atualizadas automaticamente a cada consulta.
        `
      },
    ]
  },
  {
    id: "alertas",
    title: "Alertas e Semáforos",
    icon: AlertTriangle,
    description: "Sistema de monitoramento de risco",
    articles: [
      {
        id: "semaforo",
        title: "Semáforo de Risco",
        content: `
### 5 Métricas Monitoradas

| Métrica | 🟢 Verde | 🟡 Amarelo | 🔴 Vermelho |
|---------|----------|------------|-------------|
| Float | < 30% | 30-50% | > 50% |
| Runway | > 30 dias | 15-30 dias | < 15 dias |
| MDD | < 10% | 10-20% | > 20% |
| Concentração | < 40% | 40-60% | > 60% |
| Win Rate | > 50% | 40-50% | < 40% |

### Onde Visualizar
- Dashboard: Componente "Semáforo de Risco"
- Gestão Estratégica: Cards de KPI de Risco
        `
      },
      {
        id: "alertas-auto",
        title: "Alertas Automáticos",
        content: `
### Tipos de Alertas

**🚨 Críticos (Vermelhos)**
- Float > 50%
- Runway < 15 dias
- MDD > 20%

**⚠️ Atenção (Amarelos)**
- Float 30-50%
- ROI Virtual >> ROI Real
- Concentração em uma casa > 60%
- Win Rate < 45%

**✅ Positivos (Verdes)**
- ROI > 5%
- Dias Positivos > 2× Dias Negativos
- Runway > 30 dias

### Ações Sugeridas
Cada alerta inclui uma **recomendação de ação** para corrigir o problema.
        `
      },
    ]
  },
];

export default function DocumentacaoPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(DOCS_SECTIONS[0].id);
  const [selectedArticle, setSelectedArticle] = useState(DOCS_SECTIONS[0].articles[0].id);

  const currentSection = DOCS_SECTIONS.find(s => s.id === selectedSection);
  const currentArticle = currentSection?.articles.find(a => a.id === selectedArticle);

  // Filtrar artigos pela busca
  const filteredSections = DOCS_SECTIONS.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0);

  return (
    <AppLayout title="Documentação" subtitle="Wiki completa do sistema BetManager">
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-4 pr-4">
              {(searchTerm ? filteredSections : DOCS_SECTIONS).map(section => {
                const Icon = section.icon;
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        setSelectedSection(section.id);
                        setSelectedArticle(section.articles[0].id);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </button>
                    
                    {selectedSection === section.id && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.articles.map(article => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article.id)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                              selectedArticle === article.id
                                ? "bg-secondary text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <ChevronRight className="h-3 w-3" />
                            {article.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Conteúdo */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {currentSection && (
                <>
                  <currentSection.icon className="h-4 w-4" />
                  {currentSection.title}
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-foreground">{currentArticle?.title}</span>
            </div>
            <CardTitle>{currentArticle?.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                {currentArticle?.content.split('\n').map((line, i) => {
                  // Renderização básica de markdown
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('---')) {
                    return <hr key={i} className="my-4 border-border" />;
                  }
                  if (line.startsWith('```')) {
                    return null; // Code blocks handled separately
                  }
                  if (line.startsWith('| ')) {
                    // Simplified table rendering
                    const cells = line.split('|').filter(Boolean).map(c => c.trim());
                    return (
                      <div key={i} className="flex border-b border-border">
                        {cells.map((cell, j) => (
                          <div key={j} className="flex-1 px-3 py-2 text-sm">{cell}</div>
                        ))}
                      </div>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                  }
                  if (line.match(/^\d+\. /)) {
                    return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.trim() === '') {
                    return <br key={i} />;
                  }
                  // Bold and code inline
                  const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1 rounded text-sm">$1</code>');
                  return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
