---
title: 'Forensic Readiness Procedure'
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

# Forensic Readiness Procedure

**Classification:** Confidential
**Owner:** CISO
**Version:** 1.0
**Last Updated:** **\_\_\_\_**

---

## 1. Purpose

This document establishes forensic readiness procedures for the GTCX ecosystem. Forensic readiness ensures that digital evidence can be collected, preserved, and analyzed in a manner that is defensible in legal proceedings, regulatory investigations, and internal reviews.

## 2. Scope

All GTCX production and staging infrastructure including:

- AWS VPC and EC2 instances
- Kubernetes clusters and containers
- EBS volumes and S3 buckets
- PostgreSQL databases (`gtcx_development` and `gtcx_audit`)
- HSM and key management infrastructure
- Network devices and load balancers
- CI/CD pipeline infrastructure

## 3. VPC Traffic Mirroring to Forensic VPC

Traffic mirroring captures a copy of network traffic from elastic network interfaces and sends it to a dedicated forensic VPC for analysis. This must be pre-configured so it can be activated within minutes during an incident.

### 3.1 Architecture

```
Production VPC                    Forensic VPC
+------------------+             +------------------+
| ENI (target)     | -- mirror-->| NLB (mirror      |
|                  |   session   | target)           |
|                  |             |   |               |
|                  |             |   v               |
|                  |             | Forensic capture  |
|                  |             | instance (tcpdump,|
|                  |             | Arkime/Moloch)    |
+------------------+             +------------------+
```

### 3.2 Terraform Configuration

```hcl
# modules/forensic-vpc/main.tf

resource "aws_vpc" "forensic" {
  cidr_block           = "10.200.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "gtcx-forensic-vpc"
    Environment = "forensic"
    ManagedBy   = "terraform"
  }
}

resource "aws_subnet" "forensic_private" {
  vpc_id            = aws_vpc.forensic.id
  cidr_block        = "10.200.1.0/24"
  availability_zone = var.availability_zone

  tags = {
    Name = "gtcx-forensic-private"
  }
}

# VPC Peering between production and forensic VPCs
resource "aws_vpc_peering_connection" "prod_to_forensic" {
  vpc_id      = var.production_vpc_id
  peer_vpc_id = aws_vpc.forensic.id
  auto_accept = true

  tags = {
    Name = "prod-to-forensic-peering"
  }
}

# Network Load Balancer as traffic mirror target
resource "aws_lb" "forensic_nlb" {
  name               = "gtcx-forensic-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = [aws_subnet.forensic_private.id]

  tags = {
    Name = "gtcx-forensic-mirror-target"
  }
}

# Traffic Mirror Filter (capture all traffic or specific ports)
resource "aws_ec2_traffic_mirror_filter" "forensic" {
  description = "Forensic traffic capture filter"

  tags = {
    Name = "gtcx-forensic-filter"
  }
}

resource "aws_ec2_traffic_mirror_filter_rule" "ingress_all" {
  traffic_mirror_filter_id = aws_ec2_traffic_mirror_filter.forensic.id
  description              = "Capture all ingress traffic"
  rule_number              = 100
  rule_action              = "accept"
  direction                = "ingress"
  protocol                 = 0
  destination_cidr_block   = "0.0.0.0/0"
  source_cidr_block        = "0.0.0.0/0"
}

resource "aws_ec2_traffic_mirror_filter_rule" "egress_all" {
  traffic_mirror_filter_id = aws_ec2_traffic_mirror_filter.forensic.id
  description              = "Capture all egress traffic"
  rule_number              = 100
  rule_action              = "accept"
  direction                = "egress"
  protocol                 = 0
  destination_cidr_block   = "0.0.0.0/0"
  source_cidr_block        = "0.0.0.0/0"
}

# Traffic Mirror Target (NLB)
resource "aws_ec2_traffic_mirror_target" "forensic_nlb" {
  description              = "Forensic NLB mirror target"
  network_load_balancer_arn = aws_lb.forensic_nlb.arn

  tags = {
    Name = "gtcx-forensic-mirror-target"
  }
}

# Traffic Mirror Session (activated per-ENI during incidents)
# This resource is templated -- create one per ENI to monitor.
# During normal operations, keep sessions in a disabled state
# or create them on-demand via incident response automation.
resource "aws_ec2_traffic_mirror_session" "incident" {
  count = var.enable_mirror_session ? 1 : 0

  description              = "Incident forensic capture"
  network_interface_id     = var.target_eni_id
  traffic_mirror_filter_id = aws_ec2_traffic_mirror_filter.forensic.id
  traffic_mirror_target_id = aws_ec2_traffic_mirror_target.forensic_nlb.id
  session_number           = 1

  tags = {
    Name       = "gtcx-incident-mirror-session"
    IncidentId = var.incident_id
  }
}

# S3 bucket for PCAP storage with WORM retention
resource "aws_s3_bucket" "forensic_evidence" {
  bucket = "gtcx-forensic-evidence-${var.environment}"

  tags = {
    Name        = "gtcx-forensic-evidence"
    Environment = var.environment
    Compliance  = "forensic-retention"
  }
}

resource "aws_s3_bucket_versioning" "forensic_evidence" {
  bucket = aws_s3_bucket.forensic_evidence.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "forensic_evidence" {
  bucket = aws_s3_bucket.forensic_evidence.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 2555  # 7 years
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "forensic_evidence" {
  bucket = aws_s3_bucket.forensic_evidence.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.forensic_kms_key_id
    }
  }
}

# IAM policy: only incident responders can write to forensic bucket
resource "aws_iam_policy" "forensic_evidence_write" {
  name        = "gtcx-forensic-evidence-write"
  description = "Write access to forensic evidence bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.forensic_evidence.arn}/*"
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ]
        Resource = "${aws_s3_bucket.forensic_evidence.arn}/*"
      }
    ]
  })
}
```

