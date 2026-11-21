CREATE TABLE IF NOT EXISTS daily_plans (
    plan_date date PRIMARY KEY,
    document jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (jsonb_typeof(document) = 'object')
);
