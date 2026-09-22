import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isMain } from './is-main.mjs';

const counters = ['inputTokens', 'cachedInputTokens', 'outputTokens', 'reasoningTokens', 'costUsd', 'toolCalls'];
const limitKeys = ['totalTokens', 'costUsd', 'agentStarts', 'toolCalls'];
const identifier = value => typeof value === 'string' && value.trim().length > 0;
const validCount = (value, key) => Number.isFinite(value) && value >= 0 && (key === 'costUsd' || Number.isSafeInteger(value));

// Input records are nonoverlapping model calls, never session cumulative totals.
// Missing telemetry remains unknown; known observations are lower bounds only.
export function summarizeUsage(ledger) {
  if (!ledger || ledger.version !== 1 || typeof ledger.completeCallLog !== 'boolean' ||
      !Array.isArray(ledger.agents) || !ledger.agents.length || !Array.isArray(ledger.calls)) {
    throw new Error('Need version 1, completeCallLog, agents and calls');
  }
  const agents = new Map();
  for (const agent of ledger.agents) {
    if (!agent || !identifier(agent.id) || agents.has(agent.id) || !identifier(agent.role) ||
        !(agent.model === null || identifier(agent.model)) || !(agent.parentId === null || identifier(agent.parentId))) {
      throw new Error('Invalid or duplicate agent');
    }
    agents.set(agent.id, agent);
  }
  if ([...agents.values()].filter(agent => agent.parentId === null).length !== 1) throw new Error('Need exactly one lead');
  for (const agent of agents.values()) {
    const visited = new Set([agent.id]);
    let parent = agent.parentId;
    while (parent !== null) {
      if (!agents.has(parent) || visited.has(parent)) throw new Error('Unknown parent or agent cycle');
      visited.add(parent);
      parent = agents.get(parent).parentId;
    }
  }
  const seen = new Set();
  for (const call of ledger.calls) {
    if (!call || !identifier(call.id) || seen.has(call.id) || !agents.has(call.agentId)) throw new Error('Invalid or duplicate call');
    seen.add(call.id);
    for (const key of counters) {
      if (call[key] !== null && !validCount(call[key], key)) throw new Error(`Record ${key} as a measurement or null`);
    }
    if ((call.inputTokens !== null && call.cachedInputTokens !== null && call.cachedInputTokens > call.inputTokens) ||
        (call.outputTokens !== null && call.reasoningTokens !== null && call.reasoningTokens > call.outputTokens)) {
      throw new Error('Cached/reasoning tokens must be subsets of input/output');
    }
  }
  const limits = ledger.limits ?? {};
  if (typeof limits !== 'object' || Array.isArray(limits)) throw new Error('Invalid limits');
  for (const [key, value] of Object.entries(limits)) {
    if (!limitKeys.includes(key) || !validCount(value, key)) throw new Error(`Invalid limit ${key}`);
  }
  const summarize = ids => {
    const calls = ledger.calls.filter(call => ids.has(call.agentId));
    const missingAgents = [...ids].filter(id => !calls.some(call => call.agentId === id));
    const counter = key => {
      const values = calls.map(call => key === 'totalTokens'
        ? (call.inputTokens === null || call.outputTokens === null ? null : call.inputTokens + call.outputTokens)
        : call[key]);
      const observed = key === 'totalTokens'
        ? calls.reduce((sum, call) => sum + (call.inputTokens ?? 0) + (call.outputTokens ?? 0), 0)
        : values.reduce((sum, value) => sum + (value ?? 0), 0);
      const complete = ledger.completeCallLog && !missingAgents.length && values.every(value => value !== null);
      return { observed, total: complete ? observed : null, measuredCalls: values.filter(value => value !== null).length, recordedCalls: calls.length };
    };
    return {
      agentCount: ids.size, recordedCalls: calls.length, missingAgents,
      ...Object.fromEntries([...counters, 'totalTokens'].map(key => [key, counter(key)])),
    };
  };
  const totals = summarize(new Set(agents.keys()));
  const agentStarts = agents.size - 1;
  const budgets = Object.fromEntries(Object.entries(limits).map(([key, limit]) => {
    const measure = key === 'agentStarts'
      ? { observed: agentStarts, total: ledger.completeCallLog ? agentStarts : null }
      : totals[key];
    const status = measure.observed > limit ? 'exceeded' : measure.observed === limit ? 'reached'
      : measure.total === null ? 'unmeasured' : 'within';
    return [key, { limit, observed: measure.observed, total: measure.total, status }];
  }));
  return {
    completeCallLog: ledger.completeCallLog, agentStarts, totals,
    byRole: [...new Set([...agents.values()].map(agent => agent.role))].map(role => ({
      role, ...summarize(new Set([...agents.values()].filter(agent => agent.role === role).map(agent => agent.id))),
    })),
    budgets,
    action: Object.values(budgets).some(budget => ['reached', 'exceeded'].includes(budget.status)) ? 'stop-new-work'
      : Object.values(budgets).some(budget => budget.status === 'unmeasured') ? 'resolve-budget-visibility' : 'review-before-next-work',
  };
}

if (isMain(import.meta.url)) {
  Promise.resolve().then(async () => {
    if (!process.argv[2]) throw new Error('Usage: node scripts/summarize-usage.mjs <ledger.json>');
    console.log(JSON.stringify(summarizeUsage(JSON.parse(await readFile(resolve(process.argv[2]), 'utf8'))), null, 2));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
