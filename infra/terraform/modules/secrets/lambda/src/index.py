"""
GTCX Secret Rotation Lambda

Standard AWS Secrets Manager rotation handler for PostgreSQL database credentials.
Implements the four-step rotation protocol:
  1. create_secret  — Generate new password, store as AWSPENDING
  2. set_secret     — ALTER USER in PostgreSQL with new password
  3. test_secret    — Verify new credentials work
  4. finish_secret  — Promote AWSPENDING to AWSCURRENT

Environment variables:
  SECRET_ARN    — ARN of the secret to rotate (set by Terraform)
  ENVIRONMENT   — Deployment environment name (set by Terraform)

References:
  https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets-lambda-function-customizing.html
"""

import json
import logging
import os

import boto3
import psycopg2

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_client = boto3.client("secretsmanager")


def handler(event, context):
    """Entry point for AWS Secrets Manager rotation."""
    arn = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    # Verify the secret exists and rotation is enabled
    metadata = secrets_client.describe_secret(SecretId=arn)
    if not metadata.get("RotationEnabled"):
        raise ValueError(f"Secret {arn} does not have rotation enabled")

    versions = metadata.get("VersionIdsToStages", {})
    if token not in versions:
        raise ValueError(f"Secret version {token} has no stage for rotation of secret {arn}")

    if "AWSCURRENT" in versions[token]:
        logger.info(f"Secret version {token} already set as AWSCURRENT for {arn}")
        return

    if "AWSPENDING" not in versions[token]:
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation of {arn}")

    if step == "createSecret":
        create_secret(arn, token)
    elif step == "setSecret":
        set_secret(arn, token)
    elif step == "testSecret":
        test_secret(arn, token)
    elif step == "finishSecret":
        finish_secret(arn, token)
    else:
        raise ValueError(f"Invalid step: {step}")


def create_secret(arn, token):
    """Generate a new password and store it as AWSPENDING."""
    # Check if AWSPENDING already has a value (idempotent)
    try:
        secrets_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
        logger.info(f"createSecret: AWSPENDING already exists for {token}")
        return
    except secrets_client.exceptions.ResourceNotFoundException:
        pass

    # Get current secret to preserve structure
    current = secrets_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
    current_dict = json.loads(current["SecretString"])

    # Generate new password
    new_password = secrets_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters="/@\"'\\ ",
        RequireEachIncludedType=True,
    )["RandomPassword"]

    # Build new secret with updated password
    new_dict = {**current_dict, "password": new_password}

    # If the secret is a connection string, rebuild it
    if "url" in current_dict:
        new_dict["url"] = _rebuild_connection_string(current_dict["url"], new_password)

    secrets_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(new_dict),
        VersionStages=["AWSPENDING"],
    )
    logger.info(f"createSecret: New password generated and stored as AWSPENDING")


def set_secret(arn, token):
    """Apply the new password to the PostgreSQL database."""
    # Get current credentials to connect
    current = json.loads(
        secrets_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")["SecretString"]
    )
    # Get pending credentials for the new password
    pending = json.loads(
        secrets_client.get_secret_value(
            SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
        )["SecretString"]
    )

    conn_params = _parse_connection_params(current)
    new_password = pending["password"]

    conn = None
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        with conn.cursor() as cur:
            # Use parameterized identifier escaping to prevent SQL injection
            username = conn_params["user"]
            cur.execute(
                "ALTER USER {} PASSWORD %s".format(
                    psycopg2.extensions.quote_ident(username, cur)
                ),
                (new_password,),
            )
        logger.info(f"setSecret: Password updated for user {conn_params['user']}")
    finally:
        if conn:
            conn.close()


def test_secret(arn, token):
    """Verify the new credentials can connect to the database."""
    pending = json.loads(
        secrets_client.get_secret_value(
            SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
        )["SecretString"]
    )

    conn_params = _parse_connection_params(pending)

    conn = None
    try:
        conn = psycopg2.connect(**conn_params)
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        logger.info(f"testSecret: New credentials verified successfully")
    finally:
        if conn:
            conn.close()


def finish_secret(arn, token):
    """Promote AWSPENDING to AWSCURRENT."""
    metadata = secrets_client.describe_secret(SecretId=arn)
    versions = metadata.get("VersionIdsToStages", {})

    # Find the current version
    current_version = None
    for version_id, stages in versions.items():
        if "AWSCURRENT" in stages:
            if version_id == token:
                logger.info(f"finishSecret: Version {token} already AWSCURRENT")
                return
            current_version = version_id
            break

    # Move AWSCURRENT from old version to new version
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version,
    )
    logger.info(
        f"finishSecret: Promoted {token} to AWSCURRENT, demoted {current_version}"
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_connection_params(secret_dict):
    """Extract psycopg2 connection parameters from secret JSON."""
    # Support both structured secrets and connection string format
    if "url" in secret_dict:
        return _parse_url(secret_dict["url"])

    return {
        "host": secret_dict.get("host", "localhost"),
        "port": int(secret_dict.get("port", 5432)),
        "dbname": secret_dict.get("dbname", secret_dict.get("database", "gtcx")),
        "user": secret_dict.get("username", secret_dict.get("user", "gtcx")),
        "password": secret_dict["password"],
        "connect_timeout": 5,
    }


def _parse_url(url):
    """Parse a PostgreSQL connection URL into psycopg2 params."""
    from urllib.parse import urlparse

    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "dbname": (parsed.path or "/gtcx").lstrip("/"),
        "user": parsed.username or "gtcx",
        "password": parsed.password or "",
        "connect_timeout": 5,
    }


def _rebuild_connection_string(url, new_password):
    """Rebuild a connection URL with a new password."""
    from urllib.parse import urlparse, urlunparse, quote

    parsed = urlparse(url)
    netloc = f"{parsed.username}:{quote(new_password)}@{parsed.hostname}"
    if parsed.port:
        netloc += f":{parsed.port}"
    return urlunparse(parsed._replace(netloc=netloc))
