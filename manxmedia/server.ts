import "dotenv/config";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { loadDB, saveDB, toPublicDB, DBData } from './lib/db';
import { isAdminRequest, checkCredentials, createSessionCookie, createLogoutCookie } from './lib/auth';
import { createUploadUrl, deleteFileByUrl } from './lib/photoStorage';

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ==================== API ENDPOINTS ====================
// These mirror the serverless functions in /api exactly, so local dev
// (`npm run dev`) behaves the same as the deployed Vercel functions.

app.get('/api/get-db', async (req, res) => {
  try {
    const db = await loadDB();
    const admin = isAdminRequest(req.headers.cookie);
    res.json(admin ? db : toPublicDB(db));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save-db', async (req, res) => {
  if (!isAdminRequest(req.headers.cookie)) {
    res.status(401).json({ error: 'Not authenticated. Please log in as admin.' });
    return;
  }
  try {
    const db = req.body as DBData;
    if (!db || !Array.isArray(db.photos) || !Array.isArray(db.categories) || !Array.isArray(db.messages)) {
      res.status(400).json({ error: 'Invalid database payload structure provided' });
      return;
    }
    await saveDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submit-message', async (req, res) => {
  try {
    const body = req.body || {};
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
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin-login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }
  const result = checkCredentials(String(username), String(password));
  if (!result.ok) {
    res.status(result.error?.includes('disabled') ? 500 : 401).json({ error: result.error });
    return;
  }
  res.setHeader('Set-Cookie', createSessionCookie(String(username)));
  res.json({ success: true });
});

app.post('/api/admin-logout', async (req, res) => {
  res.setHeader('Set-Cookie', createLogoutCookie());
  res.json({ success: true });
});

app.get('/api/admin-check', async (req, res) => {
  res.json({ isAdmin: isAdminRequest(req.headers.cookie) });
});

app.get('/api/upload-url', async (req, res) => {
  if (!isAdminRequest(req.headers.cookie)) {
    res.status(401).json({ error: 'Not authenticated. Please log in as admin.' });
    return;
  }
  const filename = (req.query.filename as string) || 'upload.jpg';
  try {
    const { token, downloadUrl, path: filePath } = await createUploadUrl(filename);
    res.json({ token, downloadUrl, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/delete-file', async (req, res) => {
  if (!isAdminRequest(req.headers.cookie)) {
    res.status(401).json({ error: 'Not authenticated. Please log in as admin.' });
    return;
  }
  const { imageUrl } = req.body || {};
  if (!imageUrl) {
    res.status(400).json({ error: 'Missing imageUrl payload' });
    return;
  }
  try {
    await deleteFileByUrl(imageUrl);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FRONTEND OR VITE MIDDLEWARE ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Backend] Full-stack server actively running on http://localhost:${PORT}`);
  });
}

startServer();
