import { createUploadUrl } from '../lib/photoStorage.js';
import { isAdminRequest } from '../lib/auth.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!isAdminRequest(req.headers.cookie)) {
    res.status(401).json({ error: 'Not authenticated. Please log in as admin.' });
    return;
  }

  const filename = (req.query?.filename as string) || 'upload.jpg';

  try {
    const { token, downloadUrl, path } = await createUploadUrl(filename);
    res.status(200).json({ token, downloadUrl, path });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
