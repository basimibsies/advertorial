# Deploying Advertorial to Fly.io

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and logged in (`fly auth login`)
- Shopify Partner app with Client ID and Client secret

## 1. Create the Fly app and Postgres

From the project root:

```bash
# Create app (use your preferred app name; default in fly.toml is "advertorial")
fly launch --no-deploy

# Create a Postgres cluster and attach it (sets DATABASE_URL automatically)
fly postgres create --name advertorial-db
# When prompted, choose to attach to your app (e.g. advertorial)
# Or attach later:
# fly postgres attach <postgres-app-name>
```

If you created Postgres separately, set the database URL manually:

```bash
fly secrets set DATABASE_URL="postgresql://user:pass@hostname:5432/dbname?sslmode=require"
```

## 2. Set Shopify secrets

Get your app credentials from [Shopify Partner Dashboard](https://partners.shopify.com) → Your app → Client credentials.

```bash
fly secrets set \
  SHOPIFY_API_KEY="your_client_id" \
  SHOPIFY_API_SECRET="your_client_secret" \
  SCOPES="read_products,write_products,read_content,write_content,read_themes,write_themes" \
  SHOPIFY_APP_URL="https://<your-fly-app-name>.fly.dev"
```

Use your actual Fly app name in `SHOPIFY_APP_URL` (e.g. `https://advertorial.fly.dev`).

## 3. Configure the Shopify Partner Dashboard

In your app’s **App setup**:

- **App URL:** `https://<your-fly-app-name>.fly.dev`
- **Allowed redirection URL(s):** add  
  `https://<your-fly-app-name>.fly.dev/api/auth/callback`  
  (and any other auth redirect URLs your app uses)

## 4. Deploy

```bash
fly deploy
```

After deploy, open the app:

```bash
fly open
```

## 5. Useful commands

- **Logs:** `fly logs`
- **SSH into VM:** `fly ssh console`
- **Secrets:** `fly secrets list` / `fly secrets set KEY=value`
- **Scale:** `fly scale count 1` (or leave as-is; min_machines_running = 0 allows scale-to-zero)

## Local development with Postgres

The app now uses PostgreSQL everywhere. For local dev you can:

1. **Use Docker:**

   ```bash
   docker run -d --name advertorial-postgres -p 5432:5432 \
     -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=advertorial \
     postgres:16-alpine
   ```

   Then in `.env`:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/advertorial"
   ```

2. **Use Fly Postgres from your machine:**  
   Run `fly postgres connect -a <postgres-app-name>` to get a connection string, or create a read-only user and set `DATABASE_URL` in `.env` for local runs.

Run migrations locally:

```bash
npx prisma migrate deploy
# or
npx prisma migrate dev
```

Then start the app with `shopify app dev` (tunnel will point to your machine; production uses the Fly URL above).
