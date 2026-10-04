alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table attachments enable row level security;
alter table audit_logs enable row level security;

-- profiles: everyone can read every profile (to show "entered by" names/colors),
-- but can only edit their own row, and only display_name/color (username is
-- protected separately by the profiles_protect_identity trigger).
create policy profiles_select on profiles
  for select using (is_app_user());

create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- accounts/categories: the 3 users have identical rights. No delete policy —
-- rows with transactions can only be archived, never removed (see requirement 3.1/3.2).
create policy accounts_select on accounts
  for select using (is_app_user());
create policy accounts_insert on accounts
  for insert with check (is_app_user());
create policy accounts_update on accounts
  for update using (is_app_user()) with check (is_app_user());

create policy categories_select on categories
  for select using (is_app_user());
create policy categories_insert on categories
  for insert with check (is_app_user());
create policy categories_update on categories
  for update using (is_app_user()) with check (is_app_user());

-- transactions: soft-deleted rows are hidden from normal selects; the trash
-- view/RPC (phase 4) reads them via a security-definer function instead.
-- No delete policy — removal is always a soft delete (UPDATE deleted_at).
create policy transactions_select on transactions
  for select using (is_app_user() and deleted_at is null);
create policy transactions_insert on transactions
  for insert with check (is_app_user());
create policy transactions_update on transactions
  for update using (is_app_user()) with check (is_app_user());

create policy attachments_select on attachments
  for select using (is_app_user());
create policy attachments_insert on attachments
  for insert with check (is_app_user());
create policy attachments_delete on attachments
  for delete using (is_app_user());

-- audit_logs: read-only from the client; only the log_audit() trigger (security
-- definer) may write to it.
create policy audit_logs_select on audit_logs
  for select using (is_app_user());
