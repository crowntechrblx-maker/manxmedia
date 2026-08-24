/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Site data (photos/categories/messages) is stored as a single JSONB blob
 * in the `site_data` Supabase table, in the row with id = 1. This keeps the
 * same shape the frontend already expects (see src/utils/storage.ts) while
 * moving persistence from "nowhere" (the endpoints didn't exist on Vercel)
 * to a real Postgres database.
 */
import { getSupabaseAdmin } from './supabaseAdmin.js';

export interface DBData {
  photos: any[];
  categories: any[];
  messages: any[];
}

export const DEFAULT_DB: DBData = {
  photos: [],
  categories: [
    { id: 'cat_1', name: 'Landscapes', order: 1 },
    { id: 'cat_2', name: 'Automotive', order: 2 },
    { id: 'cat_3', name: 'Portraits', order: 3 },
    { id: 'cat_4', name: 'Commercial', order: 4 },
  ],
  messages: [],
};

const ROW_ID = 1;

export async function loadDB(): Promise<DBData> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('site_data')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load site data: ${error.message}`);
  }

  if (!data) {
    // First-ever run: seed the row so future saves can use upsert cleanly.
    await saveDB(DEFAULT_DB);
    return DEFAULT_DB;
  }

  const blob = data.data as Partial<DBData>;
  return {
    photos: blob.photos ?? [],
    categories: blob.categories ?? DEFAULT_DB.categories,
    messages: blob.messages ?? [],
  };
}

export async function saveDB(db: DBData): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('site_data')
    .upsert({ id: ROW_ID, data: db, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`Failed to save site data: ${error.message}`);
  }
}

/** Strips content that non-admin visitors should never see. */
export function toPublicDB(db: DBData): DBData {
  return {
    photos: db.photos.filter((p) => p.isPublished),
    categories: db.categories,
    messages: [], // contact messages are write-only for the public
  };
}
