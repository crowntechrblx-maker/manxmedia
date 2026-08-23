/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-only Supabase client using the SERVICE ROLE key.
 * NEVER import this file from client-side (src/) code — the service role
 * key bypasses all row-level security and must stay secret.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(url && serviceKey);

export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const PHOTOS_BUCKET = 'photos';
