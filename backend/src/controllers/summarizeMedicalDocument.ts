import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { MedicalDocument } from '@/models/index.js';
import { validateUrl } from '@/utils/validateUrl.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function urlToBase64(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function summarizeMedicalDocument(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['pro', 'enterprise'].includes(req.user.subscription_tier)) {
      return res.status(403).json({
        error: 'This feature is only available for Pro plan and above',
      });
    }

    const { file_url, document_id } = req.body;
    if (!file_url || !document_id) {
      return res.status(400).json({ error: 'Missing file_url or document_id' });
    }

    const document = await MedicalDocument.findOne({ id: document_id })
      .lean()
      .select('id created_by');
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if ((document as any).created_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      await validateUrl(file_url);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const base64Image = await urlToBase64(file_url);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please provide a concise summary (2-3 sentences) of this medical document.',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text : '';

    await MedicalDocument.findOneAndUpdate(
      { id: document_id },
      { $set: { summary } },
    );

    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
