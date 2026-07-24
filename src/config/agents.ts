import { AgentConfig } from '../types/workflow';

export const agentsConfig: Record<string, AgentConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini NLU Agent',
    enabled: true,
    priority: 1,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.10
  },
  triage: {
    id: 'triage',
    name: 'Triage Agent',
    enabled: true,
    priority: 2,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.10
  },
  memory: {
    id: 'memory',
    name: 'Memory Agent (Supermemory)',
    enabled: true,
    priority: 3,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.10
  },
  ece: {
    id: 'ece',
    name: 'ECE Engine',
    enabled: true,
    priority: 4,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.20
  },
  gis: {
    id: 'gis',
    name: 'GIS Agent',
    enabled: true,
    priority: 5,
    retryLimit: 2,
    retryDelayMs: 300,
    weight: 0.10
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory Agent',
    enabled: true,
    priority: 6,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.15
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics Agent',
    enabled: true,
    priority: 7,
    retryLimit: 2,
    retryDelayMs: 300,
    weight: 0.10
  },
  decision: {
    id: 'decision',
    name: 'Decision Engine',
    enabled: true,
    priority: 8,
    retryLimit: 3,
    retryDelayMs: 200,
    weight: 0.15
  }
};
