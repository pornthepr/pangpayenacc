-- Phase 0: core schema for family income/expense tracker
-- 3 fixed users (golf/gap/group), no household table — see requirement doc section 7.

create extension if not exists pgcrypto;

create type account_kind as enum ('cash', 'bank', 'ewallet', 'other');
create type category_type as enum ('income', 'expense');
create type transaction_type as enum ('income', 'expense', 'transfer');

-- profiles: mirrors auth.users 1:1, created only by the seed script.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  color text not null,
  password_changed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column profiles.password_changed_at is 'null = still using the seeded default password';

create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind account_kind not null,
  opening_balance numeric(14, 2) not null default 0,
  color text,
  icon text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  note text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  type category_type not null,
  name text not null,
  parent_id uuid references categories (id) on delete set null,
  color text,
  icon text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  type transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null,
  account_id uuid not null references accounts (id),
  to_account_id uuid references accounts (id),
  category_id uuid references categories (id),
  contributor_profile_id uuid references profiles (id),
  contributor_name text,
  beneficiary_profile_id uuid references profiles (id),
  note text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint transfer_shape check (
    (type = 'transfer' and to_account_id is not null and to_account_id <> account_id and category_id is null)
    or (type in ('income', 'expense') and to_account_id is null and category_id is not null)
  )
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  storage_path text not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references profiles (id),
  at timestamptz not null default now()
);

create index transactions_occurred_on_idx on transactions (occurred_on desc);
create index transactions_account_id_idx on transactions (account_id);
create index transactions_to_account_id_idx on transactions (to_account_id);
create index transactions_category_id_idx on transactions (category_id);
create index categories_type_idx on categories (type);
create index audit_logs_table_record_idx on audit_logs (table_name, record_id);
