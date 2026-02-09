import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import DashboardPage from "./pages/DashboardPage";
import CasasPage from "./pages/CasasPage";
import DiarioPage from "./pages/DiarioPage";
import CaixaGeralPage from "./pages/CaixaGeralPage";
import SaquesAportesPage from "./pages/SaquesAportesPage";
import ApostasPage from "./pages/ApostasPage";
import SurebetsPage from "./pages/SurebetsPage";
import FechamentoPage from "./pages/FechamentoPage";
import DadosReferenciaPage from "./pages/DadosReferenciaPage";
import ResultadosPage from "./pages/ResultadosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import GestaoEstrategicaPage from "./pages/GestaoEstrategicaPage";
import AnaliseEstrategiasPage from "./pages/AnaliseEstrategiasPage";
import BancaPage from "./pages/BancaPage";
import PlanilhaPage from "./pages/PlanilhaPage";
import CassinoPage from "./pages/CassinoPage";
import DocumentacaoPage from "./pages/DocumentacaoPage";
import GoogleSheetsConfigPage from "./pages/GoogleSheetsConfigPage";
import LogsPage from "./pages/LogsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="bet-manager-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/casas" element={<CasasPage />} />
            <Route path="/diario" element={<DiarioPage />} />
            <Route path="/caixa" element={<CaixaGeralPage />} />
            <Route path="/saques-aportes" element={<SaquesAportesPage />} />
            <Route path="/apostas" element={<ApostasPage />} />
            <Route path="/surebets" element={<SurebetsPage />} />
            <Route path="/cassino" element={<CassinoPage />} />
            <Route path="/fechamento" element={<FechamentoPage />} />
            <Route path="/dados" element={<DadosReferenciaPage />} />
            <Route path="/resultados" element={<ResultadosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/gestao" element={<GestaoEstrategicaPage />} />
            <Route path="/analise" element={<AnaliseEstrategiasPage />} />
            <Route path="/banca" element={<BancaPage />} />
            <Route path="/planilha" element={<PlanilhaPage />} />
            <Route path="/docs" element={<DocumentacaoPage />} />
            <Route path="/google-sheets" element={<GoogleSheetsConfigPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
