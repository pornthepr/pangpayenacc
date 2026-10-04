-- A plain client-side UPDATE setting deleted_at fails RLS: Postgres checks the
-- table's SELECT policy against the row's *new* state for any UPDATE that
-- returns rows (which PostgREST's RETURNING always does, Prefer header or
-- not), and the new row (deleted_at not null) fails transactions_select's
-- "deleted_at is null" clause. A security-definer RPC sidesteps that.
create or replace function soft_delete_transaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_app_user() then
    raise exception 'not authorized';
  end if;

  update transactions
  set deleted_at = now()
  where id = p_id;
end;
$$;
