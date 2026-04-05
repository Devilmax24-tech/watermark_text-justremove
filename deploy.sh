#!/bin/bash

# JustRemove Deployment Script for DigitalOcean
# Usage: ./deploy.sh

set -e

echo "🚀 Starting JustRemove Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="justremove.tech"
APP_DIR="/home/justremove"
DOCKER_IMAGE="justremove-app"

echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
apt-get update
apt-get install -y \
    curl \
    docker.io \
    docker-compose \
    certbot \
    python3-certbot-nginx \
    git \
    ufw

echo -e "${BLUE}Step 2: Setting up firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

echo -e "${BLUE}Step 3: Cloning/Updating repository...${NC}"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin main
else
    git clone https://github.com/devilmax24-tech/watermark "$APP_DIR"
    cd "$APP_DIR"
fi

echo -e "${BLUE}Step 4: Setting permissions...${NC}"
mkdir -p /home/justremove/ssl
chmod 755 /home/justremove/deploy.sh

echo -e "${BLUE}Step 5: Building Docker image...${NC}"
docker build -t $DOCKER_IMAGE:latest .

echo -e "${BLUE}Step 6: Obtaining SSL certificate with Certbot...${NC}"
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot certonly \
        --standalone \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Copy certificates to ssl directory
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /home/justremove/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /home/justremove/ssl/key.pem
    sudo chown -R 1000:1000 /home/justremove/ssl
fi

echo -e "${BLUE}Step 7: Starting Docker containers...${NC}"
docker-compose down || true
docker-compose up -d

echo -e "${BLUE}Step 8: Setting up auto-renewal for SSL certificates...${NC}"
# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/post/justremove.sh << 'EOF'
#!/bin/bash
cp /etc/letsencrypt/live/justremove.tech/fullchain.pem /home/justremove/ssl/cert.pem
cp /etc/letsencrypt/live/justremove.tech/privkey.pem /home/justremove/ssl/key.pem
chown 1000:1000 /home/justremove/ssl/*
docker-compose -f /home/justremove/docker-compose.yml restart nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/post/justremove.sh

# Setup cron for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Point your DNS records to this server:"
echo "   - justremove.tech A record → $(curl -s https://api.ipify.org)"
echo "   - www.justremove.tech A record → $(curl -s https://api.ipify.org)"
echo ""
echo "2. Monitor the application:"
echo "   docker-compose logs -f app"
echo ""
echo "3. Application will be available at:"
echo "   https://justremove.tech"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "   docker ps                                  # View running containers"
echo "   docker-compose logs -f                     # View logs"
echo "   docker-compose restart app                 # Restart app"
echo "   certbot renew --dry-run                    # Test cert renewal"
