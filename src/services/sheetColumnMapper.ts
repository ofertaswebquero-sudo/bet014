// Serviço de mapeamento inteligente de colunas entre Google Sheets e sistema

export interface ColumnMapping {
  sheetColumn: string;
  systemField: string;
  matched: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'uuid';
    required: boolean;
    aliases?: string[];
    readOnly?: boolean;
    isGenerated?: boolean;
  }[];
}

// Schema das tabelas do sistema com aliases para matching flexível
export const TABLE_SCHEMAS: Record<string, TableSchema> = {
  casas: {
    tableName: 'casas',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'nome', type: 'string', required: true, aliases: ['name', 'casa', 'plataforma', 'bookmaker'] },
      { name: 'depositos', type: 'number', required: false, aliases: ['deposits', 'total_depositos', 'valor_depositos'] },
      { name: 'saques', type: 'number', required: false, aliases: ['withdrawals', 'total_saques', 'valor_saques'] },
      { name: 'lucro_prejuizo', type: 'number', required: false, aliases: ['profit_loss', 'pnl', 'resultado'], isGenerated: true },
      { name: 'percentual_retorno', type: 'number', required: false, aliases: ['roi', 'return_pct'], isGenerated: true },
      { name: 'ultimo_deposito', type: 'number', required: false, aliases: ['last_deposit'] },
      { name: 'data_ultimo_deposito', type: 'date', required: false, aliases: ['last_deposit_date'] },
      { name: 'quantidade_depositos', type: 'number', required: false, aliases: ['deposit_count', 'num_depositos'] },
      { name: 'quantidade_saques', type: 'number', required: false, aliases: ['withdrawal_count', 'num_saques'] },
      { name: 'deposito_minimo', type: 'number', required: false, aliases: ['min_deposit'] },
      { name: 'saque_minimo', type: 'number', required: false, aliases: ['min_withdrawal'] },
      { name: 'usando', type: 'boolean', required: false, aliases: ['active', 'ativa', 'em_uso'] },
      { name: 'situacao', type: 'string', required: false, aliases: ['status', 'estado'] },
      { name: 'login', type: 'string', required: false, aliases: ['username', 'user'] },
      { name: 'senha', type: 'string', required: false, aliases: ['password', 'pass'] },
      { name: 'email', type: 'string', required: false },
      { name: 'link', type: 'string', required: false, aliases: ['url', 'website'] },
      { name: 'data_criacao', type: 'date', required: false, aliases: ['created', 'criado_em'] },
      { name: 'usuario', type: 'string', required: false, aliases: ['user_id'] },
      { name: 'id_conta', type: 'string', required: false, aliases: ['account_id'] },
      { name: 'verificada', type: 'boolean', required: false, aliases: ['verified'] },
      { name: 'data_verificacao', type: 'date', required: false, aliases: ['verification_date'] },
      { name: 'observacoes', type: 'string', required: false, aliases: ['notes', 'obs', 'notas'] },
      { name: 'saldo_real', type: 'number', required: false, aliases: ['balance', 'saldo', 'real_balance'] },
      { name: 'percentual_maximo_banca', type: 'number', required: false, aliases: ['max_stake_percent'] },
      { name: 'limite_saque_diario', type: 'number', required: false, aliases: ['daily_limit'] },
      { name: 'limite_saque_mensal', type: 'number', required: false, aliases: ['monthly_limit'] },
    ],
  },
  apostas: {
    tableName: 'apostas',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data', type: 'date', required: true, aliases: ['date', 'dt'] },
      { name: 'evento', type: 'string', required: false, aliases: ['event', 'jogo', 'game', 'match'] },
      { name: 'mercado', type: 'string', required: false, aliases: ['market', 'tipo_aposta'] },
      { name: 'selecao', type: 'string', required: false, aliases: ['selection', 'pick', 'escolha'] },
      { name: 'stake', type: 'number', required: true, aliases: ['valor', 'aposta', 'amount'] },
      { name: 'odd', type: 'number', required: false, aliases: ['odds', 'cotacao'] },
      { name: 'resultado', type: 'string', required: false, aliases: ['result', 'status'] },
      { name: 'lucro_prejuizo', type: 'number', required: false, aliases: ['profit', 'lucro', 'resultado_valor'] },
      { name: 'casa_nome', type: 'string', required: false, aliases: ['casa', 'bookmaker', 'plataforma'] },
      { name: 'casa_id', type: 'uuid', required: false },
      { name: 'obs', type: 'string', required: false, aliases: ['notes', 'observacoes', 'notas'] },
    ],
  },
  caixa_geral: {
    tableName: 'caixa_geral',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data', type: 'date', required: true, aliases: ['date', 'dt'] },
      { name: 'tipo', type: 'string', required: true, aliases: ['type', 'categoria'] },
      { name: 'valor', type: 'number', required: true, aliases: ['value', 'amount', 'quantia'] },
      { name: 'descricao', type: 'string', required: false, aliases: ['description', 'desc', 'detalhes'] },
      { name: 'banco', type: 'string', required: false, aliases: ['bank', 'conta'] },
      { name: 'origem_obs', type: 'string', required: false, aliases: ['origin', 'origem'] },
      { name: 'valor_aporte', type: 'number', required: false, aliases: ['deposit_value'], isGenerated: true },
      { name: 'valor_saque', type: 'number', required: false, aliases: ['withdrawal_value'], isGenerated: true },
      { name: 'valor_custo', type: 'number', required: false, aliases: ['cost_value'], isGenerated: true },
    ],
  },
  saques_aportes: {
    tableName: 'saques_aportes',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data', type: 'date', required: true, aliases: ['date', 'dt'] },
      { name: 'tipo', type: 'string', required: true, aliases: ['type', 'categoria'] },
      { name: 'valor', type: 'number', required: true, aliases: ['value', 'amount'] },
      { name: 'casa_nome', type: 'string', required: false, aliases: ['casa', 'bookmaker'] },
      { name: 'casa_id', type: 'uuid', required: false },
      { name: 'banco', type: 'string', required: false, aliases: ['bank'] },
      { name: 'motivo', type: 'string', required: false, aliases: ['reason'] },
      { name: 'status', type: 'string', required: false, aliases: ['estado'] },
      { name: 'obs', type: 'string', required: false, aliases: ['notes', 'observacoes'] },
      { name: 'valor_deposito', type: 'number', required: false, isGenerated: true },
      { name: 'valor_saque', type: 'number', required: false, isGenerated: true },
    ],
  },
  diario_operacoes: {
    tableName: 'diario_operacoes',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data', type: 'date', required: true, aliases: ['date', 'dt'] },
      { name: 'saldo_inicial', type: 'number', required: true, aliases: ['opening_balance', 'saldo_abertura'] },
      { name: 'saldo_final', type: 'number', required: true, aliases: ['closing_balance', 'saldo_fechamento'] },
      { name: 'valor_resultado', type: 'number', required: false, aliases: ['result', 'resultado'], isGenerated: true },
      { name: 'tipo', type: 'string', required: false, aliases: ['type'], isGenerated: true },
      { name: 'obs', type: 'string', required: false, aliases: ['notes', 'observacoes'] },
    ],
  },
  fechamento: {
    tableName: 'fechamento',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data_inicio', type: 'date', required: true, aliases: ['start_date', 'inicio'] },
      { name: 'data_fim', type: 'date', required: true, aliases: ['end_date', 'fim'] },
      { name: 'saldo_inicial', type: 'number', required: false, aliases: ['opening_balance'] },
      { name: 'saldo_real', type: 'number', required: false, aliases: ['real_balance', 'saldo_atual'] },
      { name: 'saldo_teorico', type: 'number', required: false, aliases: ['theoretical_balance'], isGenerated: true },
      { name: 'lucro_liquido', type: 'number', required: false, aliases: ['net_profit', 'lucro'] },
      { name: 'aportes_externos', type: 'number', required: false, aliases: ['external_deposits'] },
      { name: 'saques_pessoais', type: 'number', required: false, aliases: ['personal_withdrawals'] },
      { name: 'custos', type: 'number', required: false, aliases: ['costs', 'expenses'] },
      { name: 'resumo_jogos', type: 'number', required: false, aliases: ['games_summary'] },
      { name: 'divergencia', type: 'number', required: false, isGenerated: true },
    ],
  },
  dados_referencia: {
    tableName: 'dados_referencia',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'categoria', type: 'string', required: true, aliases: ['category', 'type'] },
      { name: 'valor', type: 'string', required: true, aliases: ['value'] },
      { name: 'descricao', type: 'string', required: false, aliases: ['description'] },
      { name: 'ativo', type: 'boolean', required: false, aliases: ['active', 'enabled'] },
      { name: 'ordem', type: 'number', required: false, aliases: ['order', 'position'] },
    ],
  },
  okrs: {
    tableName: 'okrs',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'objetivo', type: 'string', required: true, aliases: ['objective', 'goal'] },
      { name: 'key_result', type: 'string', required: true, aliases: ['kr', 'resultado_chave'] },
      { name: 'tipo', type: 'string', required: true, aliases: ['type'] },
      { name: 'data_inicio', type: 'date', required: true, aliases: ['start_date'] },
      { name: 'data_fim', type: 'date', required: false, aliases: ['end_date'] },
      { name: 'meta_valor', type: 'number', required: false, aliases: ['target', 'meta'] },
      { name: 'valor_atual', type: 'number', required: false, aliases: ['current', 'atual'] },
      { name: 'status', type: 'string', required: false, aliases: ['estado'] },
    ],
  },
  apostas_surebet: {
    tableName: 'apostas_surebet',
    columns: [
      { name: 'id', type: 'uuid', required: false },
      { name: 'data', type: 'date', required: true, aliases: ['date', 'dt'] },
      { name: 'evento', type: 'string', required: false, aliases: ['event', 'jogo'] },
      { name: 'investimento_total', type: 'number', required: false, aliases: ['total_investment'], isGenerated: true },
      { name: 'lucro_prejuizo', type: 'number', required: false, aliases: ['profit', 'lucro'] },
      { name: 'percentual_surebet', type: 'number', required: false, aliases: ['surebet_percent'] },
      { name: 'casa1_nome', type: 'string', required: false },
      { name: 'casa2_nome', type: 'string', required: false },
      { name: 'casa3_nome', type: 'string', required: false },
      { name: 'odd1', type: 'number', required: false },
      { name: 'odd2', type: 'number', required: false },
      { name: 'odd3', type: 'number', required: false },
      { name: 'stake1', type: 'number', required: false },
      { name: 'stake2', type: 'number', required: false },
      { name: 'stake3', type: 'number', required: false },
      { name: 'selecao1', type: 'string', required: false },
      { name: 'selecao2', type: 'string', required: false },
      { name: 'selecao3', type: 'string', required: false },
      { name: 'resultado1', type: 'string', required: false },
      { name: 'resultado2', type: 'string', required: false },
      { name: 'resultado3', type: 'string', required: false },
      { name: 'obs', type: 'string', required: false, aliases: ['notes'] },
    ],
  },
};

