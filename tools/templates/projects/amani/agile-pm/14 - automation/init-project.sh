#!/bin/bash
# init-project.sh - Initialize new GTCX project with complete agile-pm structure
# Usage: ./init-project.sh <project-name> <project-type>
# Types: protocol | platform | service | mobile

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate arguments
if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Invalid number of arguments${NC}"
    echo "Usage: $0 <project-name> <project-type>"
    echo "Types: protocol | platform | service | mobile"
    exit 1
fi

PROJECT_NAME=$1
PROJECT_TYPE=$2

# Validate project type
if [[ ! "$PROJECT_TYPE" =~ ^(protocol|platform|service|mobile)$ ]]; then
    echo -e "${RED}Error: Invalid project type${NC}"
    echo "Valid types: protocol | platform | service | mobile"
    exit 1
fi

echo -e "${GREEN}🚀 Initializing GTCX Project: $PROJECT_NAME${NC}"
echo "Type: $PROJECT_TYPE"
echo "----------------------------------------"

# Create project directory
if [ -d "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}Warning: Directory $PROJECT_NAME already exists${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    mkdir -p "$PROJECT_NAME"
fi

cd "$PROJECT_NAME"

# Create base structure
echo "Creating project structure..."
mkdir -p src/{api,core,services,utils,types}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs/{api,guides,architecture}
mkdir -p scripts
mkdir -p config/{development,staging,production}
mkdir -p .github/workflows

# Copy agile-pm structure
echo "Setting up agile-pm framework..."
if [ -d "../gtcx-ecosystem-agile/agile-pm" ]; then
    cp -r ../gtcx-ecosystem-agile/agile-pm .
    echo -e "${GREEN}✓ Agile-pm structure copied${NC}"
else
    echo -e "${YELLOW}⚠ Agile-pm template not found, creating basic structure${NC}"
    mkdir -p agile-pm/{01-overview,02-vision,03-design,04-spec,05-roadmap,06-planning,07-backend,08-frontend,09-security,10-compliance,11-support,12-gtm,13-agent-resources,14-automation,15-metrics-dashboards}
fi

# Customize templates with project name
echo "Customizing templates..."
find agile-pm -type f -name "*.md" 2>/dev/null | while read file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file"
        sed -i '' "s/\[PROJECT_TYPE\]/$PROJECT_TYPE/g" "$file"
    else
        sed -i "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file"
        sed -i "s/\[PROJECT_TYPE\]/$PROJECT_TYPE/g" "$file"
    fi
done

# Create package.json
echo "Creating package.json..."
cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "0.1.0",
  "description": "GTCX $PROJECT_TYPE: $PROJECT_NAME",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "start": "node dist/index.js"
  },
  "keywords": ["gtcx", "$PROJECT_TYPE", "$PROJECT_NAME"],
  "author": "GTCX Protocol Team",
  "license": "MIT",
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "nodemon": "^3.0.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "winston": "^3.0.0"
  }
}
EOF

# Create tsconfig.json
echo "Creating TypeScript configuration..."
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Create .gitignore
echo "Creating .gitignore..."
cat > .gitignore << EOF
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
*.lcov
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary
tmp/
temp/
.tmp/
EOF

# Create README.md
echo "Creating README.md..."
cat > README.md << EOF
# $PROJECT_NAME

**Type**: GTCX $PROJECT_TYPE  
**Status**: Development  
**Version**: 0.1.0

## Overview

$PROJECT_NAME is a $PROJECT_TYPE component of the GTCX Protocol ecosystem.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Project Structure

\`\`\`
$PROJECT_NAME/
├── src/                 # Source code
│   ├── api/            # API endpoints
│   ├── core/           # Core business logic
│   ├── services/       # External services
│   ├── utils/          # Utilities
│   └── types/          # TypeScript types
├── tests/              # Test files
├── docs/               # Documentation
├── config/             # Configuration files
├── agile-pm/           # Agile project management
└── scripts/            # Utility scripts
\`\`\`

## Development

See [agile-pm/README.md](agile-pm/README.md) for project management and development guidelines.

## API Documentation

See [docs/api/README.md](docs/api/README.md) for API documentation.

## Contributing

Please follow the guidelines in [agile-pm/13-agent-resources/](agile-pm/13-agent-resources/) for AI agents.

## License

MIT - See LICENSE file for details
EOF

# Create sample source file
echo "Creating sample source files..."
cat > src/index.ts << EOF
/**
 * $PROJECT_NAME - Main Entry Point
 * GTCX $PROJECT_TYPE
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting $PROJECT_NAME...');
console.log('Type: $PROJECT_TYPE');
console.log('Environment:', process.env.NODE_ENV || 'development');

// TODO: Implement main application logic

export default {
  name: '$PROJECT_NAME',
  type: '$PROJECT_TYPE',
  version: '0.1.0'
};
EOF

# Create initial test
echo "Creating initial test..."
cat > tests/unit/index.test.ts << EOF
describe('$PROJECT_NAME', () => {
  it('should export correct metadata', () => {
    const app = require('../../src/index').default;
    expect(app.name).toBe('$PROJECT_NAME');
    expect(app.type).toBe('$PROJECT_TYPE');
    expect(app.version).toBeDefined();
  });
});
EOF

# Create GitHub workflow
echo "Creating GitHub Actions workflow..."
cat > .github/workflows/ci.yml << EOF
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm run test:coverage
      
    - name: Build
      run: npm run build
EOF

# Initialize git repository
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "feat: initialize $PROJECT_NAME $PROJECT_TYPE project with agile-pm structure"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Project initialization complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Project: $PROJECT_NAME"
echo "Type: $PROJECT_TYPE"
echo "Location: $(pwd)"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npm install"
echo "3. Review agile-pm/README.md"
echo "4. Start with agile-pm/04-spec/project-specification-template.md"
echo "5. npm run dev (to start development)"
echo ""
echo -e "${YELLOW}📚 Don't forget to:${NC}"
echo "- Update project specification in agile-pm/04-spec/"
echo "- Create user stories in agile-pm/06-planning/"
echo "- Review agent guidelines in agile-pm/13-agent-resources/"
echo "- Set up environment variables in .env"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"