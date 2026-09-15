# Environment Configuration Guide

This document provides detailed instructions for configuring ThermoShelter's environment variables.

## Overview

ThermoShelter uses environment variables to configure:
- Database connections
- API endpoints
- Security settings
- Optional external services

The application is designed to work **out of the box** with sensible defaults, requiring minimal configuration for local development.

---

## Quick Setup

### For Local Development (Recommended for First-Time Setup)

1. **Create the backend `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Create the frontend `.env.local` file:**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

3. **That's it!** The default configuration uses SQLite and localhost, so you can start developing immediately.

### For Docker Deployment

1. **Copy and configure `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` to set:**
   - `DATABASE_URL` for PostgreSQL (used by docker-compose)
   - `SECRET_KEY` with a secure random value

3. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

---

## Backend Environment Variables (`/.env`)

### Database Configuration

#### `DATABASE_URL` (Optional)

**Purpose:** Specifies the database connection string.

**Default:** `sqlite:///./thermoshelter.db`

**Options:**

- **SQLite (Development/Demo):**
  ```env
  DATABASE_URL=sqlite:///./thermoshelter.db
  ```
  - No database server required
  - Perfect for development and testing
  - Data stored in a single file

- **PostgreSQL (Production):**
  ```env
  DATABASE_URL=postgresql://username:password@host:port/database
  ```
  
  Example with Docker:
  ```env
  DATABASE_URL=postgresql://thermoshelter:thermoshelter@localhost:5432/thermoshelter
  ```
  
  Example with credentials:
  ```env
  DATABASE_URL=postgresql://user:pass@db.example.com:5432/thermoshelter_prod
  ```

**Required:** No (defaults to SQLite)

---

### API Configuration

#### `BACKEND_PORT` (Optional)

**Purpose:** Port number for the FastAPI backend server.

**Default:** `8000`

**Example:**
```env
BACKEND_PORT=8000
```

**Required:** No

---

#### `NEXT_PUBLIC_API_URL` (Required for Frontend)

**Purpose:** URL that the frontend uses to connect to the backend API.

**Default:** `http://localhost:8000`

**Examples:**

- Local development:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- Docker setup:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- Production deployment:
  ```env
  NEXT_PUBLIC_API_URL=https://api.thermoshelter.example.com
  ```

**Required:** Yes (frontend needs this to function)

**Note:** This variable is prefixed with `NEXT_PUBLIC_` because it needs to be accessible from the browser.

---

### Weather API (Optional)

#### `WEATHER_API_KEY` (Optional)

**Purpose:** API key for external weather data services.

**Default:** (empty)

**Example:**
```env
WEATHER_API_KEY=your-api-key-here
```

**Required:** No

**Notes:**
- ThermoShelter includes built-in demo climate datasets
- The application works perfectly without an external weather API
- Use this only if you want to fetch real-time weather data
- Currently implemented as an optional enhancement

---

### Frontend Configuration

#### `FRONTEND_PORT` (Optional)

**Purpose:** Port number for the Next.js frontend server.

**Default:** `3000`

**Example:**
```env
FRONTEND_PORT=3000
```

**Required:** No

---

### Security Settings

#### `SECRET_KEY` (Required for Production)

**Purpose:** Cryptographic key for session management and security features.

**Default:** `dev-secret-key-change-in-production`

**Generate a secure key:**

Using OpenSSL:
```bash
openssl rand -hex 32
```

Using Python:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example:**
```env
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Required:** 
- No for local development (default works)
- **Yes for production** (generate a unique key)

**Security Warning:** Never commit your production secret key to version control!

---

### CORS Configuration

#### `CORS_ORIGINS` (Optional)

**Purpose:** Comma-separated list of allowed origins for Cross-Origin Resource Sharing.

**Default:** `http://localhost:3000,http://127.0.0.1:3000`

**Examples:**

- Local development:
  ```env
  CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
  ```

