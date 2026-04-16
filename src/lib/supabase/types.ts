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
          subscription_plan: "none" | "standard" | "premium";
          premium_until: string | null;
          billing_legal_name: string | null;
          billing_vat_code: string | null;
          billing_address: string | null;
          billing_city: string | null;
          billing_county: string | null;
          billing_country: string | null;
          billing_email: string | null;
          billing_is_company: boolean | null;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          subscription_plan?: "none" | "standard" | "premium";
          premium_until?: string | null;
          billing_legal_name?: string | null;
          billing_vat_code?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_county?: string | null;
          billing_country?: string | null;
          billing_email?: string | null;
          billing_is_company?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
          subscription_plan?: "none" | "standard" | "premium";
          premium_until?: string | null;
          billing_legal_name?: string | null;
          billing_vat_code?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_county?: string | null;
          billing_country?: string | null;
          billing_email?: string | null;
          billing_is_company?: boolean | null;
        };
      };
      smartbill_invoices: {
        Row: {
          id: string;
          accountant_id: string;
          stripe_checkout_session_id: string | null;
          stripe_invoice_id: string | null;
          smartbill_series: string;
          smartbill_number: string;
          amount_cents: number;
          currency: string;
          plan: string | null;
          billing_interval: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          smartbill_series: string;
          smartbill_number: string;
          amount_cents: number;
          currency?: string;
          plan?: string | null;
          billing_interval?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          smartbill_series?: string;
          smartbill_number?: string;
          amount_cents?: number;
          currency?: string;
          plan?: string | null;
          billing_interval?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      smartbill_sync_log: {
        Row: {
          id: string;
          accountant_id: string;
          stripe_checkout_session_id: string | null;
          stripe_invoice_id: string | null;
          status: "skipped" | "success" | "error";
          error_message: string | null;
          smartbill_series: string | null;
          smartbill_number: string | null;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          status: "skipped" | "success" | "error";
          error_message?: string | null;
          smartbill_series?: string | null;
          smartbill_number?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          status?: "skipped" | "success" | "error";
          error_message?: string | null;
          smartbill_series?: string | null;
          smartbill_number?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      anaf_connections: {
        Row: {
          accountant_id: string;
          enabled: boolean;
          company_cif: string;
          api_base_url: string;
          oauth_token_url: string;
          oauth_client_id: string;
          oauth_client_secret: string;
          oauth_refresh_token: string;
          access_token: string | null;
          access_token_expires_at: string | null;
          consecutive_failures: number;
          circuit_open_until: string | null;
          last_synced_at: string | null;
          last_error: string | null;
          last_error_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          accountant_id: string;
          enabled?: boolean;
          company_cif: string;
          api_base_url?: string;
          oauth_token_url: string;
          oauth_client_id: string;
          oauth_client_secret: string;
          oauth_refresh_token: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          consecutive_failures?: number;
          circuit_open_until?: string | null;
          last_synced_at?: string | null;
          last_error?: string | null;
          last_error_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          accountant_id?: string;
          enabled?: boolean;
          company_cif?: string;
          api_base_url?: string;
          oauth_token_url?: string;
          oauth_client_id?: string;
          oauth_client_secret?: string;
          oauth_refresh_token?: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          consecutive_failures?: number;
          circuit_open_until?: string | null;
          last_synced_at?: string | null;
          last_error?: string | null;
          last_error_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      anaf_client_tax_mappings: {
        Row: {
          id: string;
          accountant_id: string;
          client_id: string;
          tax_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          client_id: string;
          tax_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          client_id?: string;
          tax_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      anaf_sync_log: {
        Row: {
          id: string;
          accountant_id: string;
          status: "success" | "partial" | "skipped" | "error";
          detail: string | null;
          error_message: string | null;
          imported_count: number;
          skipped_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          status: "success" | "partial" | "skipped" | "error";
          detail?: string | null;
          error_message?: string | null;
          imported_count?: number;
          skipped_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          status?: "success" | "partial" | "skipped" | "error";
          detail?: string | null;
          error_message?: string | null;
          imported_count?: number;
          skipped_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      anaf_message_receipts: {
        Row: {
          id: string;
          accountant_id: string;
          company_cif: string;
          message_id: string;
          partner_tax_code: string | null;
          client_id: string | null;
          upload_id: string | null;
          file_path: string | null;
          file_name: string | null;
          status: "imported" | "unmapped" | "download_error" | "parse_error";
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          company_cif: string;
          message_id: string;
          partner_tax_code?: string | null;
          client_id?: string | null;
          upload_id?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          status: "imported" | "unmapped" | "download_error" | "parse_error";
          detail?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          company_cif?: string;
          message_id?: string;
          partner_tax_code?: string | null;
          client_id?: string | null;
          upload_id?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          status?: "imported" | "unmapped" | "download_error" | "parse_error";
          detail?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
