# Railway Deployment Guide

This guide will help you deploy the Real-Time Data Aggregation Service to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Redis Database**: You'll need a Redis instance (Railway provides this)

## Step 1: Prepare Your Repository

Make sure your repository contains these files:
- `Dockerfile` ✅
- `railway.json` ✅
- `package.json` ✅
- `tsconfig.json` ✅
- All source code in `src/` directory ✅

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Connect GitHub to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**:
   - In your Railway project dashboard, go to "Variables" tab
   - Add the following environment variables:

```env
# Redis Configuration
REDIS_URL=your_railway_redis_url

# Optional: Custom port (Railway sets this automatically)
PORT=5000

# Optional: Environment
NODE_ENV=production
```

3. **Add Redis Service**:
   - In Railway dashboard, click "New Service"
   - Select "Database" → "Redis"
   - Copy the Redis URL and add it to your environment variables

### Option B: Deploy with Railway CLI

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Initialize and Deploy**:
```bash
railway init
railway up
```

## Step 3: Configure Environment Variables

In your Railway project dashboard, set these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://username:password@host:port` |
| `PORT` | Application port (auto-set by Railway) | `5000` |
| `NODE_ENV` | Environment | `production` |

## Step 4: Verify Deployment

1. **Check Build Logs**: Monitor the build process in Railway dashboard
2. **Test Health Check**: Visit your app URL + `/` endpoint
3. **Test API Endpoints**:
   - `GET /api/tokens` - Token data
   - `GET /api/metrics` - System metrics
   - `GET /` - Health check

## Step 5: Configure Custom Domain (Optional)

1. In Railway dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed

## Step 6: Monitor Your Application

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Deployments**: Automatic deployments on git push
- **Health Checks**: Automatic health monitoring

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if all dependencies are in `package.json`
   - Verify TypeScript compilation
   - Check Dockerfile syntax

2. **Redis Connection Issues**:
   - Verify `REDIS_URL` environment variable
   - Check Redis service is running
   - Ensure proper Redis URL format

3. **Port Issues**:
   - Railway automatically sets `PORT` environment variable
   - Don't hardcode port numbers

4. **Memory Issues**:
   - Monitor memory usage in Railway dashboard
   - Consider upgrading plan if needed

### Debug Commands:

```bash
# View logs
railway logs

# Check status
railway status

# Redeploy
railway up

# Open shell
railway shell
```

## Environment-Specific Configurations

### Development vs Production:

- **Development**: Uses local Redis, detailed logging
- **Production**: Uses Railway Redis, optimized logging

### Scaling:

Railway automatically scales based on traffic. You can also:
- Set minimum/maximum instances
- Configure auto-scaling rules
- Monitor resource usage

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **Redis Security**: Use Railway's managed Redis service
3. **CORS**: Configure CORS for your frontend domains
4. **Rate Limiting**: Consider adding rate limiting for production

## Cost Optimization

- **Free Tier**: Limited resources, good for testing
- **Pro Plan**: More resources, custom domains
- **Team Plan**: Multiple team members, advanced features

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: For application-specific issues

## Next Steps

After deployment:
1. Set up monitoring and alerts
2. Configure CI/CD pipeline
3. Set up staging environment
4. Implement backup strategies
5. Add performance monitoring 