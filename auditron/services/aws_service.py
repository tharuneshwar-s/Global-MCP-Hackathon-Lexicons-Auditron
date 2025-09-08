# services/aws_service.py
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import os
from typing import Optional

def get_aws_client(service_name: str, aws_credentials: Optional['AWSCredentials'] = None):
    """Helper function to create AWS client with provided credentials or environment variables."""
    if aws_credentials:
        return boto3.client(
            service_name,
            aws_access_key_id=aws_credentials.access_key_id,
            aws_secret_access_key=aws_credentials.secret_access_key,
            region_name=aws_credentials.region
        )
    else:
        return boto3.client(
            service_name,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )

def check_s3_public_access(aws_credentials: Optional['AWSCredentials'] = None):
    """
    Checks all S3 buckets for public access blocks.
    Returns a formatted report.
    """
    try:
        s3_client = get_aws_client('s3', aws_credentials)
        
        buckets = s3_client.list_buckets().get('Buckets', [])
        if not buckets:
            return {
                "status": "SUCCESS",
                "summary": "No S3 buckets found in the account.",
                "evidence": []
            }

        compliant_buckets = []
        non_compliant_buckets = []

        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                pab_config = s3_client.get_public_access_block(Bucket=bucket_name)['PublicAccessBlockConfiguration']
                is_compliant = all(pab_config.values())
                if is_compliant:
                    compliant_buckets.append({"bucket_name": bucket_name, "status": "Compliant"})
                else:
                    non_compliant_buckets.append({"bucket_name": bucket_name, "reason": "One or more public access block settings are false.", "config": pab_config})
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchPublicAccessBlockConfiguration':
                    non_compliant_buckets.append({"bucket_name": bucket_name, "reason": "No Public Access Block configuration is set."})
                else:
                    non_compliant_buckets.append({"bucket_name": bucket_name, "reason": f"Error checking config: {str(e)}"})

        if not non_compliant_buckets:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(buckets)} S3 buckets. All are compliant.",
                "evidence": compliant_buckets
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(buckets)} S3 buckets. Found {len(non_compliant_buckets)} non-compliant bucket(s).",
                "evidence": {
                    "compliant_count": len(compliant_buckets),
                    "non_compliant_buckets": non_compliant_buckets
                }
            }

    except NoCredentialsError:
        return {"status": "ERROR", "summary": "AWS credentials not found. Skipping check.", "evidence": {}}
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}", "evidence": {"error": str(e)}}


def check_ebs_encryption(aws_credentials: Optional['AWSCredentials'] = None):
    """
    Checks all EBS volumes for encryption.
    Returns a formatted report.
    """
    try:
        # Note: EBS is regional, so we check the configured region.
        ec2_client = get_aws_client('ec2', aws_credentials)
        
        volumes = ec2_client.describe_volumes().get('Volumes', [])
        if not volumes:
            return {
                "status": "SUCCESS",
                "summary": f"No EBS volumes found in the region {os.getenv('AWS_REGION')}.",
                "evidence": []
            }

        compliant_volumes = []
        non_compliant_volumes = []

        for volume in volumes:
            volume_id = volume['VolumeId']
            is_encrypted = volume.get('Encrypted', False)
            
            if is_encrypted:
                compliant_volumes.append({"volume_id": volume_id, "status": "Compliant", "encrypted": True})
            else:
                non_compliant_volumes.append({"volume_id": volume_id, "reason": "Volume is not encrypted."})

        if not non_compliant_volumes:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(volumes)} EBS volumes. All are encrypted.",
                "evidence": compliant_volumes
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(volumes)} EBS volumes. Found {len(non_compliant_volumes)} unencrypted volume(s).",
                "evidence": {
                    "compliant_count": len(compliant_volumes),
                    "non_compliant_volumes": non_compliant_volumes
                }
            }

    except NoCredentialsError:
        return {"status": "ERROR", "summary": "AWS credentials not found. Skipping check.", "evidence": {}}
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}", "evidence": {"error": str(e)}}


