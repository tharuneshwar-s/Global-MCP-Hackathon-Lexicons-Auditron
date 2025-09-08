

# Import all our evidence-gathering functions
from services.aws_service import *
from services.gcp_service import *
from services.azure_service import *

# --- Control Mapping (Our single source of truth) ---

SUPPORTED_CONTROLS = {
    # AWS Controls
    "AWS-S3-PUBLIC-ACCESS-V1": {
        "function": check_s3_public_access,
        "description": "Checks that all S3 buckets block public access.",
    },
    "AWS-EBS-ENCRYPTION-V1": {
        "function": check_ebs_encryption,
        "description": "Checks that all EBS volumes in the configured region have encryption enabled.",
    },
    "AWS-EFS-ENCRYPTION-IN-TRANSIT-V1": {
        "function": check_efs_encryption_in_transit,
        "description": "Checks that all EFS file systems in the configured region enforce encryption in transit.",
    },
    "AWS-RDS-PUBLIC-ACCESS-V1": {
        "function": check_rds_public_access,
        "description": "Checks if any RDS database instances are publicly accessible.",
    },
    "AWS-RDS-STORAGE-ENCRYPTION-V1": {
        "function": check_rds_storage_encryption,
        "description": "Checks if all RDS database instances have storage encryption enabled.",
    },
    "AWS-EBS-SNAPSHOT-PUBLIC-V1": {
        "function": check_ebs_snapshot_public,
        "description": "Checks if any EBS snapshots are publicly shared.",
    },
    "AWS-DYNAMODB-PITR-V1": {
        "function": check_dynamodb_pitr,
        "description": "Checks if all DynamoDB tables have Point-in-Time Recovery (PITR) enabled.",
    },
    "AWS-IAM-MFA-CONSOLE-V1": {
        "function": check_iam_mfa_console,
        "description": "Checks if IAM users with console passwords have MFA enabled.",
    },
    "AWS-IAM-ROOT-MFA-V1": {
        "function": check_iam_root_mfa,
        "description": "Checks if the account's root user has MFA enabled.",
    },
    "AWS-VPC-SG-RESTRICTED-SSH-V1": {
        "function": check_vpc_sg_restricted_ssh,
        "description": "Checks for Security Groups allowing unrestricted SSH (0.0.0.0/0) access.",
    },
    "AWS-KMS-KEY-ROTATION-V1": {
        "function": check_kms_key_rotation,
        "description": "Checks if customer-managed KMS keys have automatic key rotation enabled.",
    },
    "AWS-CLOUDTRAIL-ENABLED-V1": {
        "function": check_cloudtrail_enabled,
        "description": "Checks that a multi-region CloudTrail is enabled and logging.",
    },
    "AWS-CONFIG-ENABLED-V1": {
        "function": check_config_enabled,
        "description": "Checks that AWS Config is enabled to record all resource changes.",
    },
    "AWS-GUARDDUTY-ENABLED-V1": {
        "function": check_guardduty_enabled,
        "description": "Checks that GuardDuty is enabled for threat detection.",
    },
    "AWS-SECRETSMANAGER-ROTATION-V1": {
        "function": check_secretsmanager_rotation,
        "description": "Checks if secrets are configured for automatic rotation.",
    },
    # GCP Controls
    "GCP-STORAGE-PUBLIC-V1": {
        "function": check_gcp_storage_public,
        "description": "Checks that all GCP Cloud Storage buckets are not publicly accessible.",
    },
    # Azure Controls
    "AZURE-STORAGE-PUBLIC-V1": {
        "function": check_azure_storage_public,
        "description": "Checks for publicly accessible Azure Blob Storage containers.",
    },
    "AZURE-STORAGE-HTTPS-V1": {
        "function": check_azure_storage_https,
        "description": "Checks if Azure Storage Accounts enforce 'Secure transfer required' (HTTPS).",
    },
    "AZURE-SQL-TDE-V1": {
        "function": check_azure_sql_tde,
        "description": "Checks if Azure SQL databases have Transparent Data Encryption (TDE) enabled.",
    },
    "AZURE-ENTRA-MFA-ADMIN-V1": {
        "function": check_azure_entra_mfa_admin,
        "description": "Checks if users with administrative roles have MFA enabled (via Conditional Access).",
    },
    "AZURE-NSG-RESTRICTED-RDP-V1": {
        "function": check_azure_nsg_restricted_rdp,
        "description": "Checks for Network Security Groups allowing unrestricted RDP (3389) access.",
    },
    "AZURE-MONITOR-LOG-PROFILES-V1": {
        "function": check_azure_monitor_log_profiles,
        "description": "Checks that Azure Monitor is configured to export Activity Logs for retention.",
    },
    "AZURE-DEFENDER-STANDARD-TIER-V1": {
        "function": check_azure_defender_standard_tier,
        "description": "Checks that the standard tier of Microsoft Defender for Cloud is enabled.",
    },
}