- Multiple environments:
  ```env
  CORS_ORIGINS=http://localhost:3000,https://thermoshelter.example.com
  ```

- Allow all origins (development only!):
  ```env
  CORS_ORIGINS=*
  ```

**Required:** No

**Security Warning:** In production, specify exact origins. Do not use `*` in production environments.

---

### Development Settings

#### `DEBUG` (Optional)

**Purpose:** Enable debug mode for detailed error messages and logging.

**Default:** `true`

**Values:** `true` or `false`

**Example:**
```env
DEBUG=true
```

**Required:** No

**Note:** Set to `false` in production to avoid exposing sensitive information.

---

#### `LOG_LEVEL` (Optional)

**Purpose:** Controls the verbosity of application logging.

**Default:** `INFO`

**Values:**
- `DEBUG` - Detailed diagnostic information
- `INFO` - General operational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages only
- `CRITICAL` - Critical errors only

**Example:**
```env
LOG_LEVEL=DEBUG
```

**Required:** No

---

## Frontend Environment Variables (`/frontend/.env.local`)

Next.js requires environment variables to be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### API Configuration

#### `NEXT_PUBLIC_API_URL` (Required)

**Purpose:** Backend API endpoint URL.

**Default:** `http://localhost:8000`

**Example:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Required:** Yes

**Note:** Must match the backend's actual address and port.

---

### Application Settings (Optional)

#### `NEXT_PUBLIC_APP_NAME` (Optional)

**Purpose:** Display name of the application.

**Default:** `ThermoShelter`

**Example:**
```env
NEXT_PUBLIC_APP_NAME=ThermoShelter
```

**Required:** No

---

#### `NEXT_PUBLIC_APP_VERSION` (Optional)

**Purpose:** Application version string.

**Default:** `1.0.0`

**Example:**
```env
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Required:** No

---

#### `NEXT_PUBLIC_STRICT_MODE` (Optional)

**Purpose:** Enable React Strict Mode for development.

**Default:** `true`

**Values:** `true` or `false`

**Example:**
```env
NEXT_PUBLIC_STRICT_MODE=true
```

**Required:** No

---

## Environment-Specific Configurations

### Development Environment

```env
# .env
DATABASE_URL=sqlite:///./thermoshelter.db
BACKEND_PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000
WEATHER_API_KEY=
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DEBUG=true
LOG_LEVEL=DEBUG

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=ThermoShelter
NEXT_PUBLIC_APP_VERSION=1.0.0-dev
NEXT_PUBLIC_STRICT_MODE=true
```

### Production Environment

```env
# .env
DATABASE_URL=postgresql://user:pass@db.example.com:5432/thermoshelter_prod
BACKEND_PORT=8000
NEXT_PUBLIC_API_URL=https://api.thermoshelter.example.com
WEATHER_API_KEY=your-production-api-key
SECRET_KEY=<generated-secure-random-key>
CORS_ORIGINS=https://thermoshelter.example.com
DEBUG=false
LOG_LEVEL=WARNING

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api.thermoshelter.example.com
NEXT_PUBLIC_APP_NAME=ThermoShelter
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_STRICT_MODE=false
```

### Docker Environment

When using Docker Compose, the backend connects to PostgreSQL via the internal Docker network:

```env
# .env
DATABASE_URL=postgresql://thermoshelter:thermoshelter@postgres:5432/thermoshelter
BACKEND_PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000
SECRET_KEY=<generated-secure-random-key>
CORS_ORIGINS=http://localhost:3000
DEBUG=false
LOG_LEVEL=INFO

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Note: The `DATABASE_URL` uses `postgres` as the hostname because that's the service name in `docker-compose.yml`.

---

## Security Best Practices

### 1. Never Commit Secrets

Ensure `.env` files are in `.gitignore`:

```bash
# .gitignore already includes:
.env
.env.local
.env.dev
.env.test
.env.production
*.env
```

