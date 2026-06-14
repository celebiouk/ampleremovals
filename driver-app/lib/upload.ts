import * as FileSystem from "expo-file-system/legacy";
import { ENV } from "./env";
import { supabase } from "./supabase";

/**
 * Upload a local image URI to Supabase Storage via our bearer-authenticated
 * server route. Returns the storage path + a long-lived signed URL.
 *
 * `path` is the destination key, e.g. `jobs/<id>/pickup/photos/<ts>`.
 */
export async function uploadImage(uri: string, path: string): Promise<{ path: string; signedUrl: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  // Infer a sensible mime from the file extension.
  const lower = uri.toLowerCase();
  const mime = lower.endsWith(".png") ? "image/png" : "image/jpeg";

  const res = await FileSystem.uploadAsync(`${ENV.SITE_URL}/api/drivers/upload`, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    mimeType: mime,
    parameters: { path },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (res.status < 200 || res.status >= 300) {
    let msg = `Upload failed (${res.status})`;
    try { msg = (JSON.parse(res.body) as { error?: string }).error ?? msg; } catch { /* non-JSON */ }
    throw new Error(msg);
  }
  const json = JSON.parse(res.body) as { path: string; signedUrl: string | null };
  return json;
}

/** Persist a signature data-URL (PNG base64) to storage and return its URL. */
export async function uploadSignature(dataUrl: string, path: string): Promise<{ path: string; signedUrl: string | null }> {
  // Write the base64 payload to a temp file, then reuse the multipart upload.
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const tmp = `${FileSystem.cacheDirectory}sig-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(tmp, base64, { encoding: FileSystem.EncodingType.Base64 });
  try {
    return await uploadImage(tmp, path.endsWith(".png") ? path : `${path}.png`);
  } finally {
    FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
  }
}
