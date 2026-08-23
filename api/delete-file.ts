import { deleteFileByUrl } from '../lib/photoStorage';
import { isAdminRequest } from '../lib/auth';
import { readJsonBody } from '../lib/readJsonBody';

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

  const { imageUrl } = await readJsonBody(req);
  if (!imageUrl) {
    res.status(400).json({ error: 'Missing imageUrl' });
    return;
  }

  try {
    await deleteFileByUrl(imageUrl);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
