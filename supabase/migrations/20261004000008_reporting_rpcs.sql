-- All four run as the caller (default, no security definer) — the 3 users
-- already share equal read access to every transaction via existing RLS, so
-- there is nothing to bypass here.

-- "แนวโน้มรับ-จ่าย" / "สรุปเดือนนี้": one row per calendar month in [p_from, p_to].
-- Callers should pass month-aligned bounds (first/last day of month).
create or replace function rpc_monthly_summary(p_from date, p_to date)
returns table (month date, income numeric, expense numeric, net numeric)
language sql
stable
set search_path = public
as $$
  select
    month_start,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as income,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as expense,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)
      - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as net
  from generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month') as month_start
  left join transactions t
    on t.deleted_at is null
    and date_trunc('month', t.occurred_on) = month_start
  group by month_start
  order by month_start;
$$;

-- "จ่ายตามหมวด": per-category totals + share of total for one type within a range.
-- p_type is 'income' or 'expense' (plain text to sidestep the category_type vs
-- transaction_type enum mismatch — both only ever carry these two labels here).
create or replace function rpc_category_breakdown(p_from date, p_to date, p_type text)
returns table (
  category_id uuid,
  category_name text,
  color text,
  icon text,
  amount numeric,
  percentage numeric
)
language sql
stable
set search_path = public
as $$
  with totals as (
    select coalesce(sum(t.amount), 0) as total
    from transactions t
    where t.deleted_at is null and t.type::text = p_type
      and t.occurred_on between p_from and p_to
  )
  select
    c.id as category_id,
    c.name as category_name,
    c.color,
    c.icon,
    coalesce(sum(t.amount), 0) as amount,
    case when (select total from totals) > 0
      then round(coalesce(sum(t.amount), 0) / (select total from totals) * 100, 1)
      else 0
    end as percentage
  from categories c
  left join transactions t
    on t.category_id = c.id and t.deleted_at is null and t.type::text = p_type
    and t.occurred_on between p_from and p_to
  where c.type::text = p_type
  group by c.id, c.name, c.color, c.icon
  having coalesce(sum(t.amount), 0) > 0
  order by amount desc;
$$;

-- "เงินสมทบรายคน": income grouped by contributor (member or free-text name).
create or replace function rpc_contributions(p_from date, p_to date)
returns table (label text, color text, amount numeric)
language sql
stable
set search_path = public
as $$
  select
    coalesce(p.display_name, t.contributor_name) as label,
    p.color,
    sum(t.amount) as amount
  from transactions t
  left join profiles p on p.id = t.contributor_profile_id
  where t.deleted_at is null
    and t.type = 'income'
    and (t.contributor_profile_id is not null or t.contributor_name is not null)
    and t.occurred_on between p_from and p_to
  group by coalesce(p.display_name, t.contributor_name), p.color
  order by amount desc;
$$;

-- "ยอดคงเหลือรายบัญชี" (account detail line chart): running balance per day.
create or replace function rpc_daily_balance(p_account_id uuid, p_from date, p_to date)
returns table (day date, balance numeric)
language sql
stable
set search_path = public
as $$
  with acct as (
    select opening_balance from accounts where id = p_account_id
  ),
  daily_net as (
    select
      t.occurred_on as day,
      sum(
        case
          when t.type = 'income' and t.account_id = p_account_id then t.amount
          when t.type = 'expense' and t.account_id = p_account_id then -t.amount
          when t.type = 'transfer' and t.account_id = p_account_id then -t.amount
          when t.type = 'transfer' and t.to_account_id = p_account_id then t.amount
          else 0
        end
      ) as net
    from transactions t
    where t.deleted_at is null
      and (t.account_id = p_account_id or t.to_account_id = p_account_id)
    group by t.occurred_on
  ),
  days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ),
  joined as (
    select d.day, coalesce(dn.net, 0) as net
    from days d
    left join daily_net dn on dn.day = d.day
  ),
  running as (
    select day, sum(net) over (order by day) as running_delta from joined
  )
  select
    r.day,
    (select opening_balance from acct)
      + coalesce((select sum(dn.net) from daily_net dn where dn.day < p_from), 0)
      + r.running_delta as balance
  from running r
  order by r.day;
$$;