### 3.3 Activation Procedure

1. Incident Commander authorizes traffic mirroring.
2. Security engineer identifies target ENIs (affected hosts/services).
3. Apply Terraform with `enable_mirror_session = true` and the target ENI ID(s).
4. Verify PCAP capture is flowing to the forensic instance.
5. Log the activation in the incident record (who, when, which ENIs, incident ID).

## 4. Automated Memory Dump on OOMKill or Crash

### 4.1 Kubernetes preStop Hook

Configure pods in production namespaces to capture memory state before termination. This is critical for investigating memory corruption, exploitation, and OOMKill events.

```yaml
# k8s/overlays/production/memory-dump-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: DEPLOYMENT_NAME
spec:
  template:
    spec:
      containers:
        - name: APP_CONTAINER
          lifecycle:
            preStop:
              exec:
                command:
                  - /bin/sh
                  - -c
                  - |
                    TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
                    POD_NAME=$(hostname)
                    DUMP_DIR="/forensic-dumps"
                    DUMP_FILE="${DUMP_DIR}/${POD_NAME}-${TIMESTAMP}.hprof"

                    mkdir -p ${DUMP_DIR}

                    # Capture process memory map
                    cat /proc/1/maps > ${DUMP_DIR}/${POD_NAME}-${TIMESTAMP}-maps.txt 2>/dev/null

                    # Capture process status
                    cat /proc/1/status > ${DUMP_DIR}/${POD_NAME}-${TIMESTAMP}-status.txt 2>/dev/null

                    # For JVM: heap dump
                    if command -v jmap > /dev/null 2>&1; then
                      jmap -dump:format=b,file=${DUMP_FILE} 1 2>/dev/null
                    fi

                    # For Node.js: generate heap snapshot signal
                    if command -v node > /dev/null 2>&1; then
                      kill -USR2 1 2>/dev/null
                      sleep 2
                      cp /tmp/*.heapsnapshot ${DUMP_DIR}/ 2>/dev/null
                    fi

                    # Upload to forensic evidence bucket
                    if command -v aws > /dev/null 2>&1; then
                      aws s3 cp ${DUMP_DIR}/ s3://gtcx-forensic-evidence-${ENVIRONMENT}/memory-dumps/${POD_NAME}/${TIMESTAMP}/ \
                        --recursive --quiet 2>/dev/null
                    fi

                    echo "Memory dump completed: ${TIMESTAMP}" >> ${DUMP_DIR}/dump.log
          volumeMounts:
            - name: forensic-dumps
              mountPath: /forensic-dumps
      volumes:
        - name: forensic-dumps
          emptyDir:
            sizeLimit: 2Gi
      terminationGracePeriodSeconds: 60
```

