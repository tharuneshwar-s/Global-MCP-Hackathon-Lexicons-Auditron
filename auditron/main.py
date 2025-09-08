from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from typing import List
from dotenv import load_dotenv

# Import all our evidence-gathering functions
from services.aws_service import *
from services.gcp_service import *
from services.azure_service import *

# Import pydantic models
from models import AuditRequest, AuditResult, AuditResponse, ToolInfo, ToolsResponse

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Project Auditron",
    description="An AI Compliance Co-pilot Server for automated, multi-cloud evidence gathering.",
    version="2.0.0",
    
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Additional middleware to ensure SSE endpoints (and any mounted subapps) always
# return CORS headers for browsers that may preflight or access EventSource.
@app.middleware("http")
async def force_cors_headers(request: Request, call_next):
    response = await call_next(request)
    # Ensure the headers required for SSE and fetch are present
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Methods", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "*")
    return response


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

# --- New RESTful API Endpoints ---


@app.get("/", tags=["System"])
async def root():
    """A simple health check endpoint to confirm the service is running."""
    return {"status": "ok", "service": "Project Auditron", "version": "2.0.0"}


@app.get("/tools", response_model=ToolsResponse, tags=["Discovery"])
async def list_tools():
    """
    Provides a structured, machine-readable list of all available audit controls,
    categorized by cloud provider. This is the primary discovery endpoint for an agent.
    """
    providers = {"aws": [], "gcp": [], "azure": []}
    for key, value in SUPPORTED_CONTROLS.items():
        provider = key.split("-")[0].lower()
        if provider in providers:
            providers[provider].append(
                ToolInfo(id=key, description=value["description"])
            )

    return ToolsResponse(tool_count=len(SUPPORTED_CONTROLS), providers=providers)


async def run_audit(provider: str, requested_controls: List[str]):
    """A shared helper function to execute audits for a given provider."""
    results = []
    for control_id in requested_controls:
        if not control_id.lower().startswith(provider):
            results.append(
                AuditResult(
                    control_id=control_id,
                    status="ERROR",
                    summary=f"Invalid control ID for provider '{provider}'.",
                    evidence={
                        "note": f"Control ID '{control_id}' does not belong to the '{provider}' provider."
                    },
                )
            )
            continue

        if control_id in SUPPORTED_CONTROLS:
            evidence_function = SUPPORTED_CONTROLS[control_id]["function"]
            result_data = evidence_function()
            results.append(AuditResult(control_id=control_id, **result_data))
        else:
            results.append(
                AuditResult(
                    control_id=control_id,
                    status="ERROR",
                    summary=f"Control ID '{control_id}' is not supported.",
                    evidence={},
                )
            )
    return AuditResponse(provider=provider, results=results)


@app.post("/audit/aws", response_model=AuditResponse, tags=["Auditing"])
async def audit_aws(request: AuditRequest):
    """Executes a list of specified audit controls for Amazon Web Services."""
    return await run_audit("aws", request.controls)


@app.post("/audit/azure", response_model=AuditResponse, tags=["Auditing"])
async def audit_azure(request: AuditRequest):
    """Executes a list of specified audit controls for Microsoft Azure."""
    return await run_audit("azure", request.controls)


@app.post("/audit/gcp", response_model=AuditResponse, tags=["Auditing"])
async def audit_gcp(request: AuditRequest):
    """Executes a list of specified audit controls for Google Cloud Platform."""
    return await run_audit("gcp", request.controls)



