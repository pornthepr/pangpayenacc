-- Closing (end-of-month) balance across every account, for each month in
-- [p_from, p_to] — used by the trend charts to show "ยอดคงเหลือ" per month
-- instead of net. Cumulative from the very start of the ledger (not just
-- p_from), same as rpc_balance_before, so a display window that starts mid-
-- history still shows the real running balance.
create or replace function rpc_monthly_balance(p_from date, p_to date)
returns table (month date, balance numeric)
language sql
stable
set search_path = public
as $$
  with months as (
    select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date as month_start
  ),
  monthly_net as (
    select
      date_trunc('month', t.occurred_on)::date as month_start,
      sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'expense' then -t.amount
          else 0
        end
      ) as net
    from transactions t
    where t.deleted_at is null
    group by date_trunc('month', t.occurred_on)
  )
  select
    m.month_start as month,
    coalesce((select sum(opening_balance) from accounts), 0)
      + coalesce(sum(mn.net) filter (where mn.month_start <= m.month_start), 0) as balance
  from months m
  left join monthly_net mn on true
  group by m.month_start
  order by m.month_start;
$$;
