export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      apostas: {
        Row: {
          casa_id: string | null
          casa_nome: string | null
          created_at: string
          data: string
          evento: string | null
          id: string
          lucro_prejuizo: number | null
          mercado: string | null
          obs: string | null
          odd: number | null
          resultado: string | null
          selecao: string | null
          stake: number
          updated_at: string
        }
        Insert: {
          casa_id?: string | null
          casa_nome?: string | null
          created_at?: string
          data?: string
          evento?: string | null
          id?: string
          lucro_prejuizo?: number | null
          mercado?: string | null
          obs?: string | null
          odd?: number | null
          resultado?: string | null
          selecao?: string | null
          stake: number
          updated_at?: string
        }
        Update: {
          casa_id?: string | null
          casa_nome?: string | null
          created_at?: string
          data?: string
          evento?: string | null
          id?: string
          lucro_prejuizo?: number | null
          mercado?: string | null
          obs?: string | null
          odd?: number | null
          resultado?: string | null
          selecao?: string | null
          stake?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostas_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
        ]
      }
      apostas_surebet: {
        Row: {
          casa1_id: string | null
          casa1_nome: string | null
          casa2_id: string | null
          casa2_nome: string | null
          casa3_id: string | null
          casa3_nome: string | null
          created_at: string
          data: string
          evento: string | null
          id: string
          investimento_total: number | null
          lucro_prejuizo: number | null
          obs: string | null
          odd1: number | null
          odd2: number | null
          odd3: number | null
          percentual_surebet: number | null
          resultado1: string | null
          resultado2: string | null
          resultado3: string | null
          selecao1: string | null
          selecao2: string | null
          selecao3: string | null
          stake1: number | null
          stake2: number | null
          stake3: number | null
          updated_at: string
        }
        Insert: {
          casa1_id?: string | null
          casa1_nome?: string | null
          casa2_id?: string | null
          casa2_nome?: string | null
          casa3_id?: string | null
          casa3_nome?: string | null
          created_at?: string
          data?: string
          evento?: string | null
          id?: string
          investimento_total?: number | null
          lucro_prejuizo?: number | null
          obs?: string | null
          odd1?: number | null
          odd2?: number | null
          odd3?: number | null
          percentual_surebet?: number | null
          resultado1?: string | null
          resultado2?: string | null
          resultado3?: string | null
          selecao1?: string | null
          selecao2?: string | null
          selecao3?: string | null
          stake1?: number | null
          stake2?: number | null
          stake3?: number | null
          updated_at?: string
        }
        Update: {
          casa1_id?: string | null
          casa1_nome?: string | null
          casa2_id?: string | null
          casa2_nome?: string | null
          casa3_id?: string | null
          casa3_nome?: string | null
          created_at?: string
          data?: string
          evento?: string | null
          id?: string
          investimento_total?: number | null
          lucro_prejuizo?: number | null
          obs?: string | null
          odd1?: number | null
          odd2?: number | null
          odd3?: number | null
          percentual_surebet?: number | null
          resultado1?: string | null
          resultado2?: string | null
          resultado3?: string | null
          selecao1?: string | null
          selecao2?: string | null
          selecao3?: string | null
          stake1?: number | null
          stake2?: number | null
          stake3?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostas_surebet_casa1_id_fkey"
            columns: ["casa1_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_surebet_casa2_id_fkey"
            columns: ["casa2_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_surebet_casa3_id_fkey"
            columns: ["casa3_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_geral: {
        Row: {
          banco: string | null
          created_at: string
          data: string
          descricao: string | null
          id: string
          origem_obs: string | null
          print_url: string | null
          tipo: string
          updated_at: string
          valor: number
          valor_aporte: number | null
          valor_custo: number | null
          valor_saque: number | null
        }
        Insert: {
          banco?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          origem_obs?: string | null
          print_url?: string | null
          tipo: string
          updated_at?: string
          valor: number
          valor_aporte?: number | null
          valor_custo?: number | null
          valor_saque?: number | null
        }
        Update: {
          banco?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          origem_obs?: string | null
          print_url?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
          valor_aporte?: number | null
          valor_custo?: number | null
          valor_saque?: number | null
        }
        Relationships: []
      }
      casas: {
        Row: {
          created_at: string
          data_criacao: string | null
          data_ultimo_deposito: string | null
          data_verificacao: string | null
          deposito_minimo: number | null
          depositos: number
          email: string | null
          id: string
          id_conta: string | null
          limite_saque_diario: number | null
          limite_saque_mensal: number | null
          link: string | null
          login: string | null
          lucro_prejuizo: number | null
          nome: string
          observacoes: string | null
          percentual_maximo_banca: number | null
          percentual_retorno: number | null
          quantidade_depositos: number
          quantidade_saques: number
          saldo_real: number | null
          saque_minimo: number | null
          saques: number
          senha: string | null
          situacao: string | null
          ultimo_deposito: number | null
          updated_at: string
          usando: boolean
          usuario: string | null
          verificada: boolean | null
        }
        Insert: {
          created_at?: string
          data_criacao?: string | null
          data_ultimo_deposito?: string | null
          data_verificacao?: string | null
          deposito_minimo?: number | null
          depositos?: number
          email?: string | null
          id?: string
          id_conta?: string | null
          limite_saque_diario?: number | null
          limite_saque_mensal?: number | null
          link?: string | null
          login?: string | null
          lucro_prejuizo?: number | null
          nome: string
          observacoes?: string | null
          percentual_maximo_banca?: number | null
          percentual_retorno?: number | null
          quantidade_depositos?: number
          quantidade_saques?: number
          saldo_real?: number | null
          saque_minimo?: number | null
          saques?: number
          senha?: string | null
          situacao?: string | null
          ultimo_deposito?: number | null
          updated_at?: string
          usando?: boolean
          usuario?: string | null
          verificada?: boolean | null
        }
        Update: {
          created_at?: string
          data_criacao?: string | null
          data_ultimo_deposito?: string | null
          data_verificacao?: string | null
          deposito_minimo?: number | null
          depositos?: number
          email?: string | null
          id?: string
          id_conta?: string | null
          limite_saque_diario?: number | null
          limite_saque_mensal?: number | null
          link?: string | null
          login?: string | null
          lucro_prejuizo?: number | null
          nome?: string
          observacoes?: string | null
          percentual_maximo_banca?: number | null
          percentual_retorno?: number | null
          quantidade_depositos?: number
          quantidade_saques?: number
          saldo_real?: number | null
          saque_minimo?: number | null
          saques?: number
          senha?: string | null
          situacao?: string | null
          ultimo_deposito?: number | null
          updated_at?: string
          usando?: boolean
          usuario?: string | null
          verificada?: boolean | null
        }
        Relationships: []
      }
      casas_tags: {
        Row: {
          casa_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          casa_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          casa_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casas_tags_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casas_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cassino: {
        Row: {
          buy_in: number | null
          cash_out: number | null
          created_at: string
          data: string
          duracao_minutos: number | null
          id: string
          jogo: string | null
          obs: string | null
          plataforma: string | null
          plataforma_id: string | null
          saldo_final: number | null
          saldo_inicial: number | null
          tipo: string | null
          tipo_registro: string
          updated_at: string
          valor_resultado: number | null
        }
        Insert: {
          buy_in?: number | null
          cash_out?: number | null
          created_at?: string
          data?: string
          duracao_minutos?: number | null
          id?: string
          jogo?: string | null
          obs?: string | null
          plataforma?: string | null
          plataforma_id?: string | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          tipo?: string | null
          tipo_registro?: string
          updated_at?: string
          valor_resultado?: number | null
        }
        Update: {
          buy_in?: number | null
          cash_out?: number | null
          created_at?: string
          data?: string
          duracao_minutos?: number | null
          id?: string
          jogo?: string | null
          obs?: string | null
          plataforma?: string | null
          plataforma_id?: string | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          tipo?: string | null
          tipo_registro?: string
          updated_at?: string
          valor_resultado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cassino_plataforma_id_fkey"
            columns: ["plataforma_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_referencia: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          ordem: number | null
          updated_at: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          updated_at?: string
          valor: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      diario_operacoes: {
        Row: {
          created_at: string
          data: string
          id: string
          obs: string | null
          saldo_final: number
          saldo_inicial: number
          tipo: string | null
          updated_at: string
          valor_resultado: number | null
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          obs?: string | null
          saldo_final?: number
          saldo_inicial?: number
          tipo?: string | null
          updated_at?: string
          valor_resultado?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          obs?: string | null
          saldo_final?: number
          saldo_inicial?: number
          tipo?: string | null
          updated_at?: string
          valor_resultado?: number | null
        }
        Relationships: []
      }
      fechamento: {
        Row: {
          aportes_externos: number
          created_at: string
          custos: number
          data_fim: string
          data_inicio: string
          dias_negativos: number | null
          dias_positivos: number | null
          divergencia: number | null
          id: string
          lucro_liquido: number | null
          melhor_dia: number | null
          meta_atingida: boolean | null
          meta_lucro: number | null
          obs: string | null
          pior_dia: number | null
          resumo_jogos: number
          roi_periodo: number | null
          saldo_inicial: number
          saldo_real: number | null
          saldo_teorico: number | null
          saques_pessoais: number
          taxa_acerto: number | null
          ticket_medio: number | null
          total_apostas: number | null
          updated_at: string
        }
        Insert: {
          aportes_externos?: number
          created_at?: string
          custos?: number
          data_fim: string
          data_inicio: string
          dias_negativos?: number | null
          dias_positivos?: number | null
          divergencia?: number | null
          id?: string
          lucro_liquido?: number | null
          melhor_dia?: number | null
          meta_atingida?: boolean | null
          meta_lucro?: number | null
          obs?: string | null
          pior_dia?: number | null
          resumo_jogos?: number
          roi_periodo?: number | null
          saldo_inicial?: number
          saldo_real?: number | null
          saldo_teorico?: number | null
          saques_pessoais?: number
          taxa_acerto?: number | null
          ticket_medio?: number | null
          total_apostas?: number | null
          updated_at?: string
        }
        Update: {
          aportes_externos?: number
          created_at?: string
          custos?: number
          data_fim?: string
          data_inicio?: string
          dias_negativos?: number | null
          dias_positivos?: number | null
          divergencia?: number | null
          id?: string
          lucro_liquido?: number | null
          melhor_dia?: number | null
          meta_atingida?: boolean | null
          meta_lucro?: number | null
          obs?: string | null
          pior_dia?: number | null
          resumo_jogos?: number
          roi_periodo?: number | null
          saldo_inicial?: number
          saldo_real?: number | null
          saldo_teorico?: number | null
          saques_pessoais?: number
          taxa_acerto?: number | null
          ticket_medio?: number | null
          total_apostas?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      okrs: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          key_result: string
          meta_valor: number | null
          objetivo: string
          status: string | null
          tipo: string
          updated_at: string
          valor_atual: number | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          key_result: string
          meta_valor?: number | null
          objetivo: string
          status?: string | null
          tipo: string
          updated_at?: string
          valor_atual?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          key_result?: string
          meta_valor?: number | null
          objetivo?: string
          status?: string | null
          tipo?: string
          updated_at?: string
          valor_atual?: number | null
        }
        Relationships: []
      }
      saques_aportes: {
        Row: {
          banco: string | null
          casa_id: string | null
          casa_nome: string | null
          created_at: string
          data: string
          id: string
          motivo: string | null
          obs: string | null
          print_url: string | null
          status: string | null
          tipo: string
          updated_at: string
          valor: number
          valor_deposito: number | null
          valor_saque: number | null
        }
        Insert: {
          banco?: string | null
          casa_id?: string | null
          casa_nome?: string | null
          created_at?: string
          data?: string
          id?: string
          motivo?: string | null
          obs?: string | null
          print_url?: string | null
          status?: string | null
          tipo: string
          updated_at?: string
          valor: number
          valor_deposito?: number | null
          valor_saque?: number | null
        }
        Update: {
          banco?: string | null
          casa_id?: string | null
          casa_nome?: string | null
          created_at?: string
          data?: string
          id?: string
          motivo?: string | null
          obs?: string | null
          print_url?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
          valor_deposito?: number | null
          valor_saque?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saques_aportes_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      resultados_apostas_esportivas: {
        Row: {
          casa_nome: string | null
          ganhos_total: number | null
          investimento_total: number | null
          resultado_total: number | null
          tipo_aposta: string | null
          total_movimentacoes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
