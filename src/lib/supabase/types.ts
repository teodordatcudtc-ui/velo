export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accountants: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          reminder_enabled: boolean;
          reminder_day_of_month: number | null;
          subscription_plan: "standard" | "premium";
          premium_until: string | null;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          subscription_plan?: "standard" | "premium";
          premium_until?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          subscription_plan?: "standard" | "premium";
          premium_until?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          accountant_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          unique_token: string;
          created_at: string;
          reminder_enabled: boolean;
          reminder_day_of_month: number | null;
          archived: boolean;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          unique_token: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          archived?: boolean;
        };
        Update: {
          accountant_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          unique_token?: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          archived?: boolean;
        };
      };
      document_types: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          client_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      uploads: {
        Row: {
          id: string;
          client_id: string;
          document_type_id: string;
          file_path: string;
          file_name: string;
          month: number;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          document_type_id: string;
          file_path: string;
          file_name: string;
          month: number;
          year: number;
          created_at?: string;
        };
        Update: {
          client_id?: string;
          document_type_id?: string;
          file_path?: string;
          file_name?: string;
          month?: number;
          year?: number;
          created_at?: string;
        };
      };
      early_access_codes: {
        Row: {
          code: string;
          active: boolean;
          valid_days: number;
          max_uses: number;
          used_count: number;
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          active?: boolean;
          valid_days?: number;
          max_uses?: number;
          used_count?: number;
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          code?: string;
          active?: boolean;
          valid_days?: number;
          max_uses?: number;
          used_count?: number;
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      early_access_redemptions: {
        Row: {
          id: string;
          code: string;
          accountant_id: string;
          redeemed_at: string;
          premium_until: string;
        };
        Insert: {
          id?: string;
          code: string;
          accountant_id: string;
          redeemed_at?: string;
          premium_until: string;
        };
        Update: {
          id?: string;
          code?: string;
          accountant_id?: string;
          redeemed_at?: string;
          premium_until?: string;
        };
      };
    };
  };
}

export type Accountant = Database["public"]["Tables"]["accountants"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type DocumentType = Database["public"]["Tables"]["document_types"]["Row"];
export type Upload = Database["public"]["Tables"]["uploads"]["Row"];

export type ClientWithDocs = Client & {
  document_types: DocumentType[];
};

export type UploadWithType = Upload & {
  document_types: { name: string } | null;
};
