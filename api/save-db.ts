import { saveDB, DBData } from '../lib/db.js';
import { isAdminRequest } from '../lib/auth.js';
import { readJsonBody } from '../lib/readJsonBody.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAdminRequest(req.headers.cookie)) {
    res.status(401).json({ error: 'Not authenticated. Please log in as admin.' });
    return;
  }

  try {
    const db = (await readJsonBody(req)) as DBData;
    if (!db || !Array.isArray(db.photos) || !Array.isArray(db.categories) || !Array.isArray(db.messages)) {
      res.status(400).json({ error: 'Invalid database payload structure provided' });
      return;
    }
    await saveDB(db);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
