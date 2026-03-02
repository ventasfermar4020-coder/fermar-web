# Fixes

## 2026-03-01: Database Migration Failure (PostgreSQL error 28P01)

### Symptom

`npm run db:migrate` failed with PostgreSQL error `28P01` — password authentication failed for user `fermar`.

### Initial Diagnosis

The credentials in `.env` and `docker-compose.yml` matched (`fermar:fermar123`), so the initial theory was that the Docker named volume `postgres` had been initialized with a different password (PostgreSQL only reads `POSTGRES_PASSWORD` on first init).

### Root Cause

After resetting the Docker volume, the error persisted. Further investigation revealed **three local PostgreSQL Windows services** (`postgresql-x64-13`, `postgresql-x64-16`, `postgresql-x64-18`) running on the host machine. PostgreSQL 13 was listening on port 5433 — the same port the Docker container maps to (`5433:5432` in `docker-compose.yml`).

Because both the local PG13 and Docker were bound to `0.0.0.0:5433`, the app's connection to `localhost:5433` was routed to the local PG13 instance, which had different credentials. The Docker container was never actually receiving the connection.

### Secondary Issue

`drizzle/0003_add_product_images.sql` was a manually created migration file with no corresponding entry in the Drizzle journal (`drizzle/meta/_journal.json`) or snapshot (`drizzle/meta/0003_snapshot.json`). This orphaned file would cause migration conflicts.

### Fix Applied

1. **Stopped and disabled all local PostgreSQL services:**
   - `postgresql-x64-13` (port 5433 conflict)
   - `postgresql-x64-16`
   - `postgresql-x64-18`
   - Set startup type to `Disabled` to prevent them from reclaiming the port on reboot.

2. **Reset the Docker volume** to start with a clean database:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

3. **Deleted the orphaned migration** `drizzle/0003_add_product_images.sql`.

4. **Regenerated the migration properly** via `npm run db:generate`, which created `drizzle/0003_left_serpent_society.sql` with the correct journal entry and snapshot.

5. **Ran all migrations** via `npm run db:migrate` — all four tables created successfully (`ec_products`, `ec_orders`, `ec_order_items`, `ec_product_images`).

### Verification

- `npm run db:migrate` completes without errors.
- All expected tables confirmed present via `psql \dt`.

### Lesson Learned

When Docker port-forwards conflict with locally installed services, the connection may silently reach the wrong server. Always check for port conflicts (`netstat -ano | grep <port>`) before assuming credential issues are Docker-related.
