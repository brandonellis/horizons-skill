# Synthetic budget checkpoint

This invented project is preparing a full assessment with three required
independent auditors: invitations, testing/CI, and scalability. None has run yet.
The canonical artifact and assessment history must remain untouched at this
checkpoint. Raw code and tracker snapshots have already been fetched once into
the shared source index; no new network collection is needed.

The host exposes per-child model selection for gpt-6-astra, gpt-5.6-sol and
gpt-5.6-luna. The selected lead is gpt-6-astra at high effort. Child assignments
are unpinned. The ledger covers all model invocations so far, but one invocation's
input and cost measurements are unavailable. A child was replaced after failure;
the replacement is the one retry already used for that task.

The token ceiling and child-start ceiling in usage.json cover the entire run,
including lead work and replacements. They are not concurrency limits. No
additional budget has been authorized. No real customer or production data is
included here.
