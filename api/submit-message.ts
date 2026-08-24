import { loadDB, saveDB } from '../lib/db.js';
import { readJsonBody } from '../lib/readJsonBody.js';

/**
 * Public contact-form submission endpoint. Unlike /api/save-db (admin-only,
 * full overwrite), this only ever appends one validated message — a visitor
 * can never read, edit, or delete existing messages through this route.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }
    if (name.length > 200 || email.length > 200 || subject.length > 300 || message.length > 5000) {
      res.status(400).json({ error: 'One or more fields exceed the maximum allowed length.' });
      return;
    }

    const db = await loadDB();
    db.messages.unshift({
      id: `msg_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    await saveDB(db);

    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
