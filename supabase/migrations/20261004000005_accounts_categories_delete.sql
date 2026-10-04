-- Hard delete is allowed at the RLS layer, but the foreign keys from
-- transactions (account_id/to_account_id/category_id, default NO ACTION) still
-- block deleting a row that's actually in use — the app only offers delete
-- when a count query confirms zero referencing transactions, archive otherwise.
create policy accounts_delete on accounts
  for delete using (is_app_user());

create policy categories_delete on categories
  for delete using (is_app_user());
