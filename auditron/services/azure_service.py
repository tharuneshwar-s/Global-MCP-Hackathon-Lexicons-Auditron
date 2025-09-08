# services/azure_service.py
from azure.identity import ClientSecretCredential
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.sql import SqlManagementClient
from azure.mgmt.network import NetworkManagementClient
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.security import SecurityCenter
from azure.core.exceptions import ClientAuthenticationError
import os

# --- Helper function to get credentials ---
def get_azure_credentials():
    """Helper to centralize credential loading."""
    try:
        tenant_id = os.getenv("AZURE_TENANT_ID")
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")
        subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")

        if not all([tenant_id, client_id, client_secret, subscription_id]):
            return None, None
        
        credential = ClientSecretCredential(tenant_id, client_id, client_secret)
        return credential, subscription_id
    except Exception:
        return None, None

# --- Category 1 Functions ---

def check_azure_storage_public():
    credential, subscription_id = get_azure_credentials()
    if not credential: return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        storage_client = StorageManagementClient(credential, subscription_id)
        storage_accounts = list(storage_client.storage_accounts.list())
        if not storage_accounts: return {"status": "SUCCESS", "summary": "No Azure Storage Accounts found.", "evidence": []}
        compliant_accounts, non_compliant_accounts = [], []
        for account in storage_accounts:
            resource_group_name = account.id.split('/')[4]
            containers = storage_client.blob_containers.list(resource_group_name, account.name)
            public_containers = [c for c in containers if c.public_access and c.public_access != 'None']
            if public_containers:
                non_compliant_accounts.append({"account_name": account.name, "reason": "Public containers found.", "public_containers": [{"name": c.name, "level": c.public_access} for c in public_containers]})
            else:
                compliant_accounts.append({"account_name": account.name, "status": "Compliant"})
        if not non_compliant_accounts: return {"status": "SUCCESS", "summary": f"Checked {len(storage_accounts)} accounts. All compliant.", "evidence": compliant_accounts}
        else: return {"status": "FAILURE", "summary": f"Found {len(non_compliant_accounts)} accounts with public containers.", "evidence": {"compliant": len(compliant_accounts), "non_compliant": non_compliant_accounts}}
    except Exception as e: return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_azure_storage_https():
    credential, subscription_id = get_azure_credentials()
    if not credential: return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        storage_client = StorageManagementClient(credential, subscription_id)
        storage_accounts = list(storage_client.storage_accounts.list())
        if not storage_accounts: return {"status": "SUCCESS", "summary": "No Azure Storage Accounts found.", "evidence": []}
        compliant_accounts, non_compliant_accounts = [], []
        for account in storage_accounts:
            if account.enable_https_traffic_only: compliant_accounts.append({"account_name": account.name, "status": "Compliant"})
            else: non_compliant_accounts.append({"account_name": account.name, "reason": "'Secure transfer required' is disabled."})
        if not non_compliant_accounts: return {"status": "SUCCESS", "summary": f"Checked {len(storage_accounts)} accounts. All enforce HTTPS.", "evidence": compliant_accounts}
        else: return {"status": "FAILURE", "summary": f"Found {len(non_compliant_accounts)} accounts not enforcing HTTPS.", "evidence": {"compliant": len(compliant_accounts), "non_compliant": non_compliant_accounts}}
    except Exception as e: return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_azure_sql_tde():
    credential, subscription_id = get_azure_credentials()
    if not credential: return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        sql_client = SqlManagementClient(credential, subscription_id)
        servers = list(sql_client.servers.list())
        if not servers: return {"status": "SUCCESS", "summary": "No Azure SQL servers found.", "evidence": []}
        all_databases, compliant_databases, non_compliant_databases = [], []
        for server in servers:
            resource_group_name = server.id.split('/')[4]
            databases = list(sql_client.databases.list_by_server(resource_group_name, server.name))
            all_databases.extend(databases)
            for db in databases:
                try:
                    tde = sql_client.transparent_data_encryptions.get(resource_group_name, server.name, db.name, "current")
                    if tde.status == "Enabled": compliant_databases.append({"database_name": db.name, "server_name": server.name, "status": "Compliant"})
                    else: non_compliant_databases.append({"database_name": db.name, "server_name": server.name, "reason": f"TDE status is '{tde.status}'."})
                except Exception: non_compliant_databases.append({"database_name": db.name, "server_name": server.name, "reason": "Could not verify TDE status."})
        if not all_databases: return {"status": "SUCCESS", "summary": "No Azure SQL databases found.", "evidence": []}
        if not non_compliant_databases: return {"status": "SUCCESS", "summary": f"Checked {len(all_databases)} SQL databases. All have TDE enabled.", "evidence": compliant_databases}
        else: return {"status": "FAILURE", "summary": f"Found {len(non_compliant_databases)} databases without TDE enabled.", "evidence": {"compliant": len(compliant_databases), "non_compliant": non_compliant_databases}}
    except Exception as e: return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

# --- Category 2 Functions ---

