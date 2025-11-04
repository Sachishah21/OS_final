export interface User {
  id: string;
  email?: string;
  phone_number?: string;
  master_key_hash: string;
  recovery_code?: string;
  created_at: string;
  last_login: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Password {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  password_type: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedPassword extends Omit<Password, 'title' | 'username' | 'password' | 'url' | 'notes'> {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: Category;
}

export type PasswordType = 'Login Credential' | 'Bank PIN' | 'Software License' | 'API Key' | 'Credit Card' | 'Other';
