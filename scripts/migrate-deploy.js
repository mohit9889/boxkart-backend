#!/usr/bin/env node
/**
 * Smart migration deploy script for Render/production.
 *
 * Problem: The DB was initially set up via `prisma db push` (no migration history).
 * When `prisma migrate deploy` runs on a non-empty DB with no _prisma_migrations table,
 * it throws P3005.
 *
 * Fix: If the DB has no migration history but already has schema, we resolve the drift by
 * marking all existing migrations as already applied (baseline), then deploying normally.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function hasMigrationHistory() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}

async function hasSchema() {
  try {
    // Check if at least one of our known tables exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) AS exists
    `;
    return result[0]?.exists === true;
  } catch {
    return false;
  }
}

async function run() {
  const hasHistory = await hasMigrationHistory();
  const hasExistingSchema = await hasSchema();

  if (!hasHistory && hasExistingSchema) {
    console.log('⚠️  DB has schema but no migration history. Baselining all migrations...');

    // Create the _prisma_migrations table and mark all existing migrations as applied
    // This tells Prisma "these migrations were already applied via db push"
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("id")
      )
    `;

    // Get all migration folders
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort();

    for (const migrationName of migrations) {
      const sqlPath = path.join(migrationsDir, migrationName, 'migration.sql');
      if (!fs.existsSync(sqlPath)) continue;

      const checksum = require('crypto')
        .createHash('sha256')
        .update(fs.readFileSync(sqlPath))
        .digest('hex');

      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
        VALUES (
          gen_random_uuid()::text,
          ${checksum},
          now(),
          ${migrationName},
          1
        )
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✅ Baselined: ${migrationName}`);
    }

    console.log('✅ Baseline complete.');
  }

  await prisma.$disconnect();

  console.log('🚀 Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations deployed successfully.');
}

run().catch((err) => {
  console.error('❌ Migration script failed:', err.message);
  process.exit(1);
});
