---
description: Deploy EV Charger Finder to Railway Cloud
---

# Railway Cloud Deployment Guide

This guide walks you through deploying the EV Charger Finder application to Railway cloud platform.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Railway CLI** (Optional but recommended): `npm install -g @railway/cli`

---

## Option 1: Deploy via Railway Dashboard (Recommended for Beginners)

### Step 1: Create New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `ev-charger-finder` repository

### Step 2: Deploy MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision a MySQL database
4. Note down the connection details (available in the MySQL service variables tab)

### Step 3: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again (Railway allows multiple services from same repo)
3. Configure the backend service:
   - **Root Directory**: `/ev-charger-backend`
   - **Builder**: Railway will auto-detect Dockerfile

4. Add Environment Variables (Settings → Variables):
   ```
   DB_URL=jdbc:mysql://${{MySQL.MYSQL_URL}}/evdb?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
   DB_USERNAME=${{MySQL.MYSQL_USER}}
   DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
   API_NINJAS_KEY=<your-api-ninjas-key>
   JWT_SECRET=<your-jwt-secret>
   CORS_ORIGINS=${{RAILWAY_PUBLIC_DOMAIN}}
   SPRING_PROFILES_ACTIVE=prod
   PORT=8081
   ```

5. In **Settings**:
   - Enable **Public Networking**
   - Set **Port** to `8081`
   - Set **Health Check Path** to `/api/chargers/stats`

### Step 4: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Configure the frontend service:
   - **Root Directory**: `/ev-charger-frontend`
   - **Builder**: Railway will auto-detect Dockerfile

4. Add Environment Variables:
   ```
   VITE_API_URL=https://<backend-service-url>
   PORT=80
   ```
   *(Replace `<backend-service-url>` with your backend's Railway public domain)*

5. In **Settings**:
   - Enable **Public Networking**
   - Set **Port** to `80`

### Step 5: Configure Service Dependencies

1. In the backend service settings → **Dependencies**:
   - Add MySQL as a dependency
2. This ensures MySQL starts before the backend

### Step 6: Deploy

1. Railway automatically deploys on every git push
2. Monitor deployment logs in each service's **Deployments** tab
3. Once all services show **"Active"**, your app is live!

---

## Option 2: Deploy via Railway CLI

### Step 1: Install and Login

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Initialize Project

```bash
cd ev-charger-finder

# Initialize Railway project
railway init
```

### Step 3: Create Services

```bash
# Create MySQL database
railway add --database mysql

# This will create the database and set environment variables
```

### Step 4: Create Railway Configuration Files

Create `railway.toml` in project root:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./ev-charger-backend/Dockerfile"

[deploy]
startCommand = "java -jar app.jar"
healthcheckPath = "/api/chargers/stats"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Step 5: Set Environment Variables

```bash
# Set backend variables
railway variables set DB_URL="jdbc:mysql://mysql:3306/evdb?createDatabaseIfNotExist=true&useSSL=false"
railway variables set API_NINJAS_KEY="your-key-here"
railway variables set JWT_SECRET="your-secret-here"
railway variables set SPRING_PROFILES_ACTIVE="prod"

# Deploy
railway up
```

---

## Option 3: Deploy with Separate Services (Most Control)

For production deployments with better isolation and scaling:

### Architecture:
- **Service 1**: MySQL Database (Railway Database)
- **Service 2**: Backend API (Spring Boot)
- **Service 3**: Frontend (Nginx/React)

### Deployment Steps:

1. **Create 3 Separate Railway Services**:
   - Database: Railway MySQL
   - Backend: From GitHub (root: `ev-charger-backend`)
   - Frontend: From GitHub (root: `ev-charger-frontend`)

2. **Link Services**:
   - Backend references MySQL using Railway's auto-generated variables
   - Frontend references Backend using public URL

3. **Configure Each Service**:
   - Set appropriate environment variables
   - Configure health checks
   - Enable public domains where needed

---

## Important Configuration Notes

### Backend Dockerfile Adjustment

Your current Dockerfile exposes port 8080, but docker-compose uses 8081. For Railway, update the Dockerfile or ensure environment variable sets the correct port:

In `application.properties` or `application.yml`:
```properties
server.port=${PORT:8081}
```

### Frontend API URL

Update your frontend to use environment variable for API URL:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
```

### CORS Configuration

Ensure your backend allows Railway frontend domain:
```java
@CrossOrigin(origins = "${cors.origins}")
```

---

## Post-Deployment Checklist

- [ ] All services show "Active" status
- [ ] Database connection successful (check backend logs)
- [ ] Backend health check passing
- [ ] Frontend loads correctly
- [ ] API calls from frontend to backend work
- [ ] Authentication/Authorization working
- [ ] Map features loading properly
- [ ] Test user registration and login
- [ ] Verify charger search functionality

---

## Monitoring and Logs

1. **View Logs**: Click on each service → **Deployments** tab → **View Logs**
2. **Metrics**: Railway provides CPU, Memory, and Network metrics
3. **Alerts**: Set up notifications for deployment failures

---

## Cost Optimization Tips

1. **Use Railway's Free Tier**: $5 credit/month for starter projects
2. **Resource Limits**: Set appropriate memory limits
3. **Sleep Inactive Services**: Configure sleep policies for dev environments
4. **Database Backups**: Enable automated backups for production

---

## Troubleshooting Common Issues

### Issue 1: Backend Can't Connect to Database
**Solution**: Verify `DB_URL` uses Railway's internal DNS (use reference variables like `${{MySQL.MYSQL_URL}}`)

### Issue 2: Frontend Can't Reach Backend
**Solution**: 
- Ensure backend has public networking enabled
- Update `VITE_API_URL` in frontend with backend's public domain
- Check CORS settings

### Issue 3: Build Failures
**Solution**:
- Check Dockerfile paths are correct
- Verify all dependencies are in `pom.xml` / `package.json`
- Review build logs for specific errors

### Issue 4: Environment Variables Not Working
**Solution**:
- Redeploy after adding new variables
- Use `${{SERVICE.VARIABLE}}` syntax for cross-service references

---

## Production Best Practices

1. **Use Custom Domains**: Add your own domain in Railway settings
2. **Enable HTTPS**: Railway provides free SSL certificates
3. **Database Backups**: Schedule regular backups
4. **Monitoring**: Integrate with monitoring tools (Railway metrics + external)
5. **Secrets Management**: Never commit secrets to Git
6. **CI/CD**: Set up automated deployments on merge to main branch
7. **Staging Environment**: Create separate Railway project for staging

---

## Useful Railway Commands

```bash
# View service status
railway status

# View logs
railway logs

# Open service in browser
railway open

# Run commands in Railway environment
railway run <command>

# Link local directory to Railway project
railway link

# Unlink project
railway unlink
```

---

## Support and Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- Pricing: https://railway.app/pricing