### 4.2 OOMKill Event Capture

Configure a DaemonSet to watch for OOMKill events and capture metadata:

```yaml
# k8s/base/forensic-oomkill-watcher.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: oomkill-watcher
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: oomkill-watcher
  template:
    metadata:
      labels:
        app: oomkill-watcher
    spec:
      containers:
        - name: watcher
          image: ghcr.io/gtcx/oomkill-watcher:latest
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: EVIDENCE_BUCKET
              value: 'gtcx-forensic-evidence-production'
            - name: ALERT_WEBHOOK
              valueFrom:
                secretKeyRef:
                  name: forensic-config
                  key: alert-webhook-url
          volumeMounts:
            - name: kmsg
              mountPath: /dev/kmsg
              readOnly: true
      volumes:
        - name: kmsg
          hostPath:
            path: /dev/kmsg
```

## 5. Disk Snapshot Retention

### 5.1 Policy

| Context                             | Snapshot Frequency                          | Retention                                  |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Normal operations                   | Daily (all production EBS volumes)          | 30 days                                    |
| Active incident                     | Immediate snapshot of all affected volumes  | 90 days minimum from incident closure      |
| Post-incident (under investigation) | Preserve all snapshots from incident window | Until legal/compliance clearance to delete |
| Regulatory hold                     | As directed by General Counsel              | Until hold is lifted                       |

### 5.2 Incident Snapshot Procedure

1. Incident Commander authorizes disk snapshots of affected volumes.
2. Security engineer creates snapshots with incident metadata tags:

```bash
# Create tagged snapshot for incident evidence
aws ec2 create-snapshot \
  --volume-id vol-XXXXXXXXXXXXXXXXX \
  --description "Forensic snapshot - Incident GTCX-INC-YYYY-NNN" \
  --tag-specifications \
    "ResourceType=snapshot,Tags=[
      {Key=IncidentId,Value=GTCX-INC-YYYY-NNN},
      {Key=CollectedBy,Value=COLLECTOR_NAME},
      {Key=CollectedAt,Value=$(date -u +%Y-%m-%dT%H:%M:%SZ)},
      {Key=ForensicRetention,Value=true},
      {Key=RetentionDays,Value=90}
    ]"

# Record SHA-256 of snapshot metadata for chain of custody
aws ec2 describe-snapshots --snapshot-ids snap-XXXXXXXXXXXXXXXXX \
  | sha256sum | tee -a chain-of-custody.log
```

3. Apply resource lock (deny delete) via IAM policy scoped to the incident tag.
4. Log snapshot IDs in the incident record and chain-of-custody form.

### 5.3 Automated Daily Snapshots (Terraform)

```hcl
# modules/backup/ebs-snapshots.tf

resource "aws_dlm_lifecycle_policy" "production_snapshots" {
  description        = "Daily production EBS snapshots"
  execution_role_arn = var.dlm_role_arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    target_tags = {
      Environment = "production"
    }

    schedule {
      name = "daily-production-snapshot"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 30
      }

      tags_to_add = {
        SnapshotType = "automated-daily"
        ManagedBy    = "dlm"
      }

      copy_tags = true
    }
  }

  tags = {
    Name = "gtcx-production-daily-snapshots"
  }
}
```