// Normalizar nome de coluna para comparação
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]/g, '_') // Substituir não-alfanuméricos por _
    .replace(/_+/g, '_') // Remover duplicatas de _
    .replace(/^_|_$/g, ''); // Remover _ no início e fim
}

// Encontrar índice da coluna na planilha baseado em possíveis nomes
export function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  const normalizedPossible = possibleNames.map(n => normalizeColumnName(n));

  for (const name of normalizedPossible) {
    const idx = normalizedHeaders.indexOf(name);
    if (idx !== -1) return idx;
  }

  return -1;
}

// Auto-detectar mapeamentos
export function autoDetectColumnMappings(sheetHeaders: string[], tableName: string): ColumnMapping[] {
  const schema = TABLE_SCHEMAS[tableName];
  if (!schema) {
    return sheetHeaders.map(h => ({
      sheetColumn: h,
      systemField: normalizeColumnName(h).replace(/\s+/g, '_'),
      matched: true,
    }));
  }

  const mappings: ColumnMapping[] = [];
  const matchedSystemFields = new Set<string>();

  sheetHeaders.forEach((header) => {
    const normalizedHeader = normalizeColumnName(header);
    
    const matchedCol = schema.columns.find(col => {
      if (matchedSystemFields.has(col.name)) return false;
      const possibleNames = [col.name, ...(col.aliases || [])].map(n => normalizeColumnName(n));
      return possibleNames.includes(normalizedHeader);
    });

    if (matchedCol) {
      matchedSystemFields.add(matchedCol.name);
      mappings.push({
        sheetColumn: header,
        systemField: matchedCol.name,
        matched: true,
      });
    } else {
      mappings.push({
        sheetColumn: header,
        systemField: normalizedHeader,
        matched: false,
      });
    }
  });

  return mappings;
}

