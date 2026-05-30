---
title: 'POL-13: Communications Security'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-13: Communications Security

**Annex A Reference:** A.13 — Communications Security
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Protect information in transit and ensure the security of network infrastructure.

## 2. Scope

All GTCX network infrastructure, inter-service communication, external APIs, email, and messaging systems.

## 3. Policy Statement

1. **Network controls.** Network segmentation isolates production workloads from development and corporate networks. Security groups and network policies enforce least-privilege connectivity. Ingress is restricted to defined endpoints; all other traffic is denied by default. Network architecture is documented and reviewed semi-annually.

2. **Information transfer.** All data transfers between GTCX systems and external parties use encrypted channels (TLS 1.2+). File transfers use SFTP or HTTPS — FTP is prohibited. Email containing Confidential or Restricted data must use encryption. Data sharing agreements are required before transferring data to third parties.

3. **Internal service communication.** Services within the Kubernetes cluster communicate via mTLS. Service mesh policies enforce authentication and authorization between services. API gateways validate and rate-limit all external-facing endpoints.

4. **DNS and domain security.** DNSSEC is enabled for all GTCX domains. CAA records restrict certificate issuance to approved CAs. DMARC, DKIM, and SPF are configured for all email-sending domains.

5. **Monitoring.** Network traffic is monitored for anomalies. DDoS mitigation is active on all public-facing endpoints. Intrusion detection alerts are triaged within 1 hour during business hours and 4 hours outside business hours.

## 4. Responsibilities

| Role              | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| CISO              | Define network security standards               |
| DevOps            | Implement network controls, manage service mesh |
| Security Engineer | Monitor network traffic, triage alerts          |
| All Personnel     | Use approved channels for data transfer         |

## 5. Exceptions

Use of unencrypted protocols for legacy integrations requires CISO approval, network-level compensating controls (VPN/private link), and a migration timeline not exceeding 6 months.

## 6. Review

Reviewed annually. Network architecture reviewed semi-annually. Firewall rules reviewed quarterly.
