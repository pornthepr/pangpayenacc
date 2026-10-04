-- ถังขยะ: ดึงรายการที่ลบไปแล้วภายใน 30 วัน (ปกติ RLS ของ transactions_select
-- จะซ่อนแถว deleted_at ไม่เป็น null ไว้ — ฟังก์ชันนี้คือทางเข้าเฉพาะหน้าถังขยะ)
create or replace function rpc_trash_transactions()
returns setof transactions
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_app_user() then
    raise exception 'not authorized';
  end if;

  return query
    select * from transactions
    where deleted_at is not null
      and deleted_at >= now() - interval '30 days'
    order by deleted_at desc;
end;
$$;

-- กู้คืนรายการ (ตั้ง deleted_at = null) — เหตุผลเดียวกับ soft_delete_transaction:
-- RLS SELECT policy กรอง deleted_at is null อยู่ ต้องใช้ security definer
create or replace function restore_transaction(p_id uuid)
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
  set deleted_at = null
  where id = p_id;
end;
$$;

-- Realtime: ให้รายการใหม่จากคนอื่นขึ้นทันทีในหน้ารายการโดยไม่ต้องรีเฟรช
alter publication supabase_realtime add table transactions;
