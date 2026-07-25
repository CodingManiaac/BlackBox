import { Router, Request, Response, NextFunction } from 'express';
import { HealthMonitor } from '../../src/monitoring/HealthMonitor';
import { db } from '../database/db';

const router = Router();

import fs from 'fs';
import path from 'path';

router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = HealthMonitor.getServicesHealth();
    res.json({ success: true, health });
  } catch (err) {
    next(err);
  }
});

import { seedDatabase } from '../database/seed';

// Get active API keys configuration
router.get('/config', (req: Request, res: Response) => {
  try {
    seedDatabase();
  } catch (e) {
    console.error('Dynamic seed execution failed:', e);
  }
  res.json({
    success: true,
    geminiKey: process.env.GEMINI_API_KEY || ''
  });
});

router.get('/ai-config', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = db.prepare('SELECT * FROM ai_configurations').all() as { key: string; value: string }[];
    const config: Record<string, string> = {};
    for (const item of list) {
      config[item.key] = item.value;
    }
    res.json({ success: true, config });
  } catch (err) {
    next(err);
  }
});

router.post('/ai-config', (req: Request, res: Response, next: NextFunction) => {
  const { activeModel, confidenceThreshold, triagePrompt, gisPrompt } = req.body;
  try {
    db.prepare('INSERT OR REPLACE INTO ai_configurations (key, value) VALUES (?, ?)').run('active_model', activeModel || 'Gemini 1.5 Pro');
    db.prepare('INSERT OR REPLACE INTO ai_configurations (key, value) VALUES (?, ?)').run('confidence_threshold', String(confidenceThreshold || 85));
    db.prepare('INSERT OR REPLACE INTO ai_configurations (key, value) VALUES (?, ?)').run('triage_prompt', triagePrompt || '');
    db.prepare('INSERT OR REPLACE INTO ai_configurations (key, value) VALUES (?, ?)').run('gis_prompt', gisPrompt || '');
    res.json({ success: true, message: 'AI configurations saved successfully.' });
  } catch (err) {
    next(err);
  }
});

// Update API keys and persist to .env
router.post('/config', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { geminiKey } = req.body;
    process.env.GEMINI_API_KEY = geminiKey || '';
    process.env.VITE_GEMINI_API_KEY = geminiKey || '';
    
    const envPath = path.resolve('.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
    
    let keyUpdated = false;
    let viteKeyUpdated = false;
    const lines = envContent.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('GEMINI_API_KEY=')) {
        keyUpdated = true;
        return `GEMINI_API_KEY=${geminiKey || ''}`;
      }
      if (trimmed.startsWith('VITE_GEMINI_API_KEY=')) {
        viteKeyUpdated = true;
        return `VITE_GEMINI_API_KEY=${geminiKey || ''}`;
      }
      return line;
    });
    
    if (!keyUpdated) {
      lines.push(`GEMINI_API_KEY=${geminiKey || ''}`);
    }
    if (!viteKeyUpdated) {
      lines.push(`VITE_GEMINI_API_KEY=${geminiKey || ''}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n').trim() + '\n', 'utf-8');
    res.json({ success: true, message: 'Gemini API key saved and persisted successfully.' });
  } catch (err) {
    next(err);
  }
});

import { GeminiProvider } from '../../src/integrations/GeminiProvider';

// Proxy endpoint for AI Assistant
router.post('/chat-assistant', async (req: Request, res: Response, next: NextFunction) => {
  const { prompt } = req.body;
  try {
    const responseText = await GeminiProvider.generateContent(prompt, 'text');
    res.json({ success: true, text: responseText });
  } catch (err) {
    next(err);
  }
});

// Proxy endpoint for Emergency Guidance Chat
router.post('/chat-emergency', async (req: Request, res: Response, next: NextFunction) => {
  const { prompt } = req.body;
  console.log('[SystemRouter] chat-emergency called. env key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 7)}...` : 'undefined');
  try {
    const responseText = await GeminiProvider.generateContent(prompt, 'text');
    res.json({ success: true, text: responseText });
  } catch (err) {
    next(err);
  }
});

export default router;
