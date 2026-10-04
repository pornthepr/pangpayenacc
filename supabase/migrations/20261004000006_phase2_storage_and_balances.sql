-- Attachments: private bucket, one object per slip/receipt photo at
-- {transaction_id}/{file}. All 3 app users share identical rights (no
-- per-row ownership check needed beyond is_app_user()).
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy attachments_storage_select on storage.objects
  for select using (bucket_id = 'attachments' and is_app_user());

create policy attachments_storage_insert on storage.objects
  for insert with check (bucket_id = 'attachments' and is_app_user());

create policy attachments_storage_delete on storage.objects
  for delete using (bucket_id = 'attachments' and is_app_user());

-- Running balance per account = opening balance + income - expense, with
-- transfers debiting the source and crediting the destination. Soft-deleted
-- transactions are excluded. security_invoker so callers still go through
-- the normal RLS on accounts/transactions rather than the view owner's.
create view v_account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.opening_balance
    + coalesce(sum(case when t.type = 'income' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'expense' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'transfer' and t.account_id = a.id then t.amount else 0 end), 0)
    + coalesce(sum(case when t.type = 'transfer' and t.to_account_id = a.id then t.amount else 0 end), 0)
    as balance
from accounts a
left join transactions t
  on (t.account_id = a.id or t.to_account_id = a.id) and t.deleted_at is null
group by a.id, a.opening_balance;
