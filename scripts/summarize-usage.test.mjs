import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeUsage } from './summarize-usage.mjs';

const call = (id, agentId, overrides = {}) => ({
  id, agentId, inputTokens: 100, cachedInputTokens: 60, outputTokens: 40,
  reasoningTokens: 20, costUsd: 0.1, toolCalls: 2, ...overrides,
});
const ledger = () => ({
  version: 1, completeCallLog: true,
  agents: [
    { id: 'lead', parentId: null, role: 'lead', model: 'selected-lead' },
    { id: 'collector', parentId: 'lead', role: 'extraction', model: 'selected-support' },
    { id: 'replacement', parentId: 'lead', role: 'extraction', model: null },
  ],
  calls: [call('lead-1', 'lead'), call('failed-1', 'collector'), call('retry-1', 'replacement'), call('synthesis-1', 'lead')],
});

test('whole-run usage includes lead, failed attempt, replacement and synthesis without double-counting subsets', () => {
  const result = summarizeUsage(ledger());
  assert.equal(result.agentStarts, 2);
  assert.equal(result.totals.totalTokens.total, 560);
  assert.equal(result.totals.cachedInputTokens.total, 240);
  assert.equal(result.totals.reasoningTokens.total, 80);
  assert.equal(result.totals.costUsd.total, 0.4);
  assert.equal(result.byRole.find(row => row.role === 'extraction').totalTokens.total, 280);
});

test('unknown child usage preserves observed subtotal but never proves a spending cap satisfied', () => {
  const input = ledger();
  input.calls[1].costUsd = null;
  input.calls[1].inputTokens = null;
  input.limits = { costUsd: 1, totalTokens: 1000 };
  const result = summarizeUsage(input);
  assert.equal(result.totals.costUsd.total, null);
  assert.ok(result.totals.costUsd.observed > 0.29);
  assert.equal(result.totals.totalTokens.total, null);
  assert.equal(result.budgets.costUsd.status, 'unmeasured');
  assert.equal(result.action, 'resolve-budget-visibility');
});

test('incomplete log and missing agent records cannot yield complete totals', () => {
  const input = ledger();
  input.calls = input.calls.filter(row => row.agentId !== 'replacement');
  assert.deepEqual(summarizeUsage(input).totals.missingAgents, ['replacement']);
  assert.equal(summarizeUsage(input).totals.totalTokens.total, null);
  input.completeCallLog = false;
  input.limits = { agentStarts: 3 };
  assert.equal(summarizeUsage(input).budgets.agentStarts.status, 'unmeasured');
  input.calls = [];
  assert.equal(summarizeUsage(input).totals.costUsd.total, null);
});

test('known usage at or over a ceiling stops new work even with incomplete telemetry', () => {
  const input = ledger();
  input.completeCallLog = false;
  input.limits = { totalTokens: 560, agentStarts: 1, toolCalls: 9 };
  const result = summarizeUsage(input);
  assert.equal(result.budgets.totalTokens.status, 'reached');
  assert.equal(result.budgets.agentStarts.status, 'exceeded');
  assert.equal(result.budgets.toolCalls.status, 'unmeasured');
  assert.equal(result.action, 'stop-new-work');
});

test('valid measured budgets report within without promising future calls will fit', () => {
  const input = ledger();
  input.limits = { totalTokens: 600, costUsd: 1, agentStarts: 3, toolCalls: 9 };
  const result = summarizeUsage(input);
  assert.ok(Object.values(result.budgets).every(row => row.status === 'within'));
  assert.equal(result.action, 'review-before-next-work');
});

test('known output alone can exceed a token ceiling when input is unavailable', () => {
  const input = ledger();
  input.calls[0].inputTokens = null;
  input.calls[0].outputTokens = 1000;
  input.limits = { totalTokens: 900 };
  const result = summarizeUsage(input);
  assert.equal(result.totals.totalTokens.observed, 1420);
  assert.equal(result.totals.totalTokens.total, null);
  assert.equal(result.budgets.totalTokens.status, 'exceeded');
});

test('reject duplicate invocations, invalid accounting, orphan agents and cycles', () => {
  const mutations = [
    input => input.calls.push(input.calls[0]),
    input => input.calls[0].cachedInputTokens = 101,
    input => input.calls[0].reasoningTokens = 41,
    input => delete input.calls[0].costUsd,
    input => input.calls[0].outputTokens = -1,
    input => input.calls[0].inputTokens = 1.5,
    input => input.calls[0].agentId = 'missing',
    input => input.agents.push(input.agents[0]),
    input => input.agents[1].parentId = 'missing',
    input => { input.agents[1].parentId = 'replacement'; input.agents[2].parentId = 'collector'; },
    input => input.limits = { agentStarts: -1 },
    input => input.limits = { subscriptionTokens: 500 },
  ];
  for (const mutate of mutations) {
    const input = ledger(); mutate(input);
    assert.throws(() => summarizeUsage(input));
  }
});
