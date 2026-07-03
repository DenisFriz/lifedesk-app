import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { validateUrl } from '@/utils/validateUrl.js';

import { MedicalDocument } from '@/models/index.js';
import { Problem } from '@/models/index.js';
import { Workout } from '@/models/index.js';
import { BodyMeasurement } from '@/models/index.js';
import { RecurringIncome } from '@/models/index.js';
import { RecurringExpense } from '@/models/index.js';
import { Income } from '@/models/index.js';
import { Expense } from '@/models/index.js';
import { TangibleAsset } from '@/models/index.js';
import { Business } from '@/models/index.js';
import { Project } from '@/models/index.js';
import { Goal } from '@/models/index.js';
import { Task } from '@/models/index.js';
import { Event } from '@/models/index.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const frequencyMultipliers: Record<string, number> = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  quarterly: 0.33,
  yearly: 0.083,
};

export async function aiHealthChat(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (!['pro', 'enterprise'].includes(user.subscription_tier)) {
      return res.status(403).json({
        error: 'This feature is only available for Pro users and above',
      });
    }

    const { question, file_urls } = req.body;

    if (!question?.trim() && (!file_urls || file_urls.length === 0)) {
      return res.status(400).json({
        error: 'Question or images are required',
      });
    }

    const userId = user._id;

    const [
      medicalDocuments,
      problems,
      workouts,
      bodyMeasurements,
      recurringIncome,
      recurringExpense,
      income,
      expense,
      assets,
      businesses,
      projects,
      goals,
      tasks,
      events,
    ] = await Promise.all([
      MedicalDocument.find({ created_by: userId })
        .limit(5)
        .lean()
        .select('title summary description'),
      Problem.find({ created_by: userId })
        .limit(10)
        .lean()
        .select('title description'),
      Workout.find({ created_by: userId })
        .limit(3)
        .lean()
        .select('title duration_minutes'),
      BodyMeasurement.find({ created_by: userId })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean()
        .select('weight body_fat'),
      RecurringIncome.find({ created_by: userId })
        .limit(20)
        .lean()
        .select('active amount frequency'),
      RecurringExpense.find({ created_by: userId })
        .limit(20)
        .lean()
        .select('active amount frequency'),
      Income.find({ created_by: userId }).limit(50).lean().select('amount'),
      Expense.find({ created_by: userId }).limit(50).lean().select('amount'),
      TangibleAsset.find({ created_by: userId })
        .limit(20)
        .lean()
        .select('title current_value'),
      Business.find({ created_by: userId }).limit(10).lean().select('name'),
      Project.find({ created_by: userId })
        .limit(5)
        .lean()
        .select('name status'),
      Goal.find({ created_by: userId }).limit(5).lean().select('title'),
      Task.find({ created_by: userId }).limit(10).lean().select('title'),
      Event.find({ created_by: userId })
        .limit(5)
        .lean()
        .select('title start_date'),
    ]);

    let context = "User's Complete Personal & Professional Data:\n\n";

    // Medical
    if (medicalDocuments.length) {
      context += '📋 Medical Documents:\n';
      medicalDocuments.slice(0, 5).forEach((doc: any) => {
        context += `- ${doc.title}: ${doc.summary || doc.description || 'No details'}\n`;
      });
      context += '\n';
    }

    // Problems
    if (problems.length) {
      context += '⚠️ Health Problems:\n';
      problems.forEach((p: any) => {
        context += `- ${p.title}: ${p.description || 'No details'}\n`;
      });
      context += '\n';
    }

    // Workouts
    if (workouts.length) {
      context += '💪 Workouts:\n';
      workouts.slice(0, 3).forEach((w: any) => {
        context += `- ${w.title}: ${w.duration_minutes}min\n`;
      });
      context += '\n';
    }

    // Body
    if (bodyMeasurements.length) {
      const latest = bodyMeasurements[0];
      context += `⚖️ Body: Weight ${latest.weight}, Fat ${latest.body_fat}%\n\n`;
    }

    // Finance calc
    let monthlyIncome = 0;
    recurringIncome
      .filter((ri: any) => ri.active !== false)
      .forEach((ri: any) => {
        monthlyIncome +=
          (ri.amount || 0) * (frequencyMultipliers[ri.frequency] || 1);
      });

    let monthlyExpense = 0;
    recurringExpense
      .filter((re: any) => re.active !== false)
      .forEach((re: any) => {
        monthlyExpense +=
          (re.amount || 0) * (frequencyMultipliers[re.frequency] || 1);
      });

    const net = monthlyIncome - monthlyExpense;

    context += `💰 Monthly Budget:\nIncome: $${monthlyIncome.toFixed(
      2,
    )}\nExpenses: $${monthlyExpense.toFixed(2)}\nNet: $${net.toFixed(2)}\n\n`;

    if (income.length) {
      const total = income.reduce(
        (s: number, i: any) => s + (i.amount || 0),
        0,
      );
      context += `💵 Income total: $${total.toFixed(2)}\n`;
    }

    if (expense.length) {
      const total = expense.reduce(
        (s: number, e: any) => s + (e.amount || 0),
        0,
      );
      context += `💸 Expense total: $${total.toFixed(2)}\n\n`;
    }

    // Assets
    if (assets.length) {
      context += '🏠 Assets:\n';
      assets.slice(0, 3).forEach((a: any) => {
        context += `- ${a.title}: $${a.current_value || 0}\n`;
      });
      context += '\n';
    }

    // Business
    if (businesses.length) {
      context += '💼 Businesses:\n';
      businesses.forEach((b: any) => {
        context += `- ${b.name}\n`;
      });
      context += '\n';
    }

    // Projects
    if (projects.length) {
      context += '📊 Projects:\n';
      projects.slice(0, 3).forEach((p: any) => {
        context += `- ${p.name} (${p.status})\n`;
      });
      context += '\n';
    }

    // Goals
    if (goals.length) {
      context += '🎯 Goals:\n';
      goals.slice(0, 5).forEach((g: any) => {
        context += `- ${g.title}\n`;
      });
      context += '\n';
    }

    // Tasks
    if (tasks.length) {
      context += '✅ Tasks:\n';
      tasks.slice(0, 5).forEach((t: any) => {
        context += `- ${t.title}\n`;
      });
      context += '\n';
    }

    // Events
    if (events.length) {
      context += '📅 Events:\n';
      events.slice(0, 3).forEach((e: any) => {
        context += `- ${e.title}: ${e.start_date}\n`;
      });
      context += '\n';
    }

    const prompt = `You are a personal AI assistant with full life context.

${context}

User Question: ${question}`;

    const messages: any = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    if (file_urls?.length) {
      try {
        await Promise.all(file_urls.map((url: string) => validateUrl(url)));
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
      messages[0].content = [
        { type: 'text', text: prompt },
        ...file_urls.map((url: string) => ({
          type: 'image',
          source: { type: 'url', url },
        })),
      ];
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages,
    });

    return res.json({
      answer: response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join(''),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