## 6. Chain-of-Custody Procedure

### 6.1 Principles

- Every piece of digital evidence must have an unbroken chain of custody from collection to disposal.
- Evidence integrity is verified via cryptographic hash (SHA-256) at collection and at every transfer.
- Only authorized personnel (incident responders listed in the IRP contact list) may handle evidence.
- All evidence handling is logged in the chain-of-custody form.

### 6.2 Chain-of-Custody Form

For each evidence artifact, complete the following record:

```
CHAIN OF CUSTODY RECORD
========================
Incident ID:        GTCX-INC-YYYY-NNN
Evidence ID:        GTCX-EVD-YYYY-NNN-SSS (sequential per incident)
Description:        [What this evidence is]
Source:             [System, volume, bucket, or network segment]
Format:             [PCAP, disk image, log export, memory dump, etc.]
Size:               [Bytes]

COLLECTION
  Collected by:     [Full name]
  Role:             [Title / role on incident team]
  Date/Time (UTC):  [YYYY-MM-DD HH:MM:SS UTC]
  Method:           [Tool and command used to collect]
  Tool version:     [Version of collection tool]
  SHA-256 at collection: [Hash]

STORAGE
  Location:         [S3 URI, volume ID, or physical location]
  Access controls:  [Who has access]
  Encryption:       [At-rest encryption method and key ID]

TRANSFER LOG
  # Repeat for each transfer
  Date/Time (UTC):  [YYYY-MM-DD HH:MM:SS UTC]
  From:             [Name, role]
  To:               [Name, role]
  Purpose:          [Why transferred]
  SHA-256 verified: [Yes/No -- must match collection hash]
  Notes:            [Any observations]

DISPOSITION
  Date/Time (UTC):  [When evidence was released or destroyed]
  Authorized by:    [Name, role]
  Method:           [Retained / securely deleted / transferred to law enforcement]
  Reason:           [Investigation closed / legal hold lifted / etc.]
```

### 6.3 Evidence Handling Rules

1. **Two-person rule.** Critical evidence (P1 incidents) requires two authorized personnel present during collection.
2. **Hash verification.** SHA-256 hash must be computed at collection and verified at every access or transfer. Any hash mismatch must be reported to the Incident Commander immediately.
3. **No modification.** Evidence must never be modified. Analysis is performed on copies, not originals.
4. **Write-once storage.** Original evidence is stored in S3 with Object Lock (COMPLIANCE mode). No human can delete it before the retention period expires.
5. **Access logging.** The forensic evidence bucket has S3 access logging and CloudTrail data events enabled. Every read is recorded.
6. **Legal privilege.** If evidence is collected at the direction of legal counsel, label it "Privileged and Confidential -- Prepared at Direction of Counsel."

## 7. Forensic Toolkit Inventory

All forensic tools used for evidence collection and analysis must be inventoried with version and hash. This ensures reproducibility and defensibility.

| Tool              | Version        | Purpose                                       | SHA-256 (Binary)                | Source                                              |
| ----------------- | -------------- | --------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| `dd`              | coreutils 8.32 | Disk imaging                                  | [Compute from installed binary] | OS package manager                                  |
| `dc3dd`           | 7.2.646        | Forensic disk imaging with hashing            | [Compute from installed binary] | https://dc3dd.sourceforge.net                       |
| `volatility3`     | 2.5.0          | Memory analysis                               | [Compute from installed binary] | https://github.com/volatilityfoundation/volatility3 |
| `tcpdump`         | 4.99.4         | Network packet capture                        | [Compute from installed binary] | OS package manager                                  |
| `tshark`          | 4.2.x          | Network packet analysis                       | [Compute from installed binary] | https://www.wireshark.org                           |
| `Arkime` (Moloch) | 4.x            | Full packet capture and search                | [Compute from installed binary] | https://arkime.com                                  |
| `aws-cli`         | 2.x            | AWS evidence collection (snapshots, S3, logs) | [Compute from installed binary] | AWS                                                 |
| `kubectl`         | 1.28.x         | Kubernetes evidence collection                | [Compute from installed binary] | https://kubernetes.io                               |
| `jq`              | 1.7            | JSON log parsing                              | [Compute from installed binary] | https://jqlang.github.io/jq                         |
| `sha256sum`       | coreutils 8.32 | Hash computation                              | [Compute from installed binary] | OS package manager                                  |
| `pg_dump`         | 16.x           | PostgreSQL database export                    | [Compute from installed binary] | https://www.postgresql.org                          |

