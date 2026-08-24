import { isAdminRequest } from '../lib/auth.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).json({ isAdmin: isAdminRequest(req.headers.cookie) });
}