def check_efs_encryption_in_transit(aws_credentials: Optional['AWSCredentials'] = None):
    """
    Checks all EFS file systems to ensure encryption in transit is enforced.
    Returns a formatted report.
    """
    try:
        efs_client = get_aws_client('efs', aws_credentials)
        
        filesystems = efs_client.describe_file_systems().get('FileSystems', [])
        if not filesystems:
            return {
                "status": "SUCCESS",
                "summary": f"No EFS file systems found in the region {os.getenv('AWS_REGION')}.",
                "evidence": []
            }

        compliant_filesystems = []
        non_compliant_filesystems = []

        for fs in filesystems:
            fs_id = fs['FileSystemId']
            # We need to describe the policy for the filesystem
            try:
                policy_response = efs_client.describe_file_system_policy(FileSystemId=fs_id)
                policy = policy_response.get('Policy')
                # A common way to enforce encryption is to have a policy that denies non-TLS connections.
                # This is a simplified check for the hackathon.
                if policy and '"aws:SecureTransport": "false"' in policy and '"Effect": "Deny"' in policy:
                     compliant_filesystems.append({"filesystem_id": fs_id, "status": "Compliant", "policy_enforces_tls": True})
                else:
                     non_compliant_filesystems.append({"filesystem_id": fs_id, "reason": "Filesystem policy does not explicitly enforce encryption in transit (TLS)."})
            except ClientError as e:
                if e.response['Error']['Code'] == 'PolicyNotFound':
                    non_compliant_filesystems.append({"filesystem_id": fs_id, "reason": "No filesystem policy is attached, so encryption in transit is not enforced."})
                else:
                    raise

        if not non_compliant_filesystems:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(filesystems)} EFS file systems. All enforce encryption in transit.",
                "evidence": compliant_filesystems
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(filesystems)} EFS file systems. Found {len(non_compliant_filesystems)} that do not enforce encryption in transit.",
                "evidence": {
                    "compliant_count": len(compliant_filesystems),
                    "non_compliant_filesystems": non_compliant_filesystems
                }
            }

    except NoCredentialsError:
        return {"status": "ERROR", "summary": "AWS credentials not found. Skipping check.", "evidence": {}}
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}", "evidence": {"error": str(e)}}


