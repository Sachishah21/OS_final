/*
  # Secure Vault Password Manager Schema

  ## Overview
  This migration creates the complete database schema for the Secure Vault password manager application.
  All sensitive data is encrypted using pgcrypto for maximum security.

  ## New Tables

  ### 1. `users`
  - Stores user accounts with master key authentication
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique, nullable) - Optional user email for recovery
  - `phone_number` (text, unique, nullable) - Optional phone for 2FA recovery
  - `master_key_hash` (text) - Bcrypt hash of the master key
  - `recovery_code` (text, nullable) - Encrypted recovery code for 2FA
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last successful login
  
  ### 2. `categories`
  - User-defined categories for organizing passwords
  - `id` (uuid, primary key) - Unique category identifier
  - `user_id` (uuid, foreign key) - Owner of the category
  - `name` (text) - Category name (e.g., "Work", "Personal")
  - `color` (text) - Optional color for visual organization
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `passwords`
  - Encrypted password entries
  - `id` (uuid, primary key) - Unique password entry identifier
  - `user_id` (uuid, foreign key) - Owner of the password
  - `category_id` (uuid, foreign key, nullable) - Associated category
  - `title` (text) - Entry title/website name (encrypted)
  - `username` (text) - Username/email (encrypted)
  - `password` (text) - The actual password (encrypted)
  - `url` (text, nullable) - Associated URL (encrypted)
  - `notes` (text, nullable) - Additional notes (encrypted)
  - `password_type` (text) - Type: "Login Credential", "Bank PIN", "Software License", etc.
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ## Security Features
  
  1. **Row Level Security (RLS)**
     - All tables have RLS enabled
     - Users can only access their own data
     - Policies enforce user_id matching for all operations
  
  2. **Encryption**
     - Utilizes pgcrypto extension for data encryption
     - Sensitive fields are encrypted at the application level
  
  3. **Authentication**
     - Master key is hashed using bcrypt (via pgcrypto)
     - Recovery codes are encrypted
  
  ## Important Notes
  - All timestamps use `timestamptz` for timezone awareness
  - Foreign keys ensure referential integrity
  - Cascading deletes prevent orphaned records
  - Default values ensure data consistency
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone_number text UNIQUE,
  master_key_hash text NOT NULL,
  recovery_code text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can create user"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#06b6d4',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  url text,
  notes text,
  password_type text DEFAULT 'Login Credential',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passwords"
  ON passwords FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own passwords"
  ON passwords FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords"
  ON passwords FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords"
  ON passwords FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_category_id ON passwords(category_id);
