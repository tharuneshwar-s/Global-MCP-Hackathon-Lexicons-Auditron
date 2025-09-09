from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from typing import List
from dotenv import load_dotenv

from controls import SUPPORTED_CONTROLS

from services.audit_service_new import run_audit

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



@app.post("/audit/aws", response_model=AuditResponse, tags=["Auditing"])
async def audit_aws(request: AuditRequest):
    """Executes a list of specified audit controls for Amazon Web Services."""
    return await run_audit("aws", request.controls, request.user_id)


@app.post("/audit/azure", response_model=AuditResponse, tags=["Auditing"])
async def audit_azure(request: AuditRequest):
    """Executes a list of specified audit controls for Microsoft Azure."""
    return await run_audit("azure", request.controls, request.user_id)


@app.post("/audit/gcp", response_model=AuditResponse, tags=["Auditing"])
async def audit_gcp(request: AuditRequest):
    """Executes a list of specified audit controls for Google Cloud Platform."""
    return await run_audit("gcp", request.controls, request.user_id)