// Converter valor baseado no tipo
export function convertValue(value: any, type: string): any {
  if (value === null || value === undefined || value === '') {
    if (type === 'number') return 0;
    return null;
  }

  switch (type) {
    case 'number':
      if (typeof value === 'string') {
        const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      }
      return typeof value === 'number' ? value : 0;
    case 'boolean':
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'sim' || lower === 'true' || lower === '1' || lower === 's';
      }
      return !!value;
    case 'date':
      if (typeof value === 'string') {
        // Tentar converter DD/MM/YYYY para YYYY-MM-DD
        const parts = value.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return value;
    default:
      return value;
  }
}

// Mapear linha da planilha para objeto do sistema
export function mapSheetRowToSystem(row: any[], headers: string[], mappings: ColumnMapping[], tableName: string): Record<string, any> {
  const schema = TABLE_SCHEMAS[tableName];
  const result: Record<string, any> = {};

  mappings.forEach(m => {
    if (!m.matched) return;
    
    const colIdx = headers.indexOf(m.sheetColumn);
    if (colIdx === -1) return;

    const value = row[colIdx];
    const colSchema = schema?.columns.find(c => c.name === m.systemField);
    
    result[m.systemField] = convertValue(value, colSchema?.type || 'string');
  });

  return result;
}

// Limpar dados para o Supabase (remover colunas geradas para evitar erros)
export function cleanDataForSupabase(data: Record<string, any>, tableName: string): Record<string, any> {
  const cleaned = { ...data };
  
  // Lista exaustiva de colunas geradas em todas as tabelas para garantir que nenhuma passe
  const generatedColumns = [
    'lucro_prejuizo', 
    'percentual_retorno', 
    'valor_aporte', 
    'valor_saque', 
    'valor_custo', 
    'valor_deposito', 
    'valor_resultado', 
    'tipo', // em algumas tabelas o tipo é gerado
    'investimento_total',
    'saldo_teorico',
    'divergencia'
  ];

  generatedColumns.forEach(col => {
    if (col in cleaned) {
      delete cleaned[col];
    }
  });

  return cleaned;
}

// Validar dados antes de inserir
export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

export function validateRow(data: Record<string, any>, tableName: string, existingIds: Set<string>): ValidationResult {
  const schema = TABLE_SCHEMAS[tableName];
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!schema) return result;

  schema.columns.forEach(col => {
    if (col.required && (data[col.name] === null || data[col.name] === undefined || data[col.name] === '')) {
      result.errors.push({ field: col.name, message: `Campo obrigatório ausente` });
      result.isValid = false;
    }
  });

  return result;
}
