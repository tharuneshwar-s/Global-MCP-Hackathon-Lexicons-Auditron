from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class AWSCredentials(BaseModel):
    access_key_id: str
    secret_access_key: str
    region: str


class AzureCredentials(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str
    subscription_id: str


class GCPCredentials(BaseModel):
    service_account_json: Dict[str, Any]  # The parsed JSON object


class AuditRequest(BaseModel):
    controls: List[str] = Field(..., example=["AWS-S3-PUBLIC-ACCESS-V1"])
    user_id: str = Field(..., description="User ID for credential retrieval")


class AuditResult(BaseModel):
    control_id: str
    status: str
    summary: str
    evidence: Any


class AuditResponse(BaseModel):
    provider: str
    results: List[AuditResult]


class ToolInfo(BaseModel):
    id: str
    description: str


class ToolsResponse(BaseModel):
    tool_count: int
    providers: Dict[str, List[ToolInfo]]
