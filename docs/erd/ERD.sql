CREATE TYPE "user_role" AS ENUM (
  'admin',
  'user'
);

CREATE TYPE "report_status" AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'rejected'
);

CREATE TYPE "waste_category" AS ENUM (
  'glass',
  'metal',
  'organic',
  'paper',
  'plastic',
  'textile'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "name" varchar(100) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "role" user_role NOT NULL DEFAULT 'user',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "user_sessions" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "user_id" uuid NOT NULL,
  "token" text UNIQUE NOT NULL,
  "ip_address" text NOT NULL,
  "user_agent" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "reports" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "user_id" uuid NOT NULL,
  "description" text NOT NULL,
  "photo_key" varchar(255) NOT NULL,
  "latitude" numeric(9,6) NOT NULL,
  "longitude" numeric(9,6) NOT NULL,
  "address" text,
  "category" waste_category,
  "model_category" waste_category,
  "model_confidence" real,
  "status" report_status NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "report_status_logs" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "report_id" uuid NOT NULL,
  "changed_by" uuid NOT NULL,
  "from_status" report_status,
  "to_status" report_status NOT NULL,
  "note" text,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE INDEX ON "user_sessions" ("user_id");

CREATE INDEX ON "reports" ("user_id");

CREATE INDEX ON "reports" ("status");

CREATE INDEX ON "reports" ("created_at");

CREATE INDEX ON "reports" ("category");

CREATE INDEX ON "report_status_logs" ("report_id");

COMMENT ON COLUMN "users"."email" IS 'Selalu huruf kecil';

COMMENT ON COLUMN "users"."password" IS 'Hash argon2id';

COMMENT ON COLUMN "reports"."photo_key" IS 'Object key di storage (R2 / lokal)';

COMMENT ON COLUMN "reports"."category" IS 'Kategori final (Model atau pilihan manual)';

COMMENT ON COLUMN "reports"."model_category" IS 'Hasil model; null jika tidak dikenali';

COMMENT ON COLUMN "reports"."model_confidence" IS '0-1';

COMMENT ON COLUMN "report_status_logs"."from_status" IS 'null saat laporan dibuat';

COMMENT ON COLUMN "report_status_logs"."note" IS 'Mis. alasan laporan ditolak';

ALTER TABLE "reports" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "report_status_logs" ADD FOREIGN KEY ("changed_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "report_status_logs" ADD FOREIGN KEY ("report_id") REFERENCES "reports" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
