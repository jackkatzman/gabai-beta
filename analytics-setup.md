# GabAi Analytics Dashboard Setup

## Quick Start with Metabase (Recommended)

Metabase is a plug-and-play business intelligence tool that connects directly to your PostgreSQL database and provides beautiful dashboards with zero coding required.

### 1. Docker Setup (Fastest - 30 seconds)

```bash
# Quick start with H2 database (for testing)
docker run -d -p 3000:3000 --name gabai-analytics metabase/metabase

# Or with PostgreSQL backend (production)
docker-compose -f docker-compose.analytics.yml up -d
```

### 2. Access Dashboard
- Open: http://localhost:3000
- First-time setup: Create admin account
- Connect to your main GabAi PostgreSQL database

### 3. Database Connection Settings
```
Database Type: PostgreSQL
Host: your-database-host
Port: 5432
Database name: your-gabai-database
Username: your-db-username  
Password: your-db-password
```

### 4. Pre-built Dashboards Available
Once connected, Metabase will automatically:
- Discover your database schema
- Suggest charts and dashboards
- Create automated insights
- Set up real-time data refresh

### 5. Key Metrics to Track
- **User Growth**: Daily/monthly active users
- **Revenue Analytics**: Affiliate click-through rates
- **Engagement**: Messages per user, feature usage
- **Performance**: Response times, error rates
- **Conversion**: Link clicks to revenue

## Alternative Options

### Chart.js Dashboard (Custom)
For a lightweight custom solution:
```bash
npm install chart.js socket.io express
```

### Apache Superset (Enterprise)
More powerful but complex setup:
```bash
git clone https://github.com/apache/superset.git
cd superset
docker compose up
```

### PostHog (Product Analytics)
All-in-one product analytics:
```bash
# Self-hosted version available
# Includes session replay, A/B testing
```

## Production Deployment

### Environment Variables
```env
MB_DB_HOST=your-production-db-host
MB_DB_USER=metabase_user
MB_DB_PASS=secure_password
MB_SITE_URL=https://analytics.yourdomain.com
```

### Security Setup
- Enable HTTPS
- Set up proper database user with read-only access
- Configure backup strategy
- Set up monitoring alerts

## Replit Integration

Since you're on Replit, you can:
1. Run Metabase locally during development
2. Deploy to Replit Deployments for production
3. Connect to your Neon PostgreSQL database
4. Access via custom subdomain: analytics.yourdomain.com

## Benefits
- **Zero Code**: Drag-and-drop dashboard creation
- **Auto-Discovery**: Automatically detects your database schema
- **Real-time**: Live data updates and refresh
- **Mobile Ready**: Responsive dashboards
- **Export Options**: PDF, CSV, embedded dashboards
- **Alerts**: Email notifications for threshold breaches