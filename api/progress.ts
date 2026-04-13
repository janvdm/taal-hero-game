import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

type LevelProgress = Record<string, { wrongCount: number; correctCount: number; mastered: boolean }>;
type AllProgress = Record<string, LevelProgress>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const playerId = String(req.query['player'] ?? '');
  if (!playerId || playerId === 'anoniem') {
    return res.status(200).json({});
  }

  const key = `taal-hero:progress:${playerId}`;

  if (req.method === 'GET') {
    try {
      const progress = await kv.get<AllProgress>(key);
      return res.status(200).json(progress ?? {});
    } catch {
      return res.status(200).json({});
    }
  }

  if (req.method === 'POST') {
    try {
      const progress = req.body as AllProgress;
      if (!progress || typeof progress !== 'object') {
        return res.status(400).json({ error: 'Ongeldige voortgang data' });
      }
      await kv.set(key, progress);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(200).json({ ok: false, message: 'KV not configured' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
