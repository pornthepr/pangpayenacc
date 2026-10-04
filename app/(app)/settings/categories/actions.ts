"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryFormSchema } from "@/lib/validation/category";

export interface CategoryFormState {
  error?: string;
  success?: boolean;
}

function parseFormData(formData: FormData) {
  return categoryFormSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });
}

export async function upsertCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const id = formData.get("id");
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();

  if (typeof id === "string" && id) {
    // type is immutable after creation — existing transactions depend on it matching.
    const { error } = await supabase
      .from("categories")
      .update({ name: parsed.data.name, color: parsed.data.color, icon: parsed.data.icon })
      .eq("id", id);
    if (error) return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  } else {
    const { error } = await supabase.from("categories").insert({
      type: parsed.data.type,
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
    });
    if (error) return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/settings/categories");
  return { success: true };
}

export async function setCategoryArchivedAction(id: string, isArchived: boolean) {
  const supabase = await createClient();
  await supabase.from("categories").update({ is_archived: isArchived }).eq("id", id);
  revalidatePath("/settings/categories");
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return { error: "หมวดนี้มีรายการแล้ว ลบไม่ได้ ใช้ย้ายรวมหรือปิดใช้งานแทน" };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/settings/categories");
  return {};
}

export async function mergeCategoryAction(
  sourceId: string,
  targetId: string
): Promise<{ error?: string }> {
  if (sourceId === targetId) {
    return { error: "กรุณาเลือกหมวดปลายทางที่ไม่ใช่หมวดเดิม" };
  }

  const supabase = await createClient();

  const [{ data: source }, { data: target }] = await Promise.all([
    supabase.from("categories").select("type").eq("id", sourceId).single(),
    supabase.from("categories").select("type").eq("id", targetId).single(),
  ]);

  if (!source || !target || source.type !== target.type) {
    return { error: "ย้ายรวมได้เฉพาะหมวดประเภทเดียวกัน" };
  }

  const { error: moveError } = await supabase
    .from("transactions")
    .update({ category_id: targetId })
    .eq("category_id", sourceId);

  if (moveError) {
    return { error: "ย้ายรายการไม่สำเร็จ กรุณาลองใหม่" };
  }

  const { error: deleteError } = await supabase.from("categories").delete().eq("id", sourceId);
  if (deleteError) {
    return { error: "ย้ายรายการสำเร็จ แต่ลบหมวดเดิมไม่สำเร็จ กรุณาลบด้วยตนเอง" };
  }

  revalidatePath("/settings/categories");
  return {};
}

export async function moveCategoryAction(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("categories")
    .select("id, type, sort_order")
    .eq("id", id)
    .single();
  if (!current) return;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("type", current.type)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });
  if (!categories) return;

  const index = categories.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return;

  const swapWith = categories[swapIndex];

  await Promise.all([
    supabase.from("categories").update({ sort_order: swapWith.sort_order }).eq("id", id),
    supabase
      .from("categories")
      .update({ sort_order: current.sort_order })
      .eq("id", swapWith.id),
  ]);

  revalidatePath("/settings/categories");
}
