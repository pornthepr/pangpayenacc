-- Total balance across every account as of just before p_date — the
-- "ยกยอดจากเดือนก่อน" carry-forward figure shown on the dashboard. Archived
-- accounts still count: archiving only hides an account from new-entry
-- pickers, it doesn't erase its history.
create or replace function rpc_balance_before(p_date date)
returns numeric
language sql
stable
set search_path = public
as $$
  select
    coalesce((select sum(opening_balance) from accounts), 0)
    + coalesce(
        (
          select sum(
            case
              when t.type = 'income' then t.amount
              when t.type = 'expense' then -t.amount
              else 0
            end
          )
          from transactions t
          where t.deleted_at is null and t.occurred_on < p_date
        ),
        0
      );
$$;