### 2. Generate Strong Secret Keys

For production, always generate a cryptographically secure secret key:

```bash
# Method 1: OpenSSL
openssl rand -hex 32

# Method 2: Python
python -c "import secrets; print(secrets.token_hex(32))"

# Method 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Use Separate Keys per Environment

Never reuse the same secret key across development, staging, and production.

### 4. Restrict CORS Origins

In production, specify exact origins:

```env
# Good
CORS_ORIGINS=https://thermoshelter.example.com

# Bad (in production)
CORS_ORIGINS=*
```

### 5. Disable Debug Mode in Production

```env
# Production
DEBUG=false
LOG_LEVEL=WARNING
```

---

## Troubleshooting

### Frontend Cannot Connect to Backend

**Symptoms:** Frontend shows network errors or fails to load data.

**Check:**
1. Verify `NEXT_PUBLIC_API_URL` matches the backend's actual address
2. Ensure the backend is running on the specified port
3. Check CORS settings in backend `.env`
4. Look for browser console errors

**Solution:**
```env
# Make sure these match
# Backend .env
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Database Connection Errors

**Symptoms:** Backend fails to start with database errors.

**Check:**
1. Verify `DATABASE_URL` format
2. For PostgreSQL, ensure the database exists
3. Check database credentials
4. Verify database server is running

**Solutions:**

For SQLite (simplest):
```env
DATABASE_URL=sqlite:///./thermoshelter.db
```

For PostgreSQL:
```env
# Create database first
createdb -U postgres thermoshelter

# Then set
DATABASE_URL=postgresql://thermoshelter:thermoshelter@localhost:5432/thermoshelter
```

---

### CORS Errors

**Symptoms:** Browser blocks API requests with CORS errors.

**Check:**
1. Verify `CORS_ORIGINS` includes the frontend URL
2. Ensure frontend is accessing the correct backend URL

**Solution:**
```env
# Add all development URLs
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000
```

---

### Module Not Found Errors (Python)

**Symptoms:** Backend fails with import errors.

**Check:**
1. Ensure virtual environment is activated
2. Install dependencies

**Solution:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

### Module Not Found Errors (Node.js)

**Symptoms:** Frontend fails with module errors.

**Check:**
1. Ensure node_modules exists
2. Verify `.env.local` is created

**Solution:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## Verification

### Test Backend Configuration

```bash
cd backend
python -c "from app.core.config import settings; print(settings.database_url)"
```

Expected output: Your configured DATABASE_URL

### Test Frontend Configuration

Start the frontend and check browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

Expected output: Your configured API URL

### Health Check

With backend running:
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{"status": "healthy", "service": "thermoshelter-backend"}
```

---

## Summary Table

| Variable | Location | Default | Required | Production |
|----------|----------|---------|----------|------------|
| `DATABASE_URL` | `.env` | `sqlite:///./thermoshelter.db` | No | PostgreSQL |
| `BACKEND_PORT` | `.env` | `8000` | No | As needed |
| `NEXT_PUBLIC_API_URL` | `.env` & `.env.local` | `http://localhost:8000` | **Yes** | Production URL |
| `WEATHER_API_KEY` | `.env` | (empty) | No | If using API |
| `FRONTEND_PORT` | `.env` | `3000` | No | As needed |
| `SECRET_KEY` | `.env` | (dev key) | **Yes** | Secure random |
| `CORS_ORIGINS` | `.env` | `http://localhost:3000` | No | Specific domains |
| `DEBUG` | `.env` | `true` | No | `false` |
| `LOG_LEVEL` | `.env` | `INFO` | No | `WARNING` |

---

## Next Steps

After configuring environment variables:

1. **Start the backend:**
   ```bash
   cd backend
   python -m app.main
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

4. **Run the demo simulation** to verify everything works!

For more information, see the main [README.md](../README.md) or the [documentation](../docs/).
