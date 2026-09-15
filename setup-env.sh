#!/bin/bash

# ThermoShelter Environment Setup Script
# This script helps configure environment variables for local development

set -e

echo "======================================"
echo "ThermoShelter Environment Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running in the correct directory
if [ ! -f ".env.example" ]; then
    print_error "Please run this script from the thermoshelter root directory"
    exit 1
fi

# Step 1: Create backend .env file
echo "Step 1: Creating backend .env file..."
if [ -f ".env" ]; then
    print_warning ".env file already exists. Skipping..."
else
    cp .env.example .env
    print_success "Created .env file from .env.example"
fi
echo ""

# Step 2: Create frontend .env.local file
echo "Step 2: Creating frontend .env.local file..."
if [ -f "frontend/.env.local" ]; then
    print_warning "frontend/.env.local already exists. Skipping..."
else
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Created frontend/.env.local from frontend/.env.example"
    else
        # Create .env.local manually if .env.example doesn't exist
        cat > frontend/.env.local << 'EOF'
# ThermoShelter Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=ThermoShelter
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_STRICT_MODE=true
EOF
        print_success "Created frontend/.env.local with default values"
    fi
fi
echo ""

# Step 3: Verify .gitignore includes .env files
echo "Step 3: Verifying .gitignore configuration..."
if grep -q "\.env$" .gitignore && grep -q "\.env\.local" .gitignore; then
    print_success ".gitignore properly configured to exclude .env files"
else
    print_warning ".gitignore may not exclude all .env files. Please verify manually."
fi
echo ""

# Step 4: Display current configuration
echo "Step 4: Current Environment Configuration"
echo "-------------------------------------------"
echo ""

echo "Backend (.env):"
if [ -f ".env" ]; then
    grep -v "^#" .env | grep -v "^$" | head -10
else
    print_error ".env file not found!"
fi
echo ""

echo "Frontend (frontend/.env.local):"
if [ -f "frontend/.env.local" ]; then
    grep -v "^#" frontend/.env.local | grep -v "^$"
else
    print_error "frontend/.env.local file not found!"
fi
echo ""

# Step 5: Provide next steps
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Review and customize your .env files if needed:"
echo "   - Backend: .env"
echo "   - Frontend: frontend/.env.local"
echo ""
echo "2. Start the backend server:"
echo "   cd backend"
echo "   python -m app.main"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "For more information, see docs/environment-setup.md"
echo ""
