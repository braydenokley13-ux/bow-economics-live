# Lead filing error on two wave-2 claims (recorded, not worked around)

`w2-e2e-pass` and `w2-e2e-misclick-pass` reconcile as **contradicted**, with the
reconciler's reason "No e2e command evidence is linked."

What actually happened: both claims are about runs at head f65e865 that did pass
(`w2r-e2e-f65e865` exit 0, `w2r-e2e-misclick-f65e865` exit 0 — the command records
are in the ledger and their stdout shows the full arc). The error is mine as lead:
I recorded those two command records with `--kind test` instead of `--kind e2e`, so
the deterministic reconciler cannot accept them as proof of an `e2e-pass` claim. The
claims are not false; they are unprovable as filed.

I have not resolved this by re-labelling evidence, by hand-editing run state, or by
reconciling under another actor's name. The two claims stay contradicted in the
ledger and this note is the explanation.

They are superseded for every purpose by the final-head claims, which are filed
correctly and reconcile as confirmed:
- `w2-tests-pass-final` -> `w2-npm-test-afa018d` (477 pass, 0 fail)
- `w2-e2e-pass-final` -> `w2-e2e-afa018d` (kind e2e, exit 0)
- `w2-e2e-misclick-pass-final` -> `w2-e2e-misclick-afa018d` (kind e2e, exit 0)

Standing correction for future waves: an `e2e-pass` claim must cite evidence
recorded with `--kind e2e`; `--kind test` is for the unit suite only.
