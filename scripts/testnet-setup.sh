#!/bin/bash

# AI Arbitrage Trader - Testnet Setup Script
# This script automates the testnet environment setup

set -e  # Exit on any error

echo "🚀 AI Arbitrage Trader - Testnet Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) is installed ✅"
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    print_status "npm $(npm --version) is installed ✅"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    npm install
    print_status "Dependencies installed ✅"
}

# Build the project
build_project() {
    print_step "Building project..."
    npm run build
    print_status "Project built successfully ✅"
}

# Setup environment file
setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f ".env.testnet" ]; then
        print_error ".env.testnet file not found!"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        cp .env.testnet .env
        print_status "Created .env file from .env.testnet template"
    else
        print_warning ".env file already exists. Backup created as .env.backup"
        cp .env .env.backup
        cp .env.testnet .env
    fi
    
    print_warning "⚠️  IMPORTANT: Edit .env file with your testnet configuration!"
    print_status "Environment configuration ready ✅"
}

# Create directories
create_directories() {
    print_step "Creating required directories..."
    
    mkdir -p logs
    mkdir -p reports
    mkdir -p models
    
    print_status "Directories created ✅"
}

# Generate test wallet if needed
generate_wallet() {
    print_step "Wallet setup..."
    
    # Check if private key is set
    if grep -q "your_testnet_private_key_here" .env 2>/dev/null; then
        print_warning "No private key configured. Generating test wallet..."
        
        # Generate a test wallet using Node.js
        WALLET_INFO=$(node -e "
            const { ethers } = require('ethers');
            const wallet = ethers.Wallet.createRandom();
            console.log('PRIVATE_KEY=' + wallet.privateKey);
            console.log('WALLET_ADDRESS=' + wallet.address);
        " 2>/dev/null || echo "ERROR")
        
        if [ "$WALLET_INFO" = "ERROR" ]; then
            print_error "Failed to generate wallet. Please install dependencies first."
            exit 1
        fi
        
        # Update .env file
        PRIVATE_KEY=$(echo "$WALLET_INFO" | grep PRIVATE_KEY | cut -d'=' -f2)
        WALLET_ADDRESS=$(echo "$WALLET_INFO" | grep WALLET_ADDRESS | cut -d'=' -f2)
        
        sed -i "s/your_testnet_private_key_here/${PRIVATE_KEY}/" .env
        sed -i "s/your_testnet_wallet_address_here/${WALLET_ADDRESS}/" .env
        
        print_status "Test wallet generated:"
        print_status "Address: $WALLET_ADDRESS"
        print_warning "⚠️  Private Key: $PRIVATE_KEY"
        print_warning "⚠️  SAVE THESE CREDENTIALS SECURELY!"
        print_warning "⚠️  This is for testnet only - never use on mainnet!"
    else
        print_status "Private key already configured ✅"
    fi
}

# Validate installation
validate_installation() {
    print_step "Validating installation..."
    
    # Check if testnet-runner is available
    if [ -f "dist/testnet/test-runner.js" ]; then
        print_status "Testnet runner available ✅"
    else
        print_error "Testnet runner not found. Build may have failed."
        exit 1
    fi
    
    # Try to run basic validation
    print_status "Running basic system validation..."
    if timeout 30 npx testnet-runner validate 2>/dev/null; then
        print_status "System validation passed ✅"
    else
        print_warning "System validation had issues. Check configuration and network connectivity."
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Testnet Setup Complete!"
    echo "========================="
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your RPC URLs and API keys (optional but recommended)"
    echo "2. Fund your test wallet with testnet tokens:"
    echo "   ${BLUE}npx testnet-runner fund${NC}"
    echo ""
    echo "3. Run basic tests:"
    echo "   ${BLUE}npx testnet-runner test${NC}"
    echo ""
    echo "4. Run comprehensive testing:"
    echo "   ${BLUE}npx testnet-runner full${NC}"
    echo ""
    echo "5. Monitor via dashboard:"
    echo "   ${BLUE}npm run dev${NC}"
    echo "   Then open: http://localhost:3002"
    echo ""
    echo "📚 For detailed instructions, see: TESTNET-GUIDE.md"
    echo ""
    print_warning "⚠️  Remember: This is for testnet only!"
    print_warning "⚠️  Never use mainnet funds or keys!"
}

# Main execution
main() {
    echo "Starting testnet environment setup..."
    echo ""
    
    check_nodejs
    check_npm
    install_dependencies
    build_project
    setup_environment
    create_directories
    generate_wallet
    validate_installation
    show_next_steps
    
    echo ""
    print_status "Setup completed successfully! 🚀"
}

# Handle script interruption
trap 'print_error "Setup interrupted by user"; exit 1' INT

# Run main function
main "$@"