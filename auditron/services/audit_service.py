
from typing import List, Optional
from models import AuditResult, AuditResponse, AWSCredentials, AzureCredentials, GCPCredentials
from controls import SUPPORTED_CONTROLS

async def run_audit(provider: str, requested_controls: List[str], 
                   aws_credentials: Optional[AWSCredentials] = None,
                   azure_credentials: Optional[AzureCredentials] = None,
                   gcp_credentials: Optional[GCPCredentials] = None):
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
            try:
                evidence_function = SUPPORTED_CONTROLS[control_id]["function"]
                
                # Pass credentials to the evidence function based on provider
                if provider == "aws" and aws_credentials:
                    result_data = evidence_function(aws_credentials)
                elif provider == "azure" and azure_credentials:
                    result_data = evidence_function(azure_credentials)
                elif provider == "gcp" and gcp_credentials:
                    result_data = evidence_function(gcp_credentials)
                else:
                    # Fallback to environment variables if no credentials provided
                    result_data = evidence_function()
                
                # Ensure all required fields are present
                if 'evidence' not in result_data:
                    result_data['evidence'] = {}
                if 'status' not in result_data:
                    result_data['status'] = 'ERROR'
                if 'summary' not in result_data:
                    result_data['summary'] = 'No summary provided'
                    
                results.append(AuditResult(control_id=control_id, **result_data))
            except Exception as e:
                results.append(
                    AuditResult(
                        control_id=control_id,
                        status="ERROR",
                        summary=f"Error executing control: {str(e)}",
                        evidence={"error": str(e)},
                    )
                )
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
