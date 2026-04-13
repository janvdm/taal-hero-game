import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface ScoreEntry {
  playerName: string;
  playerId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSeconds: number;
  date: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const levelId = String(req.query['level'] ?? 'unknown');
  const key = `taal-hero:leaderboard:${levelId}`;

  if (req.method === 'GET') {
    try {
      const scores = await kv.lrange<ScoreEntry>(key, 0, 19);
      const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, 10);
      return res.status(200).json(sorted);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const entry = req.body as ScoreEntry;
      if (!entry || typeof entry.score !== 'number') {
        return res.status(400).json({ error: 'Ongeldige score data' });
      }
      await kv.lpush(key, entry);
      await kv.ltrim(key, 0, 99);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(200).json({ ok: false, message: 'KV not configured' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
