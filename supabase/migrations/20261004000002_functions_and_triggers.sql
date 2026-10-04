-- Helper used by every RLS policy.
create or replace function is_app_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- created_by/updated_by/updated_at are always server-set from auth.uid(); clients cannot forge them.
create or replace function set_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    new.updated_by := auth.uid();
    new.updated_at := now();
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger accounts_set_audit_fields
  before insert or update on accounts
  for each row execute function set_audit_fields();

create trigger categories_set_audit_fields
  before insert or update on categories
  for each row execute function set_audit_fields();

create trigger transactions_set_audit_fields
  before insert or update on transactions
  for each row execute function set_audit_fields();

create or replace function set_attachment_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_by := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

create trigger attachments_set_created_by
  before insert on attachments
  for each row execute function set_attachment_created_by();

-- income/expense category type must match the transaction type; checked here because
-- a plain CHECK constraint cannot look up another table.
create or replace function validate_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_type category_type;
begin
  if new.type in ('income', 'expense') then
    select type into cat_type from categories where id = new.category_id;
    if cat_type is null then
      raise exception 'category_id is required for income/expense transactions';
    end if;
    if cat_type::text <> new.type::text then
      raise exception 'category type (%) does not match transaction type (%)', cat_type, new.type;
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_validate
  before insert or update on transactions
  for each row execute function validate_transaction();

-- username/id are immutable even for the profile owner.
create or replace function protect_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_identity
  before update on profiles
  for each row execute function protect_profile_identity();

-- Generic audit trail, written regardless of what RLS would otherwise allow.
create or replace function log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger accounts_audit
  after insert or update or delete on accounts
  for each row execute function log_audit();

create trigger categories_audit
  after insert or update or delete on categories
  for each row execute function log_audit();

create trigger transactions_audit
  after insert or update or delete on transactions
  for each row execute function log_audit();
