# Railway Deployment Guide

## Prerequisites

1. GitHub repository connected to Railway
2. Railway project created
3. PostgreSQL database provisioned on Railway

## Environment Variables (Set in Railway Dashboard)

```env
# Database (Railway auto-injects)
DATABASE_URL=<Railway provides this automatically>

# NextAuth
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Node Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Initial Setup

1. Connect your GitHub repository to Railway
2. Railway will automatically detect Next.js and configure build settings
3. Add PostgreSQL database from Railway dashboard
4. Set environment variables in Railway dashboard

### 2. Database Migration

After first deployment, run in Railway shell:

```bash
npx prisma migrate deploy
npm run seed  # If you want to seed initial admin
```

### 3. Automatic Deployments

- Push to `main` branch triggers automatic deployment
- Railway runs: `npm ci && npm run build && npm run start`
- Database migrations run automatically via `postinstall` script

## Local Development with PostgreSQL

To test PostgreSQL locally:

1. Install PostgreSQL locally or use Docker
2. Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```
3. Run migrations:
```bash
npx prisma migrate dev
```

## Switching Between SQLite (dev) and PostgreSQL (prod)

For local SQLite development:
```bash
cp prisma/schema.sqlite.prisma prisma/schema.prisma
```

For PostgreSQL production:
```bash
# Already configured in main schema.prisma
```

## Health Check

Railway monitors `/api/health` endpoint for application health.

## Troubleshooting

1. **Database connection issues**: Check DATABASE_URL in Railway dashboard
2. **Build failures**: Check build logs in Railway dashboard
3. **Migration issues**: Run `npx prisma migrate deploy` manually in Railway shell

## Support

- Railway Docs: https://docs.railway.app
- Prisma + PostgreSQL: https://www.prisma.io/docs/concepts/database-connectors/postgresql