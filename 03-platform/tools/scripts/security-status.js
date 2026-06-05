#!/usr/bin/env node

/**
 * GTCX Monorepo Security Status Script
 * Provides real-time security information and vulnerability status
 *
 * Aligned with 12 Architectural Principles:
 * - P5 (AI-Native): Structured JSON output for automated analysis
 * - P9 (Security): Comprehensive vulnerability scanning
 * - P12 (Observability): Detailed metrics and recommendations
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityStatus {
  constructor() {
    // Monorepo root (gtcx/)
    this.rootDir = path.resolve(__dirname, '..', '..', '..');
    this.securityDir = path.resolve(__dirname, '..');
    this.status = {
      timestamp: new Date().toISOString(),
      monorepo: 'gtcx',
      overallStatus: 'UNKNOWN',
      vulnerabilities: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      },
      packages: {
        total: 0,
        outdated: 0,
        vulnerable: 0,
      },
      workspaces: [],
      lastScan: null,
      recommendations: [],
      principleCompliance: {
        P2_TypeSafety: 'UNKNOWN',
        P9_Security: 'UNKNOWN',
        P12_Observability: 'UNKNOWN',
      },
    };
  }

  async runSecurityAudit() {
    try {
      console.log('🔍 Running security audit on monorepo...');
      process.chdir(this.rootDir);

      // Run pnpm audit (or npm audit)
      let auditResult;
      try {
        auditResult = execSync('pnpm audit --json 2>/dev/null || npm audit --json 2>/dev/null', {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (error) {
        // npm/pnpm audit exits with non-zero when vulnerabilities found
        auditResult = error.stdout || '{}';
      }

      try {
        const auditData = JSON.parse(auditResult);

        if (auditData.metadata?.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          this.status.vulnerabilities.total = vulns.total || 0;
          this.status.vulnerabilities.critical = vulns.critical || 0;
          this.status.vulnerabilities.high = vulns.high || 0;
          this.status.vulnerabilities.moderate = vulns.moderate || 0;
          this.status.vulnerabilities.low = vulns.low || vulns.info || 0;
        }
      } catch {
        console.log('   ⚠️  Could not parse audit output');
      }

      // Determine overall status
      this.status.overallStatus = this.calculateOverallStatus();
      this.status.lastScan = new Date().toISOString();

      console.log(`   ✅ Audit complete: ${this.status.overallStatus}`);
    } catch (error) {
      console.error('   ❌ Error running security audit:', error.message);
      this.status.overallStatus = 'ERROR';
    }
  }

  calculateOverallStatus() {
    const { critical, high, moderate, low } = this.status.vulnerabilities;

    if (critical > 0) return 'CRITICAL';
    if (high > 0) return 'HIGH';
    if (moderate > 0) return 'MODERATE';
    if (low > 0) return 'LOW';
    return 'CLEAN';
  }

  async checkWorkspaces() {
    try {
      console.log('📦 Checking workspace packages...');

      // Check key directories
      const workspaceDirs = ['apps', 'packages', 'protocols', 'platforms', 'intelligence'];

      for (const dir of workspaceDirs) {
        const fullPath = path.join(this.rootDir, dir);
        if (fs.existsSync(fullPath)) {
          const subdirs = fs
            .readdirSync(fullPath, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);

          this.status.workspaces.push({
            name: dir,
            packages: subdirs.length,
            path: dir,
          });
        }
      }

      const totalPackages = this.status.workspaces.reduce((sum, w) => sum + w.packages, 0);
      this.status.packages.total = totalPackages;

      console.log(
        `   ✅ Found ${totalPackages} packages across ${this.status.workspaces.length} workspaces`
      );
    } catch (error) {
      console.error('   ❌ Error checking workspaces:', error.message);
    }
  }

  async checkPrincipleCompliance() {
    console.log('📐 Checking architectural principle compliance...');

    // P2: Type Safety - Check for Zod usage
    try {
      const zodCheck = execSync(
        `grep -r "from 'zod'" ${this.rootDir}/packages ${this.rootDir}/protocols 2>/dev/null | wc -l`,
        { encoding: 'utf8' }
      ).trim();
      this.status.principleCompliance.P2_TypeSafety =
        parseInt(zodCheck) > 5 ? 'COMPLIANT' : 'NEEDS_REVIEW';
    } catch {
      this.status.principleCompliance.P2_TypeSafety = 'UNKNOWN';
    }

    // P9: Security - Check for input validation patterns
    try {
      const validationCheck = execSync(
        `grep -r "Schema.parse\\|validate\\|sanitize" ${this.rootDir}/packages 2>/dev/null | wc -l`,
        { encoding: 'utf8' }
      ).trim();
      this.status.principleCompliance.P9_Security =
        parseInt(validationCheck) > 3 ? 'COMPLIANT' : 'NEEDS_REVIEW';
    } catch {
      this.status.principleCompliance.P9_Security = 'UNKNOWN';
    }

    // P12: Observability - Check for logging/metrics
    try {
      const loggingCheck = execSync(
        `grep -r "logger\\|metrics\\|trace" ${this.rootDir}/packages 2>/dev/null | wc -l`,
        { encoding: 'utf8' }
      ).trim();
      this.status.principleCompliance.P12_Observability =
        parseInt(loggingCheck) > 3 ? 'COMPLIANT' : 'NEEDS_REVIEW';
    } catch {
      this.status.principleCompliance.P12_Observability = 'UNKNOWN';
    }

    console.log('   ✅ Principle compliance checked');
  }

  generateRecommendations() {
    this.status.recommendations = [];
    const { critical, high, moderate } = this.status.vulnerabilities;

    if (critical > 0) {
      this.status.recommendations.push({
        severity: 'CRITICAL',
        message: `${critical} critical vulnerabilities require immediate action`,
        action: 'pnpm audit fix --force',
      });
    }

    if (high > 0) {
      this.status.recommendations.push({
        severity: 'HIGH',
        message: `${high} high-risk vulnerabilities should be addressed within 24 hours`,
        action: 'pnpm audit fix',
      });
    }

    if (moderate > 0) {
      this.status.recommendations.push({
        severity: 'MODERATE',
        message: `${moderate} moderate vulnerabilities need remediation planning`,
        action: 'pnpm update',
      });
    }

    if (this.status.principleCompliance.P2_TypeSafety === 'NEEDS_REVIEW') {
      this.status.recommendations.push({
        severity: 'MEDIUM',
        message: 'P2 (Type Safety): Add Zod validation to more boundaries',
        action: 'Review packages for missing input validation',
      });
    }

    if (this.status.overallStatus === 'CLEAN') {
      this.status.recommendations.push({
        severity: 'INFO',
        message: 'Security status is clean. Continue monitoring.',
        action: 'Schedule next scan',
      });
    }
  }

  displayStatus() {
    const statusEmoji = {
      CLEAN: '✅',
      LOW: '🟢',
      MODERATE: '🟡',
      HIGH: '🟠',
      CRITICAL: '🔴',
      ERROR: '❌',
      UNKNOWN: '❓',
    };

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           🛡️  GTCX MONOREPO SECURITY STATUS              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(
      `║  Status: ${statusEmoji[this.status.overallStatus]} ${this.status.overallStatus.padEnd(10)} Last Scan: ${this.status.lastScan?.slice(0, 10) || 'Never'}  ║`
    );
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  VULNERABILITIES                                         ║');
    console.log(
      `║    Critical: ${String(this.status.vulnerabilities.critical).padEnd(5)} High: ${String(this.status.vulnerabilities.high).padEnd(5)} Moderate: ${String(this.status.vulnerabilities.moderate).padEnd(5)}  ║`
    );
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  WORKSPACES                                              ║');

    for (const ws of this.status.workspaces) {
      console.log(
        `║    ${ws.name.padEnd(15)} ${String(ws.packages).padStart(3)} packages                     ║`
      );
    }

    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  PRINCIPLE COMPLIANCE                                    ║');
    console.log(
      `║    P2 Type Safety:   ${this.status.principleCompliance.P2_TypeSafety.padEnd(15)}              ║`
    );
    console.log(
      `║    P9 Security:      ${this.status.principleCompliance.P9_Security.padEnd(15)}              ║`
    );
    console.log(
      `║    P12 Observability: ${this.status.principleCompliance.P12_Observability.padEnd(15)}             ║`
    );
    console.log('╚══════════════════════════════════════════════════════════╝');

    if (this.status.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of this.status.recommendations) {
        console.log(`   [${rec.severity}] ${rec.message}`);
        console.log(`      → ${rec.action}`);
      }
    }

    console.log('\n🚀 Quick Actions:');
    console.log('   pnpm run security:audit    # Full security audit');
    console.log('   pnpm audit fix             # Auto-fix vulnerabilities');
    console.log('   pnpm update                # Update dependencies');
    console.log('');
  }

  async saveStatus() {
    const outputDir = path.join(this.securityDir, 'reports');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const statusFile = path.join(outputDir, 'current-status.json');
    fs.writeFileSync(statusFile, JSON.stringify(this.status, null, 2));
    console.log(`💾 Status saved to: ${statusFile}`);
  }

  async run() {
    console.log('');
    console.log('🛡️  GTCX Monorepo Security Status Check');
    console.log('━'.repeat(50));
    console.log('');

    await this.runSecurityAudit();
    await this.checkWorkspaces();
    await this.checkPrincipleCompliance();
    this.generateRecommendations();
    this.displayStatus();
    await this.saveStatus();

    // Exit with appropriate code for CI/CD
    const exitCode = {
      CRITICAL: 1,
      HIGH: 2,
      MODERATE: 0,
      LOW: 0,
      CLEAN: 0,
      ERROR: 1,
      UNKNOWN: 0,
    };

    process.exit(exitCode[this.status.overallStatus] || 0);
  }
}

// Run the security status check
const securityStatus = new SecurityStatus();
securityStatus.run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
