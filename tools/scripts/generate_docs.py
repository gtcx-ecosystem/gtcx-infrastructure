#!/usr/bin/env python3
"""
GTCX Migration Stack - Documentation Generator
Quickly generates template documentation for all agile-pm folders.

Works for any component: MABA, KORA, AMANI, or custom.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Template definitions for each folder type
TEMPLATES = {
    "07-backend": """# {project} - Backend Services

**Version**: 1.0.0
**Last Updated**: {date}

## API Endpoints
{api_endpoints}

## Database Schema
{database_schema}

## Service Architecture
{service_architecture}
""",

    "08-frontend": """# {project} - Frontend Architecture

**Version**: 1.0.0
**Last Updated**: {date}

## UI Components
{ui_components}

## State Management
{state_management}

## Routing
{routing}
""",

    "09-security": """# {project} - Security Requirements

**Version**: 1.0.0
**Last Updated**: {date}
**Classification**: CONFIDENTIAL

## Security Controls
{security_controls}

## Authentication
{authentication}

## Encryption
{encryption}
""",

    "10-compliance": """# {project} - Compliance Requirements

**Version**: 1.0.0
**Last Updated**: {date}

## Regulations
- GDPR
- POPIA
- Country-specific requirements

## Audit Requirements
{audit_requirements}
""",

    "11-support": """# {project} - Support Documentation

**Version**: 1.0.0
**Last Updated**: {date}

## User Guides
{user_guides}

## Troubleshooting
{troubleshooting}

## FAQs
{faqs}
""",

    "12-gtm": """# {project} - Go-to-Market Strategy

**Version**: 1.0.0
**Last Updated**: {date}

## Market Analysis
{market_analysis}

## Launch Strategy
{launch_strategy}

## Partnerships
{partnerships}
""",

    "13-agent-resources": """# {project} - AI Agent Guidelines

**Version**: 1.0.0
**Last Updated**: {date}

## Agent Safety Rules
1. Never delete without confirmation
2. Always validate inputs
3. Maintain audit logs
4. Check dependencies before changes
5. Document all modifications

## Workflow Patterns
{workflow_patterns}

## Checklist
- [ ] Validated input data
- [ ] Checked existing state
- [ ] Confirmed changes needed
- [ ] Updated documentation
- [ ] Ran tests
""",

    "15-metrics-dashboards": """# {project} - Metrics & Dashboards

**Version**: 1.0.0
**Last Updated**: {date}

## Key Metrics
{key_metrics}

## Dashboard Configuration
{dashboard_config}

## Alerts
{alerts}

