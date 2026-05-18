#!/usr/bin/env python3
"""
GTCX Migration Stack - Documentation Status Checker
Provides detailed analysis of documentation completeness across components.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

REQUIRED_DEPLOYMENT_FILES = [
    "README.md",
    "config/example.yaml",
    "config/gtcx.yaml",
    "scripts/check_docs.py",
    "scripts/generate_docs.py",
]


def check_documentation(project_name: str, project_path: Path) -> dict:
    """Check documentation status for a project."""
    
    print(f"\n{'='*60}")
    print(f"  {project_name} Documentation Status")
    print(f"{'='*60}")
    
    agile_pm_path = project_path / 'agile-pm'
    
    if not agile_pm_path.exists():
        print(f"❌ agile-pm folder not found at {agile_pm_path}")
        return {
            'project': project_name,
            'total_files': 0,
            'coverage': 0,
            'missing': ['agile-pm folder'],
            'complete': False
        }
    
    total_found = 0
    missing_docs = []
    
    for folder_num in range(1, 16):
        folder_prefix = f"{folder_num:02d} - "
        
        # Find matching folder
        matching_folders = [f for f in os.listdir(agile_pm_path) 
                          if f.startswith(folder_prefix)]
        
        if matching_folders:
            folder_name = matching_folders[0]
            folder_path = agile_pm_path / folder_name
            
            # Check for any .md or .sh files
            md_files = list(folder_path.glob('*.md'))
            sh_files = list(folder_path.glob('*.sh'))
            py_files = list(folder_path.glob('*.py'))
            all_files = md_files + sh_files + py_files
            
            if all_files:
                print(f"✅ {folder_name}: {len(all_files)} file(s)")
                for file in all_files[:3]:  # Show first 3 files
                    print(f"   - {file.name}")
                if len(all_files) > 3:
                    print(f"   ... and {len(all_files) - 3} more")
                total_found += len(all_files)
            else:
                print(f"❌ {folder_name}: No documentation")
                missing_docs.append(folder_name)
        else:
            print(f"❌ Folder {folder_prefix}* not found")
            missing_docs.append(f"{folder_prefix}*")
    
    # Calculate completion percentage
    coverage = ((15 - len(missing_docs)) / 15) * 100
    
    print(f"\n📊 Summary:")
    print(f"   Documentation files found: {total_found}")
    print(f"   Folders with documentation: {15 - len(missing_docs)}/15")
    print(f"   Coverage: {coverage:.1f}%")
    
    if missing_docs:
        print(f"\n⚠️  Missing documentation in:")
        for doc in missing_docs:
            print(f"   - {doc}")
    else:
        print(f"\n🎉 All folders have documentation!")
    
    return {
        'project': project_name,
        'total_files': total_found,
        'coverage': coverage,
        'missing': missing_docs,
        'complete': len(missing_docs) == 0
    }


def check_deployment_docs(base_path: Path) -> dict:
    """Check documentation status for the current deployment-only repo structure."""

    print(f"\n{'='*60}")
    print("  DEPLOYMENT DOCUMENTATION STATUS")
    print(f"{'='*60}")

    found = []
    missing = []

    for relative_path in REQUIRED_DEPLOYMENT_FILES:
        absolute_path = base_path / relative_path
        if absolute_path.exists():
            print(f"✅ {relative_path}")
            found.append(relative_path)
        else:
            print(f"❌ {relative_path}")
            missing.append(relative_path)

    coverage = (len(found) / len(REQUIRED_DEPLOYMENT_FILES)) * 100

    print(f"\n📊 Summary:")
    print(f"   Required deployment files found: {len(found)}/{len(REQUIRED_DEPLOYMENT_FILES)}")
    print(f"   Coverage: {coverage:.1f}%")
    print("   Runtime components: maintained in sensei-ai")

    if missing:
        print(f"\n⚠️  Missing deployment assets:")
        for item in missing:
            print(f"   - {item}")
    else:
        print("\n🎉 Deployment documentation assets are present!")

    return {
        "project": "DEPLOYMENT_DOCS",
        "total_files": len(found),
        "coverage": coverage,
        "missing": missing,
        "complete": len(missing) == 0,
    }


def generate_report(base_path: Path = None):
    """Generate comprehensive documentation report for all components."""
    
    if base_path is None:
        base_path = Path(__file__).parent.parent
    
    print("\n" + "="*60)
    print("  GTCX MIGRATION STACK - DEPLOYMENT DOC REPORT")
    print("  Note: Core logic documentation resides in sensei-ai.")
    print("  Generated:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    # Components to check
    components = ['maba', 'kora', 'amani']
    results = []

    for component in components:
        component_path = base_path / component
        if component_path.exists():
            result = check_documentation(component.upper(), component_path)
            results.append(result)

    if not results:
        print("\nℹ️  Component directories are not present in this repo.")
        print("   Falling back to deployment-only documentation checks.")
        results.append(check_deployment_docs(base_path))

    # Overall summary
    print("\n" + "="*60)
    print("  OVERALL STATUS")
    print("="*60)
    
    total_files = sum(r['total_files'] for r in results)
    avg_coverage = sum(r['coverage'] for r in results) / len(results)
    
    print(f"\n📈 Ecosystem Metrics:")
    print(f"   Total documentation files: {total_files}")
    print(f"   Average coverage: {avg_coverage:.1f}%")
    print(f"   Result sets checked: {len(results)}")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    
    for result in results:
        if result['project'] == 'DEPLOYMENT_DOCS' and result['missing']:
            print("\n   DEPLOYMENT_DOCS:")
            print("   - Restore the missing deployment-facing files listed above.")
        elif result['missing']:
            print(f"\n   {result['project']}:")
            print(f"   - Run: python scripts/generate_docs.py {result['project'].lower()}")
            print(f"   - Focus on: {', '.join(result['missing'][:3])}")
    
    if avg_coverage == 100:
        print("\n   🎉 Documentation is complete!")
    elif avg_coverage >= 80:
        print("\n   📝 Documentation is nearly complete. Fill remaining gaps.")
    elif avg_coverage >= 60:
        print("\n   ⚠️  Documentation needs attention. Run generators.")
    else:
        print("\n   🚨 Critical: Documentation is incomplete. Prioritize completion.")
    
    # Save report
    report_path = base_path / 'documentation_report.json'
    report_data = {
        'timestamp': datetime.now().isoformat(),
        'results': results,
        'summary': {
            'total_files': total_files,
            'average_coverage': avg_coverage,
            'components_checked': len(results)
        }
    }
    
    with open(report_path, 'w') as f:
        json.dump(report_data, f, indent=2)
    
    print(f"\n📄 Report saved to: {report_path}")


def main():
    """Main entry point."""
    
    if len(sys.argv) > 1:
        # Check specific path
        base_path = Path(sys.argv[1]).resolve()
    else:
        # Default to parent of scripts folder
        base_path = Path(__file__).parent.parent
    
    generate_report(base_path)
    print("\n✨ Documentation check complete!")


if __name__ == "__main__":
    main()
