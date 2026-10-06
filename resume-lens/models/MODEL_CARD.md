# ResumeLens model card

Frozen TF-IDF unigram/bigram vocabulary and IDF fitted on15,068 REAL legitimate historical EMSCAD job descriptions (2012–2014), normalized exact-text deduplicated. English stop words, sublinear TF, L2 normalization, max12,000 features/min_df3. It compares two real input texts by cosine similarity.40 explicit skill aliases form separate mention coverage. Training/raw-data provenance/hash in data/README.md.

No match labels, no learned supervised matching target, no ATS acceptance probability and no fabricated accuracy metric. Corpus labels only select legitimate ads for vocabulary. Identical documents give cosine1; Python/JavaScript cosine parity checked to1e-10.

Mention detection is not proof of skill; negated skills can still match. Required/preferred skills not separated. Keyword repetition can game score. Unfamiliar jargon/languages/current roles can be missed. No semantic embedding model or private resume dataset. Historical English job vocabulary does not make it a hiring decision system.

JSON weights used by Express backend for server inference and optional explicit browser fallback. Raw inputs processed transiently, not stored. Summary persistence is opt-in via PostgreSQL; includes terms/skills/scores, so still potentially sensitive. No account auth or cloud production deployment verified. See RENDER_SETUP.md.
