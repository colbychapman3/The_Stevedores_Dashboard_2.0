# Railway Deployment Guide for Stevedores Dashboard 2.0

## 🚀 Quick Deployment Steps

### 1. Prepare Repository for Railway

If you encounter issues with the current package.json, use the simplified Railway version:

```bash
# Backup current package.json
cp package.json package.json.backup

# Use Railway-optimized package.json
cp package.json.railway package.json

# Use Railway-optimized requirements.txt if needed
cp requirements.railway.txt requirements.txt
```

### 2. Deploy to Railway

#### Option A: Via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Option B: Via Railway Dashboard
1. Go to [Railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your repository: `The_Stevedores_Dashboard_2.0`
4. Railway will automatically detect the Python app

### 3. Configure Environment Variables

Set these variables in Railway Dashboard:

```
FLASK_ENV=production
FLASK_APP=main.py
PORT=5000
```

### 4. Configure Build Settings

Railway should automatically detect the build configuration from `nixpacks.toml`, but you can also set:

**Build Command:**
```bash
npm install && npm run build-all && pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn main:app --bind 0.0.0.0:$PORT
```

## 🔧 Troubleshooting Common Issues

### Issue 1: Node.js Build Failures

**Problem:** npm install fails or webpack build fails

**Solution:**
```bash
# Use the simplified package.json
cp package.json.railway package.json
git add package.json
git commit -m "Use Railway-optimized package.json"
git push origin main
```

### Issue 2: Python Import Errors

**Problem:** `ImportError: No module named 'src'`

**Solution:** The main.py file has been updated to handle Railway's deployment structure.

### Issue 3: Port Binding Issues

**Problem:** App fails to bind to Railway's port

**Solution:** The main.py file now uses `os.environ.get('PORT', 5000)` for Railway compatibility.

### Issue 4: Static Files Not Found

**Problem:** CSS/JS files return 404 errors

**Solution:** Ensure build process completes successfully:
```bash
# Check if dist folder is created
ls -la static/dist/

# Manually build if needed
npm run build-all
```

## 📁 Railway-Specific Files

- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Nixpacks build configuration
- `Procfile` - Process file for deployment
- `package.json.railway` - Simplified package.json for Railway
- `requirements.railway.txt` - Simplified requirements for Railway

## 🌐 Post-Deployment

After successful deployment:

1. **Test the application** at your Railway URL
2. **Configure custom domain** (optional)
3. **Set up monitoring** via Railway dashboard
4. **Configure environment variables** for production

## 🔍 Debugging Failed Deployments

### Check Railway Logs
```bash
railway logs
```

### Common Log Errors and Solutions

**Error:** `npm ERR! peer dep missing`
**Solution:** Use `package.json.railway` which has simplified dependencies

**Error:** `ModuleNotFoundError: No module named 'src'`
**Solution:** Ensure `main.py` is in the root directory (it is)

**Error:** `Error: Cannot find module 'webpack'`
**Solution:** Railway sometimes has issues with devDependencies. Use the simplified package.json.

## 🎯 Production Optimizations

After successful deployment, consider these optimizations:

1. **Add Redis** for caching (Railway Redis addon)
2. **Configure PostgreSQL** (Railway PostgreSQL addon)
3. **Set up monitoring** with Railway observability
4. **Configure custom domain** with SSL
5. **Set up backup strategy** for database

## 📞 Support

If you continue to experience issues:

1. Check Railway documentation
2. Review Railway logs for specific error messages
3. Try the simplified deployment files included in this guide
4. Consider using Railway's Discord community for support

## 🚀 Alternative Deployment

If Railway continues to have issues, consider these alternatives:

1. **Heroku** - Similar PaaS with Python support
2. **Vercel** - For frontend with serverless functions
3. **Digital Ocean App Platform** - Another PaaS option
4. **AWS Elastic Beanstalk** - AWS managed platform

The application is designed to be platform-agnostic and should work on any modern PaaS platform.