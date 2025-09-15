# Deployment Guide

This guide covers various deployment options for Erdus, from simple static hosting to production environments.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Netlify Deployment](#netlify-deployment)
- [Static Hosting](#static-hosting)
- [Docker Deployment](#docker-deployment)
- [Self-Hosted Solutions](#self-hosted-solutions)
- [CI/CD Pipelines](#cicd-pipelines)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Analytics](#monitoring--analytics)

## Deployment Overview

Erdus is a client-side application built with Vite, making it deployable as static files to any hosting provider. The application includes:

- Static HTML, CSS, and JavaScript files
- No backend requirements
- 100% client-side processing
- PWA capabilities (offline support)

### Build Requirements

- Node.js 18+ for building
- No runtime server requirements
- Approximately 2MB bundle size (gzipped)

## Vercel Deployment (Recommended)

Vercel provides the best experience for Erdus deployment with automatic builds and optimizations.

### Automatic Deployment

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build the project
npm run build

# Deploy
vercel --prod
```

### Vercel Configuration

The project includes `vercel.json` for optimal configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Environment Variables

Set in Vercel dashboard:
```
NODE_VERSION=20
ENABLE_EXPERIMENTAL_COREPACK=1
```

## Netlify Deployment

### Automatic Deployment

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 20
   ```

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Static Hosting

Erdus can be deployed to any static hosting provider.

### Build for Static Hosting

```bash
# Build the project
npm run build

# The dist/ directory contains all static files
ls dist/
# index.html  assets/  favicon.ico
```

### Popular Static Hosts

#### GitHub Pages

```bash
# Build and deploy to gh-pages branch
npm run build
npx gh-pages -d dist
```

#### AWS S3 + CloudFront

```bash
# Build the project
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

Create `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

## Docker Deployment

### Basic Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && \
    corepack prepare pnpm@8 --activate && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security
        location ~ /\. {
            deny all;
        }
    }
}
```

### Docker Compose

```yaml
version: '3.8'

services:
  erdus:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### Build and Run

```bash
# Build image
docker build -t erdus .

# Run container
docker run -p 80:80 erdus

# Using Docker Compose
docker-compose up -d
```

## Self-Hosted Solutions

### Apache Configuration

Create `.htaccess` in dist directory:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

### Express Server

For custom server needs:

```javascript
// server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## CI/CD Pipelines

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm install --legacy-peer-deps
      
    - name: Run tests
      run: npm test
      
    - name: Type check
      run: npm run typecheck
      
    - name: Lint
      run: npm run lint
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm install --legacy-peer-deps
    - npm run typecheck
    - npm run lint
    - npm test
  cache:
    paths:
      - node_modules/

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm install --legacy-peer-deps
    - npm run build
  artifacts:
    paths:
      - dist/
  cache:
    paths:
      - node_modules/

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST $DEPLOY_WEBHOOK
  only:
    - main
```

## Environment Configuration

### Build-time Configuration

Create `.env.production`:

```bash
# App configuration
VITE_APP_TITLE="Erdus - Universal ER Diagram Converter"
VITE_APP_DESCRIPTION="Convert ER diagrams between formats"
VITE_APP_VERSION=$npm_package_version

# Analytics (optional)
VITE_ANALYTICS_ID=""

# Feature flags
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_ANALYTICS=false
```

### Runtime Configuration

```typescript
// src/config/index.ts
export const config = {
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'Erdus',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || '',
  },
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
  },
  analytics: {
    id: import.meta.env.VITE_ANALYTICS_ID,
  },
};
```

## Performance Optimization

### Build Optimizations

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          converters: ['./src/converters/index.ts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // Enable compression
  plugins: [
    react(),
    // Add compression plugin for production
  ],
});
```

### CDN Configuration

```html
<!-- Preload critical resources -->
<link rel="preload" href="/assets/main.css" as="style">
<link rel="preload" href="/assets/main.js" as="script">

<!-- Add resource hints -->
<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="preconnect" href="//fonts.googleapis.com">
```

### Caching Strategy

```
Static Assets (JS/CSS): 1 year
Images: 1 year
HTML: No cache
Service Worker: 1 day
```

## Monitoring & Analytics

### Error Monitoring

```typescript
// src/utils/error-tracking.ts
export function initErrorTracking() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to monitoring service
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to monitoring service
  });
}
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
}
```

### Analytics Integration

```typescript
// src/utils/analytics.ts
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (config.features.analytics) {
    // Send to analytics service
    console.log('Analytics event:', name, properties);
  }
}
```

## Troubleshooting Deployment

### Common Issues

#### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Check Node.js version
node --version  # Should be 18+
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Routing Issues

Ensure your hosting provider supports client-side routing:
- Single Page Application (SPA) mode
- Fallback to index.html for 404s
- Proper URL rewriting rules

### Health Checks

Create `public/health.json`:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Deployment Verification

```bash
# Verify deployment
curl -f https://your-domain.com/health.json

# Check critical pages
curl -f https://your-domain.com/
curl -f https://your-domain.com/documentation
```

## Security Considerations

### Headers

Always include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS

- Always use HTTPS in production
- Configure HSTS headers
- Use secure cookies if adding authentication

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

This deployment guide covers the most common scenarios for hosting Erdus. Choose the option that best fits your infrastructure and requirements.