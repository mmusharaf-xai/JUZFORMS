import { Request } from 'express';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface Form {
  id: string;
  user_id: string;
  name: string;
  fields: FormField[];
  header_config: HeaderFooterConfig;
  footer_config: HeaderFooterConfig;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FormField {
  id: string;
  type: WidgetType;
  label: string;
  description?: string;
  is_required: boolean;
  order: number;
  settings: Record<string, any>;
}

export type WidgetType =
  | 'TEXT'
  | 'LARGE_TEXT'
  | 'NUMBER'
  | 'JSON'
  | 'URL'
  | 'DATE'
  | 'DATETIME'
  | 'TIME'
  | 'DROPDOWN'
  | 'PHONE'
  | 'EMAIL'
  | 'RATINGS';

export interface HeaderFooterConfig {
  enabled: boolean;
  left: GridItem[];
  center: GridItem[];
  right: GridItem[];
}

export interface GridItem {
  id: string;
  type: 'button' | 'rich_text';
  content?: string;
  settings?: ButtonSettings | RichTextSettings;
}

export interface ButtonSettings {
  label: string;
  action_type: 'api_call' | 'database_create';
  api_config?: ApiConfig;
  database_config?: DatabaseActionConfig;
}

export interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: KeyValuePair[];
  query_params: KeyValuePair[];
  body: KeyValuePair[];
  send_full_form_data: boolean;
}

export interface DatabaseActionConfig {
  database_id: string;
  field_mappings: FieldMapping[];
}

export interface FieldMapping {
  form_field_id: string;
  column_name: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  use_field?: string;
}

export interface RichTextSettings {
  content: string;
}

export interface Database {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseColumn {
  id: string;
  database_id: string;
  name: string;
  type: ColumnType;
  is_unique: boolean;
  order: number;
  created_at: Date;
}

export type ColumnType =
  | 'TEXT'
  | 'LARGE_TEXT'
  | 'JSON'
  | 'URL'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'TIME'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'PHONE'
  | 'EMAIL'
  | 'RATINGS';

export interface DatabaseRow {
  id: string;
  database_id: string;
  data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  created_at: Date;
}
