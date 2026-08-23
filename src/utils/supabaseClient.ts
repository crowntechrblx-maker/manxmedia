/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side Supabase instance. Only ever uses the public "anon" key
 * (safe to expose in the browser bundle — never the service role key).
 * Its sole job here is uploading a file to a signed upload URL that our
 * own admin-gated /api/upload-url endpoint issued.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabasePublic = url && anonKey ? createClient(url, anonKey) : null;

export const PHOTOS_BUCKET = 'photos';
