from typing import List, Optional
from models import AuditResult, AuditResponse, AWSCredentials, AzureCredentials, GCPCredentials
from controls import SUPPORTED_CONTROLS
from services.supabase_service import get_user_credentials

async def run_audit(provider: str, requested_controls: List[str], user_id: str):
    """A shared helper function to execute audits for a given provider using user credentials from Supabase."""
    results = []
    
    # Fetch user credentials from Supabase
    try:
        credentials_data = get_user_credentials(user_id)
        print(f"Fetched credentials for user {user_id}: {bool(credentials_data.get(f'{provider}_credentials'))}")
    except Exception as e:
        # If we can't fetch credentials, add error results for all controls
        for control_id in requested_controls:
            results.append(
                AuditResult(
                    control_id=control_id,
                    status="ERROR",
                    summary=f"Failed to retrieve user credentials: {str(e)}",
                    evidence={"error": "credential_fetch_failed"}
                )
            )
        return AuditResponse(provider=provider, results=results)
    
    # Extract provider-specific credentials
    aws_credentials = None
    azure_credentials = None
    gcp_credentials = None
    
    if provider == "aws" and credentials_data.get('aws_credentials'):
        aws_creds_data = credentials_data['aws_credentials']
        aws_credentials = AWSCredentials(**aws_creds_data)
    elif provider == "azure" and credentials_data.get('azure_credentials'):
        azure_creds_data = credentials_data['azure_credentials']
        azure_credentials = AzureCredentials(**azure_creds_data)
    elif provider == "gcp" and credentials_data.get('gcp_credentials'):
        gcp_creds_data = credentials_data['gcp_credentials']
        gcp_credentials = GCPCredentials(**gcp_creds_data)
    
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
            
            # Pass credentials to the evidence function based on provider
            try:
                if provider == "aws" and aws_credentials:
                    result_data = evidence_function(aws_credentials)
                elif provider == "azure" and azure_credentials:
                    result_data = evidence_function(azure_credentials)
                elif provider == "gcp" and gcp_credentials:
                    result_data = evidence_function(gcp_credentials)
                else:
                    # No credentials available for this provider
                    result_data = {
                        "status": "ERROR",
                        "summary": f"No {provider.upper()} credentials configured for user.",
                        "evidence": {"error": "no_credentials"}
                    }
                
                # Ensure all required fields are present
                if 'evidence' not in result_data:
                    result_data['evidence'] = {}
                if 'status' not in result_data:
                    result_data['status'] = 'ERROR'
                if 'summary' not in result_data:
                    result_data['summary'] = 'No summary provided'
                
                results.append(AuditResult(control_id=control_id, **result_data))
            except Exception as e:
                # Handle errors in evidence function execution
                results.append(
                    AuditResult(
                        control_id=control_id,
                        status="ERROR",
                        summary=f"Error executing control: {str(e)}",
                        evidence={"error": "execution_failed", "details": str(e)}
                    )
                )
        else:
            results.append(
                AuditResult(
                    control_id=control_id,
                    status="ERROR",
                    summary=f"Control ID '{control_id}' is not supported.",
                    evidence={"error": "unsupported_control"},
                )
            )
    return AuditResponse(provider=provider, results=results)
