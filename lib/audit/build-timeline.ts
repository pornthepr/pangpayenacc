import { formatMoney } from "@/lib/format/money";
import { formatThaiDateShort } from "@/lib/format/date";
import type { Database } from "@/lib/supabase/database.types";

type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuditEntry {
  id: number;
  actorName: string;
  at: string;
  descriptions: string[];
}

// Narrow view of a transactions row as it appears inside audit_logs'
// old_data/new_data jsonb snapshots (to_jsonb(row) — snake_case DB columns).
interface TransactionSnapshot {
  amount?: number;
  occurred_on?: string;
  category_id?: string | null;
  account_id?: string;
  to_account_id?: string | null;
  note?: string | null;
  contributor_profile_id?: string | null;
  contributor_name?: string | null;
  beneficiary_profile_id?: string | null;
  deleted_at?: string | null;
}

export function buildAuditTimeline(
  logs: AuditLog[],
  accountsById: Map<string, Account>,
  categoriesById: Map<string, Category>,
  profilesById: Map<string, Profile>
): AuditEntry[] {
  const accountName = (id?: string | null) => (id ? (accountsById.get(id)?.name ?? "?") : "-");
  const categoryName = (id?: string | null) => (id ? (categoriesById.get(id)?.name ?? "?") : "-");

  return logs.map((log) => {
    const actor = log.actor_id ? profilesById.get(log.actor_id) : null;
    const oldRow = (log.old_data ?? null) as TransactionSnapshot | null;
    const newRow = (log.new_data ?? null) as TransactionSnapshot | null;

    const descriptions: string[] = [];

    if (log.action === "INSERT") {
      descriptions.push("สร้างรายการ");
    } else if (log.action === "UPDATE" && oldRow && newRow) {
      if (!oldRow.deleted_at && newRow.deleted_at) {
        descriptions.push("ลบรายการ");
      } else if (oldRow.deleted_at && !newRow.deleted_at) {
        descriptions.push("กู้คืนรายการ");
      }
      if (oldRow.amount !== newRow.amount) {
        descriptions.push(
          `แก้จำนวนเงิน ${formatMoney(oldRow.amount ?? 0)} → ${formatMoney(newRow.amount ?? 0)}`
        );
      }
      if (oldRow.occurred_on !== newRow.occurred_on) {
        descriptions.push(
          `แก้วันที่ ${formatThaiDateShort(oldRow.occurred_on ?? "")} → ${formatThaiDateShort(newRow.occurred_on ?? "")}`
        );
      }
      if (oldRow.category_id !== newRow.category_id) {
        descriptions.push(`แก้หมวด ${categoryName(oldRow.category_id)} → ${categoryName(newRow.category_id)}`);
      }
      if (oldRow.account_id !== newRow.account_id) {
        descriptions.push(`แก้บัญชี ${accountName(oldRow.account_id)} → ${accountName(newRow.account_id)}`);
      }
      if (oldRow.to_account_id !== newRow.to_account_id) {
        descriptions.push(
          `แก้บัญชีปลายทาง ${accountName(oldRow.to_account_id)} → ${accountName(newRow.to_account_id)}`
        );
      }
      if (oldRow.note !== newRow.note) {
        descriptions.push("แก้หมายเหตุ");
      }
      if (
        oldRow.contributor_profile_id !== newRow.contributor_profile_id ||
        oldRow.contributor_name !== newRow.contributor_name
      ) {
        descriptions.push("แก้เงินจากใคร");
      }
      if (oldRow.beneficiary_profile_id !== newRow.beneficiary_profile_id) {
        descriptions.push("แก้จ่ายเพื่อใคร");
      }
      if (descriptions.length === 0) {
        descriptions.push("แก้ไขรายการ");
      }
    }

    return {
      id: log.id,
      actorName: actor?.display_name ?? "ไม่ทราบ",
      at: log.at,
      descriptions,
    };
  });
}
