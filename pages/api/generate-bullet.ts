// /pages/api/generate-bullet.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM, mapMode } from '@/lib/ai';
import { deductCredits } from '@/lib/credits';

type Ok = { content: string; remainingCredits?: number };
type Err = { error: string };
type ResBody = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deduct = await deductCredits(req, res);
  if (!deduct.ok) return;

  try {
    const { prompt, model = 'gpt-5', temperature = 0.7 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt' });
    }

    // 使用 mapMode 來正確映射模型 ID
    const llmOpts = mapMode('outline', model);

    const content = await callLLM(
      [{ role: 'user', content: prompt }],
      {
        ...llmOpts,
        temperature,
        timeoutMs: 30000,
        title: 'Generate Bullet Point'
      }
    );

    return res.status(200).json({ content, remainingCredits: deduct.remainingCredits });
  } catch (error: any) {
    console.error('Error generating bullet point:', error);
    return res.status(500).json({ 
      error: error?.message || 'Failed to generate bullet point' 
    });
  }
}



