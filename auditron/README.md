# 🛡️ Auditron Backend - MCP Security Audit Server

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue.svg)](https://modelcontextprotocol.io/)

An enterprise-grade FastAPI backend server that serves as an **MCP (Model Context Protocol) server** for AI-powered, multi-cloud security auditing and compliance assessment. This backend enables direct AI-to-tool communication through the sequence.ai gateway, providing intelligent security posture evaluation across AWS, Azure, and Google Cloud Platform.

## 🔍 Overview

Auditron Backend is the core security audit engine that powers the Auditron platform. It serves as both a traditional REST API and an **MCP server**, enabling AI agents to directly invoke security controls for real-time compliance assessment. The server provides automated security auditing capabilities with user-specific credential management through Supabase integration.

## ✨ Key Features

### 🤖 MCP Server Integration
- **Model Context Protocol Server**: Direct integration with AI agents through sequence.ai gateway
- **Tool-Based Architecture**: Each security control exposed as an AI-callable tool
- **User Context Awareness**: Automatic user credential retrieval based on user_id parameter
- **Streaming Responses**: Real-time audit execution with progress updates

### 🛡️ Multi-Cloud Security Engine
- **AWS Security Auditing**: 15+ comprehensive security controls covering IAM, S3, RDS, and more
- **Azure Security Assessment**: 8+ controls for storage, SQL, networking, and monitoring
- **GCP Security Evaluation**: Cloud storage and expanding service coverage
- **Real-time Evidence Collection**: Live security posture assessment with detailed findings

### 🔐 Enterprise Security
- **Supabase Integration**: Secure user authentication and credential storage
- **Per-User Isolation**: Credentials stored and retrieved per authenticated user
- **Encrypted Storage**: All cloud credentials securely encrypted in database
- **Zero-Config Experience**: Automatic credential retrieval during audits

### 📊 Compliance Framework Support
- **SOC 2 Type II**: Built-in controls mapped to SOC 2 requirements
- **ISO 27001**: Security controls aligned with ISO standards
- **Custom Frameworks**: Extensible architecture for additional compliance standards
- **Evidence Documentation**: Detailed audit trails with evidence collection

## 🏗️ Architecture

### MCP Server Architecture

```mermaid
graph TB
    A[AI Agent - Google Gemini] --> B[LangChain Framework]
    B --> C[MCP Client]
    C --> D[sequence.ai Gateway]
    D --> E[Auditron FastAPI MCP Server]
    E --> F[User Context Service]
    F --> G[Supabase Database]
    E --> H[Multi-Cloud Audit Engine]
    H --> I[AWS SDK]
    H --> J[Azure SDK]
    H --> K[GCP SDK]
    G --> L[User Credentials]
    
    style A fill:#4285F4
    style E fill:#009639
    style G fill:#3ECF8E
```

### Component Structure

```
auditron/
├── main.py                    # FastAPI app with MCP tool integration
├── models.py                  # Pydantic models for requests/responses
├── controls.py                # Security control definitions and mapping
├── requirements.txt           # Python dependencies
├── test.py                   # MCP client testing utilities
├── key/                      # Service account credentials
│   └── auditron-global-mcp-hackathon.json
└── services/                 # Cloud provider services
    ├── __init__.py
    ├── supabase_service.py    # User credential management
    ├── audit_service.py       # Main audit orchestration
    ├── aws_service.py         # AWS security controls
    ├── azure_service.py       # Azure security controls
    └── gcp_service.py         # GCP security controls
```

## 🛠️ Supported Security Controls

### AWS Security Controls (15 Implemented)

**Identity & Access Management:**
- `AWS-IAM-MFA-CONSOLE-V1`: IAM console user MFA configuration
- `AWS-IAM-ROOT-MFA-V1`: Root account MFA validation  
- `AWS-IAM-PASSWORD-POLICY-V1`: Password policy compliance

**Storage & Data Security:**
- `AWS-S3-PUBLIC-ACCESS-V1`: S3 bucket public access detection
- `AWS-EBS-ENCRYPTION-V1`: EBS volume encryption validation
- `AWS-EFS-ENCRYPTION-IN-TRANSIT-V1`: EFS encryption in transit
- `AWS-EBS-SNAPSHOT-PUBLIC-V1`: Public EBS snapshot detection

**Database Security:**
- `AWS-RDS-PUBLIC-ACCESS-V1`: RDS instance public accessibility
- `AWS-RDS-STORAGE-ENCRYPTION-V1`: RDS storage encryption verification
- `AWS-DYNAMODB-PITR-V1`: DynamoDB point-in-time recovery

**Network Security:**
- `AWS-VPC-SG-RESTRICTED-SSH-V1`: Security group SSH restrictions
- `AWS-VPC-FLOW-LOGS-V1`: VPC flow logs configuration

**Logging & Monitoring:**
- `AWS-CLOUDTRAIL-ENABLED-V1`: CloudTrail logging configuration
- `AWS-CONFIG-ENABLED-V1`: AWS Config service enablement
- `AWS-GUARDDUTY-ENABLED-V1`: GuardDuty threat detection

**Encryption & Key Management:**
- `AWS-KMS-KEY-ROTATION-V1`: KMS key rotation automation
- `AWS-SECRETSMANAGER-ROTATION-V1`: Secrets Manager rotation

### Azure Security Controls (8 Implemented)

**Storage Security:**
- `AZURE-STORAGE-SECURE-TRANSFER-V1`: Storage account secure transfer
- `AZURE-STORAGE-PUBLIC-ACCESS-V1`: Storage container public access

**Database Security:**
- `AZURE-SQL-ENCRYPTION-V1`: SQL database transparent data encryption
- `AZURE-SQL-AUDITING-V1`: SQL server auditing configuration

**Network Security:**
- `AZURE-NSG-RULES-V1`: Network security group rules assessment
- `AZURE-VNET-CONFIG-V1`: Virtual network configuration review

**Monitoring & Security:**
- `AZURE-MONITOR-LOG-PROFILE-V1`: Monitor log profile configuration
- `AZURE-SECURITY-CENTER-V1`: Security Center standard tier

### GCP Security Controls (1 Implemented)

**Storage Security:**
- `GCP-STORAGE-PUBLIC-ACCESS-V1`: Cloud Storage bucket public access

## 🚀 Quick Start

### Prerequisites

**Required Software:**
- Python 3.8 or higher
- pip package manager
- Cloud provider CLIs (optional for credential setup)

**Cloud Access Requirements:**
- AWS Account with appropriate IAM permissions
- Azure Account with Security Reader role or higher
- Google Cloud Platform project with APIs enabled

**Service Dependencies:**
- Supabase project for user authentication and credential storage
- sequence.ai account for MCP server deployment (production)

### Local Development Setup

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd auditron
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Supabase:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Start Development Server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access API Documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - OpenAPI JSON: http://localhost:8000/openapi.json

### Production Deployment (sequence.ai)

1. **Prepare Application:**
   ```bash
   # Ensure all dependencies are listed
   pip freeze > requirements.txt
   ```

2. **Deploy to sequence.ai:**
   - Upload FastAPI application to sequence.ai platform
   - Configure environment variables for cloud credentials
   - Set OpenAPI endpoint: `/openapi.json`
   - Note your MCP server endpoint URL

3. **Configure Frontend:**
   ```env
   MCP_URL=https://your-sequence-ai-gateway.com/mcp
   ```

## 📡 API Reference

### MCP Tools (AI-Callable)

**AWS Security Audit Tool:**
```json
{
  "name": "aws_security_audit",
  "description": "Comprehensive AWS security posture assessment",
  "parameters": {
    "user_id": "string (required)",
    "controls": "array of control IDs (optional)"
  }
}
```

**Azure Security Audit Tool:**
```json
{
  "name": "azure_security_audit", 
  "description": "Azure security configuration assessment",
  "parameters": {
    "user_id": "string (required)",
    "controls": "array of control IDs (optional)"
  }
}
```

**GCP Security Audit Tool:**
```json
{
  "name": "gcp_security_audit",
  "description": "Google Cloud Platform security evaluation", 
  "parameters": {
    "user_id": "string (required)",
    "controls": "array of control IDs (optional)"
  }
}
```

### REST API Endpoints

**Health Check:**
- `GET /` - Server health and version information
- `GET /health` - Detailed health status

**Audit Endpoints:**
- `POST /audit/aws` - Execute AWS security audit
- `POST /audit/azure` - Execute Azure security assessment  
- `POST /audit/gcp` - Execute GCP security evaluation

**User Management:**
- `GET /user/{user_id}/credentials` - Retrieve user cloud credentials
- `POST /user/{user_id}/credentials` - Store/update user credentials

**Documentation:**
- `GET /docs` - Interactive Swagger UI documentation
- `GET /redoc` - Alternative ReDoc documentation
- `GET /openapi.json` - OpenAPI specification

### Request/Response Models

**Audit Request:**
```json
{
  "user_id": "string",
  "controls": ["AWS-S3-PUBLIC-ACCESS-V1", "AWS-RDS-PUBLIC-ACCESS-V1"],
  "region": "us-east-1"
}
```

**Audit Response:**
```json
{
  "summary": {
    "total_controls": 15,
    "compliant": 8,
    "non_compliant": 7,
    "risk_level": "medium"
  },
  "findings": [
    {
      "control_id": "AWS-S3-PUBLIC-ACCESS-V1",
      "status": "non-compliant", 
      "risk_level": "high",
      "description": "S3 bucket has public access enabled",
      "evidence": "Bucket 'example-bucket' allows public read access",
      "recommendations": "Enable S3 Block Public Access settings"
    }
  ],
  "execution_time": "45.2s",
  "timestamp": "2025-09-09T10:30:00Z"
}
```

## 🔧 Configuration

### Environment Variables

**Core Application:**
```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Supabase Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloud Provider Settings
AWS_DEFAULT_REGION=us-east-1
AZURE_SUBSCRIPTION_ID=your_azure_subscription
GOOGLE_CLOUD_PROJECT=your_gcp_project
```

**Development vs Production:**
```env
# Development
ENVIRONMENT=development
LOG_LEVEL=debug

# Production  
ENVIRONMENT=production
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

### Supabase Database Schema

**Credentials Table:**
```sql
CREATE TABLE credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aws_credentials JSONB,
  azure_credentials JSONB,
  gcp_credentials JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- User isolation policy
CREATE POLICY "Users can manage their own credentials" ON credentials
  FOR ALL USING (auth.uid() = user_id);
```

## 🧪 Testing & Development

### Running Tests

**Unit Tests:**
```bash
python -m pytest tests/ -v
```

**MCP Client Testing:**
```bash
python test.py
```

**Security Control Testing:**
```bash
python -m pytest tests/test_security_controls.py -v
```

### Development Workflow

1. **Add New Security Control:**
   - Define control in `controls.py`
   - Implement logic in appropriate service file
   - Add to MCP tool registration
   - Write unit tests
   - Update documentation

2. **Test MCP Integration:**
   ```bash
   # Start local server
   uvicorn main:app --reload --port 8000
   
   # Test MCP client connection
   python test.py
   ```

3. **Debug AI Integration:**
   - Check MCP tool registration in `/openapi.json`
   - Verify user_id parameter handling
   - Test credential retrieval from Supabase
   - Monitor audit execution logs

## 🔒 Security Considerations

### Credential Management
- **Encryption**: All user credentials encrypted at rest in Supabase
- **Isolation**: User credentials isolated by Row Level Security policies
- **Access Control**: Service role key required for credential retrieval
- **Audit Trail**: All credential access logged and monitored

### API Security
- **Authentication**: Supabase JWT token validation for user endpoints
- **Rate Limiting**: Built-in FastAPI rate limiting for audit endpoints
- **Input Validation**: Pydantic models validate all request data
- **Error Handling**: Secure error responses without sensitive data exposure

### Cloud Provider Access
- **Least Privilege**: Minimum required permissions for security audits
- **Read-Only**: All audit operations are read-only, no modification capabilities
- **Regional Scope**: Audits limited to specified regions for cost control
- **Timeout Handling**: Automatic timeout for long-running operations

## 📊 Monitoring & Observability

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Audit Trails**: Comprehensive logging of all security operations
- **Performance Metrics**: Execution time tracking for all controls
- **Error Tracking**: Detailed error logging with stack traces

### Health Monitoring
- **Health Endpoints**: `/health` for service status monitoring
- **Dependency Checks**: Supabase and cloud provider connectivity
- **Performance Metrics**: Response time and throughput monitoring
- **Alert Integration**: Ready for Prometheus/Grafana integration

### Production Monitoring
```python
# Example health check response
{
  "status": "healthy",
  "timestamp": "2025-09-09T10:30:00Z",
  "version": "1.0.0",
  "dependencies": {
    "supabase": "connected",
    "aws": "accessible",
    "azure": "accessible", 
    "gcp": "accessible"
  },
  "metrics": {
    "uptime": "7d 14h 32m",
    "total_audits": 1247,
    "avg_response_time": "12.3s"
  }
}
```

### Azure Controls (8 checks)

### Azure Controls (8 checks)
- Storage account public access
- Storage HTTPS enforcement
- SQL database TDE
- Entra ID admin MFA
- Network security group RDP restrictions
- Monitor log profiles
- Defender standard tier

### GCP Controls (1 check)
- Cloud Storage public access

## Installation & Setup

### Prerequisites

- Python 3.8+
- Cloud provider credentials (AWS, Azure, GCP)
- pip or conda package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auditron
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure cloud credentials**
   
   **AWS:**
   ```bash
   # Option 1: AWS CLI
   aws configure
   
   # Option 2: Environment variables
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_DEFAULT_REGION=us-east-1
   ```
   
   **Azure:**
   ```bash
   # Azure CLI login
   az login
   
   # Or set environment variables
   export AZURE_CLIENT_ID=your_client_id
   export AZURE_CLIENT_SECRET=your_client_secret
   export AZURE_TENANT_ID=your_tenant_id
   export AZURE_SUBSCRIPTION_ID=your_subscription_id
   ```
   
   **GCP:**
   ```bash
   # Service account key file
   export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   
   # Or use gcloud CLI
   gcloud auth application-default login
   ```

4. **Create environment file** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Running the Server

### Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Routes

### System Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/`      | Health check endpoint |

### Discovery Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/tools` | List all available audit controls by provider |

### Auditing Routes

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST   | `/audit/aws` | Execute AWS security audit | `{"controls": ["AWS-S3-PUBLIC-ACCESS-V1"]}` |
| POST   | `/audit/azure` | Execute Azure security audit | `{"controls": ["AZURE-STORAGE-PUBLIC-V1"]}` |
| POST   | `/audit/gcp` | Execute GCP security audit | `{"controls": ["GCP-STORAGE-PUBLIC-V1"]}` |

### Example Requests

**List Available Tools:**
```bash
curl -X GET "http://localhost:8000/tools"
```

**Run AWS S3 Audit:**
```bash
curl -X POST "http://localhost:8000/audit/aws" \
  -H "Content-Type: application/json" \
  -d '{"controls": ["AWS-S3-PUBLIC-ACCESS-V1", "AWS-RDS-PUBLIC-ACCESS-V1"]}'
```

**Run Multi-Control Azure Audit:**
```bash
curl -X POST "http://localhost:8000/audit/azure" \
  -H "Content-Type: application/json" \
  -d '{"controls": ["AZURE-STORAGE-PUBLIC-V1", "AZURE-SQL-TDE-V1"]}'
```

### Response Format

```json
{
  "provider": "aws",
  "results": [
    {
      "control_id": "AWS-S3-PUBLIC-ACCESS-V1",
      "status": "FAILURE",
      "summary": "2 out of 5 S3 buckets have public access enabled",
      "evidence": {
        "total_buckets": 5,
        "public_buckets": ["bucket-1", "bucket-2"],
        "details": "..."
      }
    }
  ]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_DEFAULT_REGION` | AWS region for auditing | `us-east-1` |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | - |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | - |
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |

## Testing

### Run Tests
```bash
python test.py
```

### Test MCP Integration
```bash
# The test.py script tests MCP client connectivity
python test.py
```

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid control IDs)
- `401`: Unauthorized (invalid credentials)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Security Notes

- Never commit cloud credentials to version control
- Use IAM roles and service accounts with minimal required permissions
- Regularly rotate access keys and secrets
- Monitor API access logs for unusual activity