## Reports
- Daily status report
- Weekly performance summary
- Monthly executive dashboard
"""
}

# Project-specific data for documentation generation
PROJECT_DATA = {
    "MABA": {
        "project": "MABA - Universal Transformation Engine",
        "api_endpoints": "- POST /api/v1/transform\n- GET /api/v1/status\n- GET /api/v1/jobs/{id}",
        "database_schema": "- transformed_records table\n- ingestion_jobs table\n- schema_mappings table",
        "service_architecture": "Microservices with Ray distributed processing",
        "ui_components": "- Dashboard\n- Schema Mapper\n- Progress Monitor\n- Error Console",
        "state_management": "Redux for global state, Context API for local",
        "routing": "React Router v6 with lazy loading",
        "security_controls": "- Input validation\n- Rate limiting\n- SQL injection prevention",
        "authentication": "JWT tokens with refresh mechanism",
        "encryption": "AES-256 at rest, TLS 1.3 in transit",
        "audit_requirements": "All transformations logged with user, timestamp, changes",
        "user_guides": "- Getting Started Guide\n- Schema Mapping Tutorial\n- Troubleshooting Guide",
        "troubleshooting": "Common errors and solutions documented",
        "faqs": "Top 20 frequently asked questions",
        "market_analysis": "Target: Governments, enterprises with legacy data",
        "launch_strategy": "Pilot with strategic partners",
        "partnerships": "Government ministries, enterprise clients",
        "workflow_patterns": "ETL workflows, batch processing patterns",
        "key_metrics": "- Throughput (records/hour)\n- Accuracy (%)\n- Error rate (%)",
        "dashboard_config": "Grafana with Prometheus metrics",
        "alerts": "PagerDuty for P0/P1 issues"
    },
    "KORA": {
        "project": "KORA - Multi-Source Verification Oracle",
        "api_endpoints": "- POST /api/v1/verify\n- GET /api/v1/proof/{id}\n- POST /api/v1/dispute",
        "database_schema": "- verifications table\n- disputes table\n- fraud_patterns table",
        "service_architecture": "Event-sourced architecture with Rust core",
        "ui_components": "- Verification Dashboard\n- Dispute Portal\n- Proof Viewer",
        "state_management": "React Context API with hooks",
        "routing": "Next.js file-based routing",
        "security_controls": "- Cryptographic proofs\n- Multi-signature\n- Zero-knowledge proofs",
        "authentication": "Certificate-based mutual TLS",
        "encryption": "Ed25519 signatures, SHA3-256 hashing",
        "audit_requirements": "Immutable event log, cryptographic audit trail",
        "user_guides": "- Verification Process Guide\n- Dispute Resolution Guide",
        "troubleshooting": "Verification failures, proof validation issues",
        "faqs": "Trust, verification, and dispute FAQs",
        "market_analysis": "Banks, governments, insurance companies",
        "launch_strategy": "Build trust network incrementally",
        "partnerships": "Financial institutions, government registries",
        "workflow_patterns": "Verification flows, consensus patterns",
        "key_metrics": "- Verification accuracy (%)\n- Fraud detection rate (%)",
        "dashboard_config": "Real-time trust metrics dashboard",
        "alerts": "Fraud detection and dispute escalation alerts"
    },
    "AMANI": {
        "project": "AMANI - Multilingual Guidance Layer",
        "api_endpoints": "- POST /api/v1/chat\n- GET /api/v1/languages\n- POST /api/v1/translate",
        "database_schema": "- conversations table\n- messages table\n- user_profiles table",
        "service_architecture": "Conversational AI microservices with LLM",
        "ui_components": "- Chat Interface\n- Voice UI\n- USSD Menus",
        "state_management": "Zustand for lightweight state",
        "routing": "React Router with protected routes",
        "security_controls": "- PII protection\n- Content filtering\n- Rate limiting",
        "authentication": "Session-based with JWT fallback",
        "encryption": "End-to-end encryption for sensitive conversations",
        "audit_requirements": "Conversation logging with privacy compliance",
        "user_guides": "- Getting Started\n- Language Guide\n- Channel Guide",
        "troubleshooting": "Connection issues, language problems",
        "faqs": "Multi-language support, offline access FAQs",
        "market_analysis": "2 billion potential users in frontier markets",
        "launch_strategy": "Start with 5 major languages",
        "partnerships": "Telcos for USSD, WhatsApp Business",
        "workflow_patterns": "Conversation flows, escalation patterns",
        "key_metrics": "- CSAT score\n- Resolution time\n- Language coverage",
        "dashboard_config": "Conversation analytics and user journeys",
        "alerts": "High dropout rate, failed conversations"
    }
}


def generate_documentation(project_name: str, project_path: Path) -> dict:
    """Generate documentation for a project."""
    
    data = PROJECT_DATA.get(project_name.upper(), PROJECT_DATA["MABA"])
    data["date"] = datetime.now().strftime("%Y-%m-%d")
    
    created_count = 0
    skipped_count = 0
    
    # Create documents for each folder
    for folder, template in TEMPLATES.items():
        folder_num = folder.split("-")[0]
        folder_name = folder.replace(folder_num + "-", folder_num + " - ")
        
        # Create folder if it doesn't exist
        folder_path = project_path / "agile-pm" / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)
        
        # Determine file name
        file_name = f"{folder.split('-')[1]}-documentation.md"
        file_path = folder_path / file_name
        
        # Only create if file doesn't exist
        if not file_path.exists():
            content = template.format(**data)
            file_path.write_text(content)
            print(f"✅ Created: {file_path}")
            created_count += 1
        else:
            print(f"⏭️  Skipped (exists): {file_path}")
            skipped_count += 1
    
    print(f"\n📊 Summary: Created {created_count} files, Skipped {skipped_count} existing files")
    
    return {"created": created_count, "skipped": skipped_count}


def main():
    """Main entry point."""
    
    if len(sys.argv) < 2:
        print("\n📚 GTCX Migration Stack - Documentation Generator")
        print("=" * 55)
        print("\nUsage: python generate_docs.py <project_path>")
        print("\nExamples:")
        print("  python generate_docs.py ../maba")
        print("  python generate_docs.py ../kora")
        print("  python generate_docs.py ../amani")
        print("\nThis will generate documentation templates for all agile-pm folders.")
        print("\nSupported projects: MABA, KORA, AMANI (auto-detected from path)")
        sys.exit(1)
    
    project_path = Path(sys.argv[1]).resolve()
    project_name = project_path.name
    infra_root = Path(__file__).parent.parent.resolve()
    
    if not project_path.exists():
        print(f"❌ Error: Path {project_path} does not exist")
        sys.exit(1)

    if project_path == infra_root:
        print("\nℹ️  infra/migrations is deployment-only in this repo.")
        print("   No agile-pm scaffolding will be generated here.")
        print("   Use sensei-ai for component runtime docs, or pass a component/project path explicitly.")
        sys.exit(0)
    
    print(f"\n🚀 Generating DEPLOYMENT documentation for {project_name.upper()}...")
    print("   Note: Core logic documentation resides in the sensei-ai repository.")
    print("=" * 55)
    generate_documentation(project_name, project_path)
    print("=" * 55)
    print("✨ Documentation generation complete!")


if __name__ == "__main__":
    main()
