# services/gcp_service.py
from google.cloud import storage
from google.api_core import exceptions
import os
import json
import tempfile
from typing import Optional

def get_gcp_client(gcp_credentials: Optional['GCPCredentials'] = None):
    """Helper function to create GCP client with provided credentials or environment variables."""
    if gcp_credentials:
        # Create a temporary file with the service account JSON
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            json.dump(gcp_credentials.service_account_json, temp_file)
            temp_file_path = temp_file.name
        
        storage_client = storage.Client.from_service_account_json(temp_file_path)
        # Clean up the temporary file
        os.unlink(temp_file_path)
        return storage_client
    else:
        return storage.Client.from_service_account_json(os.getenv("GCP_SERVICE_ACCOUNT_FILE"))

def check_gcp_storage_public(gcp_credentials: Optional['GCPCredentials'] = None):
    """
    Checks all GCP Cloud Storage buckets for public access.
    Returns a formatted report.
    """
    try:
        storage_client = get_gcp_client(gcp_credentials)
        buckets = list(storage_client.list_buckets())
        
        if not buckets:
            return {
                "status": "SUCCESS",
                "summary": "No GCP Cloud Storage buckets found in the project.",
                "evidence": []
            }

        compliant_buckets = []
        non_compliant_buckets = []

        for bucket in buckets:
            try:
                policy = bucket.get_iam_policy(requested_policy_version=3)
                is_public = False
                public_roles = []
                for binding in policy.bindings:
                    if 'allUsers' in binding['members'] or 'allAuthenticatedUsers' in binding['members']:
                        is_public = True
                        public_roles.append(binding['role'])
                
                if is_public:
                    non_compliant_buckets.append({"bucket_name": bucket.name, "reason": f"Bucket is public with roles: {', '.join(public_roles)}"})
                else:
                    compliant_buckets.append({"bucket_name": bucket.name, "status": "Compliant"})

            except exceptions.Forbidden as e:
                 non_compliant_buckets.append({"bucket_name": bucket.name, "reason": f"Permission denied to check IAM policy: {str(e)}"})


        if not non_compliant_buckets:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(buckets)} GCP buckets. All are compliant.",
                "evidence": compliant_buckets
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(buckets)} GCP buckets. Found {len(non_compliant_buckets)} publicly accessible bucket(s).",
                "evidence": {
                    "compliant_count": len(compliant_buckets),
                    "non_compliant_buckets": non_compliant_buckets
                }
            }

    except FileNotFoundError:
        return {"status": "ERROR", "summary": "GCP service account file not found. Skipping check."}
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}
