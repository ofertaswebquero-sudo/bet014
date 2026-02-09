
# 🚀 Bet - Sistema de Gestão de Banca de Alta Performance

O **Bet ** é um ecossistema SaaS desenvolvido para transformar a maneira como apostadores gerenciam seu capital. Diferente de planilhas convencionais, o sistema oferece uma interface de elite para controle de banca, análise de ROI e gestão estratégica multiplataforma.

## 🛠️ Stack Tecnológica

- **Frontend:** [React.js](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Build & Dev:** [Vite](https://vitejs.dev/)
- **Gerenciamento de Estado:** React Hooks e Context API
- **Ícones:** [Lucide-React](https://lucide.dev/)

## 📋 Funcionalidades do Ecossistema

O sistema é organizado em módulos lógicos para evitar a sobrecarga de informações:

### 1. Central Operacional
- **Dashboard:** Visão em tempo real da banca, lucro total, ROI e taxa de acerto (Win Rate).
- **Apostas:** Registro detalhado de cada entrada (Odd, Stake, Mercado).
- **Diário de Operações:** Campo para anotações psicológicas e contextuais do dia.
- **Surebets & Cassino:** Áreas segregadas para gestão de arbitragem e jogos de cassino (Aviator/Bac Bo).

### 2. Gestão Financeira
- **Banca & Caixa Geral:** Controle de capital total e fluxo de caixa diário.
- **Saques & Aportes:** Registro de todas as movimentações entre bancos e casas.
- **Fechamento:** Relatórios automáticos de performance mensal e semanal.

### 3. Integração e Inteligência
- **Conexão Google Sheets:** Sincronização como banco de dados externo para backup persistente.
- **Gestão de Casas:** Monitoramento de saldo individual por casa de aposta.
- **Configurações Estratégicas:** Definição de limites de Stop Loss e Stop Green.

## 🏗️ Arquitetura e Lógica de Dados

O projeto segue os melhores padrões de desenvolvimento modernos:
- **Hierarquia de Componentes:** Interface modularizada para facilitar a manutenção.
- **Persistência via Sheets:** Utiliza a API do Google Sheets para garantir que os dados financeiros pertençam ao usuário.
- **Tipagem Estrita:** Uso de interfaces TypeScript para garantir precisão em cálculos matemáticos.


## 🔒 Segurança e Privacidade

* **Permissões:** O sistema utiliza autenticação via OAuth2 para conexão segura com o Google Drive.
* **Zero Data Leak:** Informações sensíveis de apostas não são armazenadas em servidores de terceiros, apenas na infraestrutura do próprio usuário (Google Sheets).