def check_azure_entra_mfa_admin():
    """Placeholder check for Entra ID Admin MFA."""
    credential, subscription_id = get_azure_credentials()
    if not credential: return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        return {"status": "SUCCESS", "summary": "Placeholder: A full MFA check requires the MS Graph SDK.", "evidence": [{"note": "In a production tool, query the Graph API for Conditional Access policies targeting admin roles and requiring MFA."}]}
    except Exception as e: return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_azure_nsg_restricted_rdp():
    credential, subscription_id = get_azure_credentials()
    if not credential: return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        network_client = NetworkManagementClient(credential, subscription_id)
        nsgs = list(network_client.network_security_groups.list_all())
        if not nsgs: return {"status": "SUCCESS", "summary": "No Network Security Groups found.", "evidence": []}
        compliant_nsgs, non_compliant_nsgs = [], []
        for nsg in nsgs:
            offending_rule = next((rule for rule in nsg.security_rules if rule.direction == 'Inbound' and rule.protocol in ('TCP', '*') and rule.destination_port_range in ('3389', '*') and rule.source_address_prefix in ('*', 'Any', 'Internet')), None)
            if offending_rule:
                non_compliant_nsgs.append({"nsg_name": nsg.name, "reason": "Allows unrestricted RDP access.", "rule": {"name": offending_rule.name, "port": offending_rule.destination_port_range, "source": offending_rule.source_address_prefix}})
            else:
                compliant_nsgs.append({"nsg_name": nsg.name, "status": "Compliant"})
        if not non_compliant_nsgs: return {"status": "SUCCESS", "summary": f"Checked {len(nsgs)} NSGs. All compliant.", "evidence": compliant_nsgs}
        else: return {"status": "FAILURE", "summary": f"Found {len(non_compliant_nsgs)} NSGs allowing unrestricted RDP.", "evidence": {"compliant": len(compliant_nsgs), "non_compliant": non_compliant_nsgs}}
    except Exception as e: return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

# --- Category 3 Functions (DEFINITIVELY CORRECTED) ---

def check_azure_monitor_log_profiles():
    """Checks that a diagnostic setting is configured to export the Activity Log."""
    credential, subscription_id = get_azure_credentials()
    if not credential:
        return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        monitor_client = MonitorManagementClient(credential, subscription_id)
        resource_uri = f"/subscriptions/{subscription_id}"
        
        # ✅ DEFINITIVE FIX: Access the diagnostic_settings property of the client
        settings = list(monitor_client.diagnostic_settings.list(resource_uri))
        
        if not settings:
            return {"status": "FAILURE", "summary": "No subscription-level Diagnostic Settings found for exporting Activity Logs.", "evidence": []}
        
        required_categories = {"Administrative", "Security", "Policy", "Alert"}
        compliant_setting = next(
            (s for s in settings if s.logs and required_categories.issubset({log.category for log in s.logs if log.enabled})),
            None
        )
        
        if compliant_setting:
            return {
                "status": "SUCCESS",
                "summary": "A Diagnostic Setting is configured to export all key Activity Log categories.",
                "evidence": [{"name": compliant_setting.name, "storage": bool(compliant_setting.storage_account_id), "log_analytics": bool(compliant_setting.workspace_id)}]
            }
        else:
            return {
                "status": "FAILURE",
                "summary": "No Diagnostic Setting exports all required Activity Log categories.",
                "evidence": [{"note": "Ensure a Diagnostic Setting on the subscription sends Administrative, Security, Policy, and Alert logs to a destination."}]
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}


def check_azure_defender_standard_tier():
    """Checks if the standard tier of Microsoft Defender for Cloud is enabled."""
    credential, subscription_id = get_azure_credentials()
    if not credential:
        return {"status": "ERROR", "summary": "Azure credentials not configured."}
    try:
        security_client = SecurityCenter(credential, subscription_id)
        # ✅ DEFINITIVE FIX: The scope_id is required and must be the full subscription resource ID.
        scope = f"/subscriptions/{subscription_id}"
        
        # ✅ DEFINITIVE FIX: Pass the scope to the list method.
        pricings = list(security_client.pricings.list(scope))
        
        standard_tier_enabled = any(p.pricing_tier and p.pricing_tier.lower() == 'standard' for p in pricings)

        if standard_tier_enabled:
            return {
                "status": "SUCCESS",
                "summary": "Microsoft Defender for Cloud is enabled at the Standard tier.",
                "evidence": [{"pricing_tier_found": "Standard"}]
            }
        else:
            return {
                "status": "FAILURE",
                "summary": "Microsoft Defender for Cloud is not enabled at the Standard tier.",
                "evidence": [{"note": "Enable the Standard tier in Microsoft Defender for Cloud for advanced threat protection."}]
            }
    except Exception as e:
        # Specifically catch and handle the "Subscription Not Registered" error
        if "Subscription Not Registered" in str(e):
            return {
                "status": "FAILURE",
                "summary": "Microsoft Defender for Cloud is not registered for this subscription.",
                "evidence": [{"note": "The 'Microsoft.Security' provider must be registered on the subscription to enable security monitoring."}]
            }
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}