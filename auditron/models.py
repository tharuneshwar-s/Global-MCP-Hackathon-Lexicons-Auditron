from pydantic import BaseModel, Field
from typing import List, Dict, Any


class AuditRequest(BaseModel):
    controls: List[str] = Field(..., example=["AWS-S3-PUBLIC-ACCESS-V1"])


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