### 7.1 Toolkit Maintenance

- Forensic toolkit hashes must be recomputed and verified after any update.
- The toolkit inventory must be reviewed quarterly.
- Forensic tools must be installed on the forensic capture instance from verified sources only.
- The forensic capture instance must not have internet access except to the forensic evidence S3 bucket (enforced via VPC endpoint and security group).

## 8. Evidence Preservation Order Template

When an incident requires formal evidence preservation (regulatory investigation, litigation hold, law enforcement request), the General Counsel issues a preservation order using this template:

```
EVIDENCE PRESERVATION ORDER
============================
Order ID:           GTCX-EPO-YYYY-NNN
Incident ID:        GTCX-INC-YYYY-NNN (if applicable)
Issued by:          [General Counsel name]
Date issued:        [Date]
Effective until:    [Date or "until further notice"]

SCOPE
This order requires the preservation of all digital evidence related to:
- [Description of systems, data, and time period]
- [Specific artifacts if known]

AFFECTED SYSTEMS
- [List of systems, databases, S3 buckets, volumes, etc.]

REQUIRED ACTIONS
1. All automated deletion and rotation policies for in-scope data are
   suspended effective immediately.
2. All in-scope backups and snapshots must be tagged with this order ID
   and excluded from lifecycle deletion.
3. No in-scope data may be modified, deleted, overwritten, or migrated
   without written authorization from General Counsel.
4. Any personnel with access to in-scope data must be notified of this
   preservation obligation.

CUSTODIAN
The following individual is responsible for ensuring compliance with
this order:
  Name:   [Name]
  Role:   [Role]
  Email:  [Email]

REPORTING
The custodian must confirm compliance within 24 hours of this order
and provide weekly status updates to General Counsel.

NON-COMPLIANCE
Failure to comply with this preservation order may result in adverse
legal consequences including spoliation sanctions.

ACKNOWLEDGMENT
I acknowledge receipt of this preservation order and understand my
obligations.

Name:      ________________
Signature: ________________
Date:      ________________
```

## 9. Forensic Investigation Workflow

### 9.1 Pre-Investigation Checklist

- [ ] Incident Commander has authorized the investigation
- [ ] Chain-of-custody forms are prepared
- [ ] Forensic toolkit hashes are verified
- [ ] Forensic VPC and capture instance are operational
- [ ] Evidence storage (S3 with Object Lock) is accessible
- [ ] Two authorized responders are available (for P1)

### 9.2 Collection Sequence

1. **Network capture.** Activate VPC traffic mirroring (Section 3) if network activity is ongoing.
2. **Memory.** Capture memory dumps before any system restart (Section 4).
3. **Disk.** Create EBS snapshots of all affected volumes (Section 5).
4. **Logs.** Export all relevant logs from SIEM, CloudTrail, application audit log, and Kubernetes.
5. **Configuration.** Capture current configuration state (Terraform state, K8s manifests, IAM policies).
6. **Containers.** Save running container images (`docker save` / `ctr images export`).

### 9.3 Analysis

- All analysis is performed on copies, never on original evidence.
- Analysis findings are documented in the incident record.
- If analysis reveals additional affected systems, repeat the collection sequence for those systems.

## Revision History

| Version | Date         | Author | Changes                              |
| ------- | ------------ | ------ | ------------------------------------ |
| 1.0     | **\_\_\_\_** | CISO   | Initial forensic readiness procedure |
