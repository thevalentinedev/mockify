-- Run once in Neon SQL editor (https://console.neon.tech)

CREATE TABLE IF NOT EXISTS question_banks (
  school_id   TEXT NOT NULL,
  subject_id  TEXT NOT NULL,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_question_banks_updated
  ON question_banks (updated_at DESC);
