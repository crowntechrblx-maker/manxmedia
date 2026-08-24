/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { getSupabaseAdmin, PHOTOS_BUCKET } from './supabaseAdmin.js';

export async function createUploadUrl(filename: string): Promise<{ token: string; downloadUrl: string; path: string }> {
  const supabase = getSupabaseAdmin();
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
  const filePath = `photos/${uniqueName}`;

  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUploadUrl(filePath);
  if (error || !data) {
    throw new Error(error?.message || 'Failed to create signed upload URL');
  }

  const { data: publicData } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(filePath);

  // Note: the signed URL must be used via the Supabase JS client's
  // uploadToSignedUrl(path, token, file) — a plain fetch/PUT to the URL
  // will fail auth, since the token has to be sent the way that helper does it.
  return {
    token: data.token,
    downloadUrl: publicData.publicUrl,
    path: filePath,
  };
}

export async function deleteFileByUrl(imageUrl: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Extract the storage path from a Supabase public URL:
  // https://<project>.supabase.co/storage/v1/object/public/photos/photos/12345-name.jpg
  const marker = `/object/public/${PHOTOS_BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) {
    // Not a Supabase-hosted file (e.g. legacy S3 URL or base64) — nothing to clean up server-side.
    return;
  }
  const filePath = decodeURIComponent(imageUrl.slice(idx + marker.length));

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([filePath]);
  if (error) {
    throw new Error(error.message);
  }
}
