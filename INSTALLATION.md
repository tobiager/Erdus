# Installation Guide

This guide covers different methods to install and run Erdus, from using the web interface to setting up a local development environment.

## Table of Contents

- [Web Interface (Recommended)](#web-interface-recommended)
- [Local Installation](#local-installation)
- [Development Setup](#development-setup)
- [Docker Installation](#docker-installation)
- [CLI Installation](#cli-installation)
- [Troubleshooting](#troubleshooting)

## Web Interface (Recommended)

The easiest way to use Erdus is through the web interface:

### Production
Visit **https://erdus-inky.vercel.app** - No installation required!

### Features
- 100% client-side processing (your files never leave your browser)
- Drag & drop file upload
- Instant conversion and download
- Works offline after initial load
- No registration required

### Browser Requirements
- Modern browser with ES6+ support
- JavaScript enabled
- Recommended: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Local Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/tobiager/Erdus.git
cd Erdus

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Prerequisites

#### Node.js
- **Required**: Node.js 18 or higher
- **Recommended**: Node.js 20+ (LTS)
- Check version: `node --version`

#### Package Manager
Choose one:
- **npm** (included with Node.js)
- **pnpm** (recommended for performance)
- **yarn**

### Step-by-Step Installation

1. **Install Node.js**
   
   Download from [nodejs.org](https://nodejs.org/) or use a version manager:
   
   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20
   
   # Using fnm
   fnm install 20
   fnm use 20
   ```

2. **Clone the Repository**
   
   ```bash
   git clone https://github.com/tobiager/Erdus.git
   cd Erdus
   ```

3. **Install Dependencies**
   
   ```bash
   # Using npm
   npm install --legacy-peer-deps
   
   # Using pnpm (recommended)
   corepack enable
   corepack prepare pnpm@8 --activate
   pnpm install
   
   # Using yarn
   yarn install
   ```

4. **Start the Application**
   
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production build
   npm run build
   npm run preview
   ```

## Development Setup

### IDE Setup

#### VS Code (Recommended)
Install these extensions:
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

#### Recommended Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### Environment Setup

1. **Check Node Version**
   ```bash
   node --version  # Should be 18+ (20+ recommended)
   ```

2. **Configure Git Hooks** (Optional)
   ```bash
   npm run prepare  # Sets up pre-commit hooks
   ```

3. **Run Development Checks**
   ```bash
   # Type checking
   npm run typecheck
   
   # Linting
   npm run lint
   
   # Tests
   npm test
   
   # Format code
   npm run format
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all tests |
| `npm run lint` | Check code with ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run format` | Format code with Prettier |

## Docker Installation

### Using Docker Compose (Recommended)

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     erdus:
       build: .
       ports:
         - "3000:3000"
       volumes:
         - .:/app
         - /app/node_modules
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Docker Build

```bash
# Build the image
docker build -t erdus .

# Run the container
docker run -p 3000:3000 erdus
```

### Dockerfile Example

```dockerfile
FROM node:20-alpine

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

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "preview", "--host"]
```

## CLI Installation

### Global Installation

```bash
# Install globally
npm install -g erdus-converter

# Use from anywhere
erdus convert input.erdplus --to sql
```

### Local Usage

```bash
# Install locally
npm install erdus-converter

# Use with npx
npx erdus convert input.erdplus --to sql

# Use with npm scripts
npm run cli convert input.erdplus --to sql
```

### CLI Examples

```bash
# Convert ERDPlus to SQL
erdus convert schema.erdplus --to sql --output schema.sql

# Convert SQL to Prisma
erdus convert schema.sql --to prisma --output schema.prisma

# Batch convert files
erdus batch ./input-dir --to typeorm --output ./output-dir

# Validate file format
erdus validate schema.erdplus
```

## Troubleshooting

### Common Issues

#### Dependency Conflicts

**Problem**: npm install fails with peer dependency errors

**Solution**:
```bash
npm install --legacy-peer-deps
# or
npm install --force
```

#### Build Errors

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Check TypeScript
npm run typecheck
```

#### Port Already in Use

**Problem**: Development server fails to start

**Solution**:
```bash
# Use different port
npm run dev -- --port 3001

# Or kill process using port 5173
npx kill-port 5173
```

#### Memory Issues

**Problem**: Out of memory during build

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Platform-Specific Issues

#### Windows

- Use PowerShell or Command Prompt (not Git Bash for npm commands)
- If you encounter permission issues, run as Administrator
- Consider using WSL2 for better compatibility

#### macOS

- May need to install Xcode Command Line Tools: `xcode-select --install`
- If using M1/M2 Mac, ensure Node.js is ARM64 version

#### Linux

- May need to install build essentials: `sudo apt-get install build-essential`
- Ensure you have Python 3 for native module compilation

### Performance Tips

1. **Use pnpm for faster installs**
   ```bash
   corepack enable
   corepack prepare pnpm@8 --activate
   ```

2. **Enable caching**
   ```bash
   # npm
   npm config set cache /path/to/cache

   # pnpm
   pnpm config set store-dir /path/to/store
   ```

3. **Use Node.js 20+ for better performance**

## System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.15, Ubuntu 18.04
- **CPU**: 2 cores, 2 GHz
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Node.js**: 18.0.0 or higher

### Recommended Requirements
- **OS**: Latest version of Windows, macOS, or Linux
- **CPU**: 4+ cores, 3+ GHz
- **RAM**: 8 GB or more
- **Storage**: 2 GB free space
- **Node.js**: 20.0.0 or higher (LTS)

## Next Steps

After installation:

1. **Read the [README](README.md)** for an overview of features
2. **Check the [API Documentation](API.md)** for programmatic usage
3. **See [Development Guide](DEVELOPMENT.md)** for contribution setup
4. **Review [Examples](examples/)** for sample conversions
5. **Join the community** by starring the repository and opening issues

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Search [existing issues](https://github.com/tobiager/Erdus/issues)
3. Create a [new issue](https://github.com/tobiager/Erdus/issues/new) with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Full error message
   - Steps to reproduce