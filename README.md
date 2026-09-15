# ThermoShelter

**Passive Shelter Thermal Design & Optimization Platform**

ThermoShelter is a web-based engineering tool for designing energy-efficient passive shelters for extreme climatic conditions. It uses physics-based thermal modeling and optimization algorithms to predict indoor temperatures, solar gains, heat losses, and thermal comfort.

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Configuration](#environment-configuration) below).

For the frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

### 2. Run with Docker Compose (Recommended)

```bash
docker-compose up -d
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Run Locally (Development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Configuration

### Root `.env` File (Backend)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./thermoshelter.db` | No (uses SQLite if not set) |
| `BACKEND_PORT` | Backend server port | `8000` | No |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:8000` | Yes |
| `WEATHER_API_KEY` | External weather API key | (empty) | No (demo data included) |
| `FRONTEND_PORT` | Frontend server port | `3000` | No |
| `SECRET_KEY` | Security key for sessions | (generate one) | Yes (for production) |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` | No |
| `DEBUG` | Enable debug mode | `true` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |

#### Example `.env`:

```env
# Database - Use SQLite for development, PostgreSQL for production
DATABASE_URL=sqlite:///./thermoshelter.db

# For PostgreSQL (uncomment and configure):
# DATABASE_URL=postgresql://thermoshelter:thermoshelter@localhost:5432/thermoshelter

# API Configuration
BACKEND_PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Weather API (optional - demo data works without it)
WEATHER_API_KEY=

# Security (change in production!)
SECRET_KEY=your-secret-key-change-in-production

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Development
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend `.env.local` File

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application title | `ThermoShelter` | No |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` | No |

#### Example `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=ThermoShelter
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Project Structure

```
thermoshelter/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/         # REST API endpoints
│   │   ├── core/        # Configuration, database
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── thermal/     # Thermal simulation engine
│   │   ├── optimization/# Optimization algorithms
│   │   └── weather/     # Weather data handling
│   └── requirements.txt
│
├── frontend/            # Next.js React frontend
│   ├── app/            # Pages
│   ├── components/     # Reusable UI components
│   ├── hooks/          # React hooks
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
│
├── data/               # Demo datasets
│   ├── climate/        # Weather data
│   ├── materials/      # Material properties
│   └── examples/       # Example designs
│
├── docs/               # Documentation
├── docker-compose.yml  # Docker orchestration
├── .env.example        # Environment template
└── README.md
```

## Features

- **Thermal Simulation**: Predicts indoor temperature over time using physics-based energy balance
- **Solar Modeling**: Calculates solar irradiance and absorbed energy based on orientation and location
- **Multi-layer Construction**: Define walls/roof/floor with multiple material layers
- **Material Database**: Built-in library of construction materials with thermal properties
- **Climate Data**: Demo datasets for Ladakh and other regions, plus CSV upload support
- **Design Comparison**: Compare multiple shelter configurations side-by-side
- **Optimization**: Automatically find optimal designs based on comfort, efficiency, and cost
- **Sensitivity Analysis**: Understand which parameters most affect performance
- **Export Results**: Download simulation data as CSV/JSON

## Technology Stack

### Backend
- Python 3.12+
- FastAPI
- SQLModel / SQLAlchemy
- NumPy, Pandas, SciPy
- pvlib (solar calculations)
- Pydantic

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Database
- PostgreSQL (production)
- SQLite (development/demo)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/materials` | GET, POST | Material database |
| `/api/designs` | GET, POST | Shelter designs |
| `/api/simulations` | GET, POST | Run simulations |
| `/api/optimization` | POST | Run optimization |
| `/api/weather/demo` | GET | Get demo weather data |
| `/api/weather/upload` | POST | Upload weather CSV |

Full API documentation available at `/docs` when running the backend.

## Development

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (optional, SQLite works for development)
- Docker (optional, for containerized development)

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Documentation

See the `docs/` directory for detailed documentation:
- [Thermal Model](docs/thermal-model.md)
- [Solar Model](docs/solar-model.md)
- [Optimization](docs/optimization.md)
- [Weather Data](docs/weather-data.md)
- [Architecture](docs/architecture.md)

## License

MIT License

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.