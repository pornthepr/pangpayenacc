// Hand-written to match supabase/migrations/*.sql until a live project exists to
// run `supabase gen types typescript` against (see README "Database types").

export type AccountKind = "cash" | "bank" | "ewallet" | "other";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense" | "transfer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          color: string;
          password_changed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          color: string;
          password_changed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          color?: string;
          password_changed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          kind: AccountKind;
          opening_balance: number;
          color: string | null;
          icon: string | null;
          sort_order: number;
          is_archived: boolean;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind: AccountKind;
          opening_balance?: number;
          color?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_archived?: boolean;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          type: CategoryType;
          name: string;
          parent_id: string | null;
          color: string | null;
          icon: string | null;
          sort_order: number;
          is_archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: CategoryType;
          name: string;
          parent_id?: string | null;
          color?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          type: TransactionType;
          amount: number;
          occurred_on: string;
          account_id: string;
          to_account_id: string | null;
          category_id: string | null;
          contributor_profile_id: string | null;
          contributor_name: string | null;
          beneficiary_profile_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_by: string | null;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          type: TransactionType;
          amount: number;
          occurred_on: string;
          account_id: string;
          to_account_id?: string | null;
          category_id?: string | null;
          contributor_profile_id?: string | null;
          contributor_name?: string | null;
          beneficiary_profile_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          transaction_id: string;
          storage_path: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          storage_path: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          actor_id: string | null;
          at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      v_account_balances: {
        Row: {
          account_id: string;
          balance: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      soft_delete_transaction: {
        Args: { p_id: string };
        Returns: undefined;
      };
      restore_transaction: {
        Args: { p_id: string };
        Returns: undefined;
      };
      rpc_trash_transactions: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["transactions"]["Row"][];
      };
      rpc_balance_before: {
        Args: { p_date: string };
        Returns: number;
      };
      rpc_monthly_summary: {
        Args: { p_from: string; p_to: string };
        Returns: { month: string; income: number; expense: number; net: number }[];
      };
      rpc_category_breakdown: {
        Args: { p_from: string; p_to: string; p_type: string };
        Returns: {
          category_id: string;
          category_name: string;
          color: string | null;
          icon: string | null;
          amount: number;
          percentage: number;
        }[];
      };
      rpc_contributions: {
        Args: { p_from: string; p_to: string };
        Returns: { label: string; color: string | null; amount: number }[];
      };
      rpc_daily_balance: {
        Args: { p_account_id: string; p_from: string; p_to: string };
        Returns: { day: string; balance: number }[];
      };
    };
  };
}