def check_rds_public_access(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks all RDS instances to see if they are publicly accessible."""
    try:
        rds_client = get_aws_client('rds', aws_credentials)
        paginator = rds_client.get_paginator('describe_db_instances')
        pages = paginator.paginate()
        
        all_instances = []
        for page in pages:
            all_instances.extend(page['DBInstances'])

        if not all_instances:
            return {"status": "SUCCESS", "summary": "No RDS instances found.", "evidence": []}

        compliant_instances = []
        non_compliant_instances = []

        for instance in all_instances:
            instance_id = instance['DBInstanceIdentifier']
            is_public = instance.get('PubliclyAccessible', False)
            
            if is_public:
                non_compliant_instances.append({"instance_id": instance_id, "reason": "Instance is publicly accessible."})
            else:
                compliant_instances.append({"instance_id": instance_id, "status": "Compliant"})

        if not non_compliant_instances:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(all_instances)} RDS instances. All are private.",
                "evidence": compliant_instances
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(all_instances)} RDS instances. Found {len(non_compliant_instances)} publicly accessible instance(s).",
                "evidence": {
                    "compliant_count": len(compliant_instances),
                    "non_compliant_instances": non_compliant_instances
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_rds_storage_encryption(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks all RDS instances for storage encryption."""
    try:
        rds_client = get_aws_client('rds', aws_credentials)
        paginator = rds_client.get_paginator('describe_db_instances')
        pages = paginator.paginate()
        
        all_instances = []
        for page in pages:
            all_instances.extend(page['DBInstances'])

        if not all_instances:
            return {"status": "SUCCESS", "summary": "No RDS instances found.", "evidence": []}

        compliant_instances = []
        non_compliant_instances = []

        for instance in all_instances:
            instance_id = instance['DBInstanceIdentifier']
            is_encrypted = instance.get('StorageEncrypted', False)
            
            if is_encrypted:
                compliant_instances.append({"instance_id": instance_id, "status": "Compliant", "encrypted": True})
            else:
                non_compliant_instances.append({"instance_id": instance_id, "reason": "Storage is not encrypted."})

        if not non_compliant_instances:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(all_instances)} RDS instances. All have storage encryption enabled.",
                "evidence": compliant_instances
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(all_instances)} RDS instances. Found {len(non_compliant_instances)} with storage encryption disabled.",
                "evidence": {
                    "compliant_count": len(compliant_instances),
                    "non_compliant_instances": non_compliant_instances
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_ebs_snapshot_public(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks all EBS snapshots to see if they are publicly shared."""
    try:
        ec2_client = get_aws_client('ec2', aws_credentials)
        # We must specify the owner as 'self' to only check our own snapshots
        snapshots = ec2_client.describe_snapshots(OwnerIds=['self']).get('Snapshots', [])

        if not snapshots:
            return {"status": "SUCCESS", "summary": "No EBS snapshots found.", "evidence": []}

        compliant_snapshots = []
        non_compliant_snapshots = []

        for snapshot in snapshots:
            snapshot_id = snapshot['SnapshotId']
            # To check if it's public, we describe the create volume permissions
            attributes = ec2_client.describe_snapshot_attribute(
                SnapshotId=snapshot_id,
                Attribute='createVolumePermission'
            )
            is_public = any(perm.get('Group') == 'all' for perm in attributes.get('CreateVolumePermissions', []))

            if is_public:
                non_compliant_snapshots.append({"snapshot_id": snapshot_id, "reason": "Snapshot is publicly shared."})
            else:
                compliant_snapshots.append({"snapshot_id": snapshot_id, "status": "Compliant"})

        if not non_compliant_snapshots:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(snapshots)} EBS snapshots. None are public.",
                "evidence": compliant_snapshots
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(snapshots)} EBS snapshots. Found {len(non_compliant_snapshots)} publicly shared snapshot(s).",
                "evidence": {
                    "compliant_count": len(compliant_snapshots),
                    "non_compliant_snapshots": non_compliant_snapshots
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_dynamodb_pitr(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks all DynamoDB tables to ensure Point-in-Time Recovery is enabled."""
    try:
        dynamodb_client = get_aws_client('dynamodb', aws_credentials)
        paginator = dynamodb_client.get_paginator('list_tables')
        
        all_tables = []
        for page in paginator.paginate():
            all_tables.extend(page['TableNames'])

        if not all_tables:
            return {"status": "SUCCESS", "summary": "No DynamoDB tables found.", "evidence": []}

        compliant_tables = []
        non_compliant_tables = []

        for table_name in all_tables:
            response = dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr_status = response.get('ContinuousBackupsDescription', {}).get('PointInTimeRecoveryDescription', {}).get('PointInTimeRecoveryStatus')

            if pitr_status == 'ENABLED':
                compliant_tables.append({"table_name": table_name, "status": "Compliant", "pitr_enabled": True})
            else:
                non_compliant_tables.append({"table_name": table_name, "reason": "Point-in-Time Recovery is not enabled."})

        if not non_compliant_tables:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(all_tables)} DynamoDB tables. All have PITR enabled.",
                "evidence": compliant_tables
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(all_tables)} DynamoDB tables. Found {len(non_compliant_tables)} without PITR enabled.",
                "evidence": {
                    "compliant_count": len(compliant_tables),
                    "non_compliant_tables": non_compliant_tables
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_iam_mfa_console(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if IAM users with a console password have MFA enabled."""
    try:
        iam_client = get_aws_client('iam', aws_credentials)
        paginator = iam_client.get_paginator('list_users')
        
        all_users = []
        for page in paginator.paginate():
            all_users.extend(page['Users'])

        if not all_users:
            return {"status": "SUCCESS", "summary": "No IAM users found.", "evidence": []}

        compliant_users = []
        non_compliant_users = []

        for user in all_users:
            user_name = user['UserName']
            try:
                # This call will fail if the user has no console password, which is compliant.
                iam_client.get_login_profile(UserName=user_name)
                
                # If the above call succeeded, the user has a password. Now check for MFA.
                mfa_devices = iam_client.list_mfa_devices(UserName=user_name).get('MFADevices', [])
                if mfa_devices:
                    compliant_users.append({"user_name": user_name, "status": "Compliant", "mfa_enabled": True})
                else:
                    non_compliant_users.append({"user_name": user_name, "reason": "User has a console password but no MFA device."})
            
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    # This user has no console password, so they are compliant in this context.
                    compliant_users.append({"user_name": user_name, "status": "Compliant", "mfa_enabled": "N/A (No Console Password)"})
                else:
                    raise

        if not non_compliant_users:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(all_users)} IAM users. All with console access have MFA enabled.",
                "evidence": compliant_users
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(all_users)} IAM users. Found {len(non_compliant_users)} with console access but no MFA.",
                "evidence": {
                    "compliant_count": len(compliant_users),
                    "non_compliant_users": non_compliant_users
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_iam_root_mfa(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if the AWS account root user has MFA enabled."""
    try:
        iam_client = get_aws_client('iam', aws_credentials)
        summary = iam_client.get_account_summary()
        
        # The summary map returns 1 if MFA is enabled for the root user, 0 otherwise.
        if summary['SummaryMap']['AccountMFAEnabled'] == 1:
            return {
                "status": "SUCCESS",
                "summary": "Root account has MFA enabled.",
                "evidence": [{"account_root": "Compliant", "mfa_enabled": True}]
            }
        else:
            return {
                "status": "FAILURE",
                "summary": "CRITICAL: The root account does not have MFA enabled.",
                "evidence": [{"account_root": "Non-compliant", "reason": "Root account MFA is disabled."}]
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_vpc_sg_restricted_ssh(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks for security groups that allow unrestricted inbound SSH traffic (from 0.0.0.0/0)."""
    try:
        ec2_client = get_aws_client('ec2', aws_credentials)
        sgs = ec2_client.describe_security_groups().get('SecurityGroups', [])

        if not sgs:
            return {"status": "SUCCESS", "summary": "No security groups found.", "evidence": []}

        compliant_sgs = []
        non_compliant_sgs = []

        for sg in sgs:
            is_non_compliant = False
            offending_rule = {}
            for rule in sg.get('IpPermissions', []):
                # Check for TCP port 22 (SSH)
                if rule.get('IpProtocol') == 'tcp' and rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            is_non_compliant = True
                            offending_rule = rule
                            break
                if is_non_compliant:
                    break
            
            if is_non_compliant:
                non_compliant_sgs.append({"group_id": sg['GroupId'], "group_name": sg['GroupName'], "reason": "Allows unrestricted SSH access.", "rule": offending_rule})
            else:
                compliant_sgs.append({"group_id": sg['GroupId'], "group_name": sg['GroupName'], "status": "Compliant"})

        if not non_compliant_sgs:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(sgs)} security groups. None allow unrestricted SSH access.",
                "evidence": compliant_sgs
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(sgs)} security groups. Found {len(non_compliant_sgs)} allowing unrestricted SSH.",
                "evidence": {
                    "compliant_count": len(compliant_sgs),
                    "non_compliant_sgs": non_compliant_sgs
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_kms_key_rotation(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if automatic key rotation is enabled for customer-managed KMS keys."""
    try:
        kms_client = get_aws_client('kms', aws_credentials)
        paginator = kms_client.get_paginator('list_keys')
        
        customer_managed_keys = []
        for page in paginator.paginate():
            for key in page['Keys']:
                key_info = kms_client.describe_key(KeyId=key['KeyId'])
                if key_info['KeyMetadata']['KeyManager'] == 'CUSTOMER':
                    customer_managed_keys.append(key_info['KeyMetadata'])

        if not customer_managed_keys:
            return {"status": "SUCCESS", "summary": "No customer-managed KMS keys found.", "evidence": []}

        compliant_keys = []
        non_compliant_keys = []

        for key in customer_managed_keys:
            key_id = key['KeyId']
            rotation_status = kms_client.get_key_rotation_status(KeyId=key_id)
            
            if rotation_status.get('KeyRotationEnabled', False):
                compliant_keys.append({"key_id": key_id, "key_arn": key['Arn'], "status": "Compliant"})
            else:
                non_compliant_keys.append({"key_id": key_id, "key_arn": key['Arn'], "reason": "Key rotation is not enabled."})

        if not non_compliant_keys:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(customer_managed_keys)} customer-managed KMS keys. All have rotation enabled.",
                "evidence": compliant_keys
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(customer_managed_keys)} KMS keys. Found {len(non_compliant_keys)} without key rotation.",
                "evidence": {
                    "compliant_count": len(compliant_keys),
                    "non_compliant_keys": non_compliant_keys
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_cloudtrail_enabled(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if a multi-region CloudTrail is enabled and logging."""
    try:
        cloudtrail_client = get_aws_client('cloudtrail', aws_credentials)
        trails = cloudtrail_client.describe_trails().get('trailList', [])

        if not trails:
            return {
                "status": "FAILURE",
                "summary": "CRITICAL: No CloudTrail trails are configured in this account.",
                "evidence": []
            }

        compliant_trails = []
        non_compliant_trails = []
        multi_region_trail_exists = False

        for trail in trails:
            trail_arn = trail['TrailARN']
            is_logging = cloudtrail_client.get_trail_status(Name=trail_arn).get('IsLogging', False)
            is_multi_region = trail.get('IsMultiRegionTrail', False)

            if is_logging and is_multi_region:
                multi_region_trail_exists = True
                compliant_trails.append({"trail_arn": trail_arn, "status": "Compliant", "is_logging": True, "is_multi_region": True})
            elif not is_logging:
                non_compliant_trails.append({"trail_arn": trail_arn, "reason": "Trail is not currently logging."})
            elif not is_multi_region:
                 non_compliant_trails.append({"trail_arn": trail_arn, "reason": "Trail is not multi-region."})

        if multi_region_trail_exists:
             return {
                "status": "SUCCESS",
                "summary": "A multi-region, logging CloudTrail was found.",
                "evidence": compliant_trails + non_compliant_trails
            }
        else:
            return {
                "status": "FAILURE",
                "summary": "No multi-region, logging CloudTrail was found. This is a critical security gap.",
                "evidence": non_compliant_trails
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_config_enabled(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if AWS Config is enabled in the region."""
    try:
        config_client = get_aws_client('config', aws_credentials)
        recorders = config_client.describe_configuration_recorders().get('ConfigurationRecorders', [])

        if not recorders:
            return {
                "status": "FAILURE",
                "summary": f"AWS Config is not enabled in the region {os.getenv('AWS_REGION')}.",
                "evidence": []
            }
        
        # Check if at least one recorder is actively recording
        is_recording = any(rec['recordingGroup']['allSupported'] for rec in recorders)

        if is_recording:
             return {
                "status": "SUCCESS",
                "summary": "AWS Config is enabled and recording all supported resource types.",
                "evidence": recorders
            }
        else:
            return {
                "status": "FAILURE",
                "summary": "AWS Config is enabled, but not configured to record all supported resource types.",
                "evidence": recorders
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_guardduty_enabled(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if GuardDuty is enabled in the region."""
    try:
        guardduty_client = get_aws_client('guardduty', aws_credentials)
        detectors = guardduty_client.list_detectors().get('DetectorIds', [])

        if detectors:
            return {
                "status": "SUCCESS",
                "summary": f"GuardDuty is enabled in the region {os.getenv('AWS_REGION')}.",
                "evidence": {"detector_ids": detectors}
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"GuardDuty is not enabled in the region {os.getenv('AWS_REGION')}.",
                "evidence": []
            }
    except ClientError as e:
        # GuardDuty returns a specific error if the account is not subscribed
        if e.response['Error']['Code'] == 'BadRequestException':
             return {
                "status": "FAILURE",
                "summary": f"GuardDuty is not enabled in the region {os.getenv('AWS_REGION')}.",
                "evidence": []
            }
        else:
            return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}

def check_secretsmanager_rotation(aws_credentials: Optional['AWSCredentials'] = None):
    """Checks if secrets in Secrets Manager are configured for automatic rotation."""
    try:
        secrets_client = get_aws_client('secretsmanager', aws_credentials)
        paginator = secrets_client.get_paginator('list_secrets')
        
        all_secrets = []
        for page in paginator.paginate():
            all_secrets.extend(page['SecretList'])

        if not all_secrets:
            return {"status": "SUCCESS", "summary": "No secrets found in Secrets Manager.", "evidence": []}

        compliant_secrets = []
        non_compliant_secrets = []

        for secret in all_secrets:
            secret_arn = secret['ARN']
            # The rotation status is part of the secret's description
            secret_details = secrets_client.describe_secret(SecretId=secret_arn)
            
            if secret_details.get('RotationEnabled', False):
                compliant_secrets.append({"secret_arn": secret_arn, "status": "Compliant", "rotation_enabled": True})
            else:
                non_compliant_secrets.append({"secret_arn": secret_arn, "reason": "Automatic rotation is not enabled."})

        if not non_compliant_secrets:
            return {
                "status": "SUCCESS",
                "summary": f"Checked {len(all_secrets)} secrets. All have rotation enabled.",
                "evidence": compliant_secrets
            }
        else:
            return {
                "status": "FAILURE",
                "summary": f"Checked {len(all_secrets)} secrets. Found {len(non_compliant_secrets)} without automatic rotation.",
                "evidence": {
                    "compliant_count": len(compliant_secrets),
                    "non_compliant_secrets": non_compliant_secrets
                }
            }
    except Exception as e:
        return {"status": "ERROR", "summary": f"An unexpected error occurred: {str(e)}"}
