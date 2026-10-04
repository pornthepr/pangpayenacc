import { createClient } from "@/lib/supabase/client";
import { compressImage } from "./compress-image";

export async function uploadAttachment(transactionId: string, file: File): Promise<void> {
  const supabase = createClient();
  const compressed = await compressImage(file);
  const path = `${transactionId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, compressed, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("attachments")
    .insert({ transaction_id: transactionId, storage_path: path });
  if (insertError) throw insertError;
}

export async function removeAttachment(attachmentId: string, storagePath: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("attachments").remove([storagePath]);
  await supabase.from("attachments").delete().eq("id", attachmentId);
}

export async function getSignedAttachmentUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrls(paths, 60 * 60);

  const map: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  });
  return map;
}
