import { loadDB, toPublicDB } from '../lib/db.js';
import { isAdminRequest } from '../lib/auth.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const db = await loadDB();
    const admin = isAdminRequest(req.headers.cookie);
    res.status(200).json(admin ? db : toPublicDB(db));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
