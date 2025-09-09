# services/supabase_service.py
import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
import json

def get_supabase_client() -> Client:
    """Create and return Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
    
    return create_client(url, key)

def get_user_credentials(user_id: str) -> Dict[str, Any]:
    """
    Fetch user credentials from Supabase.
    Returns a dictionary with aws_credentials, azure_credentials, and gcp_credentials.
    """
    try:
        supabase = get_supabase_client()
                
        # Query credentials table for the user
        response = supabase.table('credentials').select('*').eq('user_id', user_id).execute()
        
        if not response.data:
            return {
                'aws_credentials': None,
                'azure_credentials': None,
                'gcp_credentials': None
            }
                    
        # Get the first (and should be only) credential record
        cred_data = response.data[0]
        
        # Parse the stored credentials
        credentials = {
            'aws_credentials': None,
            'azure_credentials': None,
            'gcp_credentials': None
        }
        
        # Parse AWS credentials
        if cred_data.get('aws_credentials'):
            credentials['aws_credentials'] = cred_data['aws_credentials']
        
        # Parse Azure credentials
        if cred_data.get('azure_credentials'):
            credentials['azure_credentials'] = cred_data['azure_credentials']
        
        # Parse GCP credentials
        if cred_data.get('gcp_credentials'):
            gcp_creds = cred_data['gcp_credentials']
            # If it's stored as a string, parse it
            if isinstance(gcp_creds.get('service_account_json'), str):
                try:
                    gcp_creds['service_account_json'] = json.loads(gcp_creds['service_account_json'])
                except json.JSONDecodeError:
                    print(f"Warning: Invalid JSON in GCP credentials for user {user_id}")
                    gcp_creds = None
            credentials['gcp_credentials'] = gcp_creds
        
        return credentials
        
    except Exception as e:
        print(f"Error fetching credentials for user {user_id}: {str(e)}")
        return {
            'aws_credentials': None,
            'azure_credentials': None,
            'gcp_credentials': None
        }
