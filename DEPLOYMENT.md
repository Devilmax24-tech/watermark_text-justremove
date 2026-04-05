# Production Deployment Guide - JustRemove.tech on DigitalOcean

## Prerequisites

- DigitalOcean account
- `justremove.tech` domain (purchased and active)
- SSH access to your local machine
- GitHub repository with your code

## Step 1: Create DigitalOcean Droplet

### Create a New Droplet:
1. Go to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Select:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: $6/month (2GB RAM, 1 vCPU) - good for production
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended)
4. Click **Create Droplet**
5. Note your droplet IP address (e.g., `123.45.67.89`)

## Step 2: Configure Domain DNS

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Update DNS records to point to your DigitalOcean droplet:

```
Type    Name              Value
A       justremove.tech   123.45.67.89
A       www               123.45.67.89
```

3. DNS may take 24-48 hours to propagate (but usually faster)

## Step 3: SSH into Your Droplet

```bash
ssh root@123.45.67.89
```

## Step 4: Run the Deployment Script

```bash
# Download the deployment script
curl -O https://raw.githubusercontent.com/devilmax24-tech/watermark/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the deployment script
sudo ./deploy.sh
```

This script will:
- ✅ Install Docker and Docker Compose
- ✅ Clone your GitHub repository
- ✅ Obtain SSL certificate from Let's Encrypt
- ✅ Build and start Docker containers
- ✅ Configure auto-renewal for SSL certificates
- ✅ Set up firewall rules

## Step 5: Verify Deployment

```bash
# Check if containers are running
docker ps

# View application logs
docker-compose logs -f app

# Check health endpoint
curl https://justremove.tech/health
```

Expected response:
```json
{
  "status": "ok",
  "model": "lama",
  "message": "AI model is ready"
}
```

## Step 6: Access Your Application

Open your browser and go to:
```
https://justremove.tech
```

## Ongoing Maintenance

### Monitor Application Health

```bash
# SSH into your droplet
ssh root@123.45.67.89

# View real-time logs
docker-compose logs -f

# Check resource usage
docker stats
```

### Update Application

```bash
cd /home/justremove

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker build -t justremove-app:latest .
docker-compose up -d
```

### Update SSL Certificate (Automatic)

SSL certificates are automatically renewed by cron job. To manually renew:

```bash
certbot renew --dry-run  # Test
certbot renew            # Actually renew
```

### Backup Your Data

```bash
# Create deployment backup
tar -czf justremove-backup-$(date +%Y%m%d).tar.gz /home/justremove/

# Upload to cloud storage (optional)
```

## Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose down
docker build --no-cache -t justremove-app:latest .
docker-compose up -d
```

### SSL Certificate issues
```bash
# Check certificate status
certbot certificates

# Manually renew
certbot renew

# View renewal logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

### High memory usage
```bash
# Check which container uses memory
docker stats

# Increase droplet size in DigitalOcean console
# Then restart containers
docker-compose restart
```

### DNS not working
```bash
# Check DNS propagation
nslookup justremove.tech
dig justremove.tech

# Wait for DNS to propagate (up to 48 hours)
```

## Performance Optimization

### Enable Caching
Already configured in nginx.conf:
- Static files cached for 30 days
- API responses cached appropriately

### Monitor Usage
```bash
# View bandwidth and request stats
docker-compose logs nginx | grep "GET\|POST"

# Monitor error rates
docker-compose logs | grep "error\|ERROR"
```

### Scale if Needed
Upgrade droplet size in DigitalOcean console:
- $6/month → $12/month (4GB RAM, 2 vCPU)
- $12/month → $18/month (8GB RAM, 4 vCPU)

## Security Best Practices

✅ **What's already configured:**
- SSL/TLS with Let's Encrypt (automatic renewal)
- Firewall (only ports 22, 80, 443 open)
- Rate limiting on API endpoints
- Security headers in nginx
- Docker container isolation

✅ **Additional recommendations:**
```bash
# Enable automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Set up log rotation
logrotate -f /etc/logrotate.d/docker
```

## Cost Breakdown

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| DigitalOcean Droplet (2GB) | $6 | Includes 2TB transfer |
| Domain (.tech) | ~$10-15 | Varies by registrar |
| SSL Certificate | FREE | Let's Encrypt |
| Bandwidth | Included | 2TB/month included |
| **Total** | **~$16-21** | Very affordable! |

## Support & Monitoring

### Set up Uptime Monitoring (Optional)
Use free services like:
- [UptimeRobot](https://uptimerobot.com) - Free
- [Pingdom](https://www.pingdom.com) - Paid
- [StatusCake](https://www.statuscake.com) - Free tier

### Get Notified on Issues
```bash
# Set up simple monitoring with cron
# Create cron job that checks health endpoint and sends email if down
```

## Questions?

Refer to this guide or check:
- [DigitalOcean Documentation](https://docs.digitalocean.com)
- [Docker Documentation](https://docs.docker.com)
- [Let's Encrypt Guide](https://letsencrypt.org/getting-started)

Good luck! 🚀
