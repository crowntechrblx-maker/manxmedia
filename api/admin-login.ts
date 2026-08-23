import { checkCredentials, createSessionCookie } from '../lib/auth';
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

  const body = await readJsonBody(req);
  const { username, password } = body;

  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }

  const result = checkCredentials(String(username), String(password));

  if (!result.ok) {
    const status = result.error?.includes('disabled') ? 500 : 401;
    res.status(status).json({ error: result.error });
    return;
  }

  try {
    res.setHeader('Set-Cookie', createSessionCookie(String(username)));
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
