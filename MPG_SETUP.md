# Fly Managed Postgres (MPG) Setup

Your app is now using **Fly Managed Postgres** instead of unmanaged Postgres. MPG is supported by Fly.io and includes a built-in proxy for easy local access.

## Viewing your database tables (like Supabase Studio)

### Option 1: Prisma Studio (recommended)

1. **Start the MPG proxy** (in a separate terminal, keep it running):
   ```bash
   fly mpg proxy q49ypo46n3z017ln
   ```
   It will show something like: `Proxying localhost:16380 to remote...`

2. **Update your `.env` temporarily** to point at the proxy:
   ```
   DATABASE_URL="postgresql://fly-user:lGsxc3fOY5Elvzwoa2ya9nYM@localhost:16380/fly-db"
   ```
   (Get the password from [Fly Dashboard](https://fly.io/dashboard) → Managed Postgres → advertorial-mpg → Connection tab)

3. **Run Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Opens at http://localhost:5555 — browse tables in your browser.

4. **Restore `.env`** when done:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/advertorial"
   ```

### Option 2: Direct psql connection

```bash
fly mpg connect q49ypo46n3z017ln
```

Then in the psql session:
```sql
\c fly-db
\dt
```

### Option 3: GUI (TablePlus, pgAdmin, etc.)

1. Run `fly mpg proxy q49ypo46n3z017ln`
2. Connect with host `localhost`, port `16380` (or whatever the proxy shows)
3. Database: `fly-db`, User: `fly-user`, Password: from Fly Dashboard

## Connection details

- **Cluster ID:** `q49ypo46n3z017ln`
- **Cluster name:** `advertorial-mpg`
- **Region:** sjc
- **Production URL:** `postgresql://fly-user:****@pgbouncer.q49ypo46n3z017ln.flympg.net/fly-db

The password is in the Fly Dashboard under Managed Postgres → advertorial-mpg → Connection.

## Data migration (optional)

If you had data in the old `advertorial-db` and need to restore it:

1. `db_data_only.sql` and `db_dump.sql` are in the project root (gitignored)
2. Start the proxy: `fly mpg proxy q49ypo46n3z017ln`
3. The app will create the schema on first request (prisma migrate deploy runs on startup)
4. Restore data: `psql "postgresql://fly-user:PASSWORD@localhost:16380/fly-db" -f db_data_only.sql`

(Replace PASSWORD with the actual value from the dashboard.)

## Old unmanaged database

The old `advertorial-db` cluster is still running. You can remove it after confirming everything works:

```bash
fly apps destroy advertorial-db
```
