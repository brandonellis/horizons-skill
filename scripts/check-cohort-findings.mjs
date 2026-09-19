import assert from 'node:assert/strict';

export async function checkCohortFindings(page) {
  const passed = [];
  const ledger = await page.locator('#roadmap-history').textContent();
  await page.locator('#tab-overview').click();
  const register = page.locator('[data-finding-register]');
  const rows = register.locator('[data-finding-id]');
  const statuses = await rows.evaluateAll(elements => elements.map(element => element.dataset.findingStatus));
  assert(statuses.includes('partial') && statuses.includes('fixed'), 'Exercise partial and verified cases');
  for (const status of ['partial', 'open', 'fixed']) {
    await page.locator(`.rm-cohort-legend [data-finding-filter-target="${status}"]`).click();
    assert.equal(await register.getAttribute('open'), '');
    const expected = statuses.filter(value => value === status).length;
    assert.equal(await register.locator('[data-finding-id]:visible').count(), expected);
    assert.equal(await register.getAttribute('data-active-finding-filter'), status);
    assert.match(await register.locator('[data-finding-count]').textContent(), new RegExp(`Showing ${expected} of ${statuses.length} original findings`));
  }
  passed.push('Fixed, partial and open counts reveal exactly their original tickets');

  const partial = register.locator('[data-finding-status="partial"]').first();
  const partialId = await partial.getAttribute('id');
  await page.locator(`.rm-cohort-cells a[href="#${partialId}"]`).click();
  assert(await partial.isVisible());
  assert.equal(await partial.getAttribute('open'), '');
  assert(await partial.locator('.rm-finding-work').isVisible());
  assert(await partial.locator('.rm-step-state.is-verified').count() > 0);
  assert(await partial.locator('.rm-step-state.is-remaining,.rm-step-state.is-unknown').count() > 0);
  assert.match(await partial.locator('.rm-finding-meta a').getAttribute('href'), /^https:\/\//);
  assert(await partial.locator('.rm-source-links a').count() > 0);
  passed.push('A cohort cell opens its exact ticket, completed work, missing acceptance and evidence');

  await register.locator('[data-finding-filter="remaining"]').click();
  const visibleRemaining = await register.locator('[data-finding-id]:visible').count();
  // Remaining excludes fixed AND retracted: a retraction is not work still owed.
  assert.equal(visibleRemaining, statuses.filter(status => status !== 'fixed' && status !== 'retracted').length);
  if (statuses.includes('retracted')) {
    await register.locator('[data-finding-filter="retracted"]').click();
    assert.equal(await register.locator('[data-finding-id]:visible').count(), statuses.filter(status => status === 'retracted').length);
    for (const record of await register.locator('[data-finding-status="retracted"]').all()) {
      assert(await record.locator('.rm-finding-retraction .rm-source-links a').count() > 0, 'A retracted finding must show the evidence that contradicts it');
    }
    passed.push('Retracted findings stay listed with contradicting evidence and are counted as neither fixed nor remaining');
  }
  assert.equal(await page.locator('#roadmap-history').textContent(), ledger);
  passed.push('Finding filters preserve the full baseline denominator and all grades');

  await register.locator('[data-finding-filter="all"]').focus();
  await page.keyboard.press('Space');
  assert.equal(await register.locator('[data-finding-id]:visible').count(), statuses.length);
  for (const record of await register.locator('[data-finding-id][open]').all()) await record.locator('summary').click();
  await register.locator(':scope > summary').click();
  passed.push('Keyboard filtering works and the full register remains secondary by default');
  return passed;
}
