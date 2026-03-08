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
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          reminder_enabled?: boolean;
          reminder_day_of_month?: number | null;
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
