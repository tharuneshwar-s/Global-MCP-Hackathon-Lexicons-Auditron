# Auditron Backend

An AI-powered compliance and audit backend server for automated, multi-cloud security evidence gathering.

## Overview

Auditron Backend is a FastAPI-based service that provides automated security auditing capabilities across AWS, Azure, and Google Cloud Platform. It serves as the core engine for security compliance assessments and evidence collection.

## Features

- **Multi-Cloud Security Auditing**: Comprehensive security checks across AWS, Azure, and GCP
- **RESTful API**: Clean, well-documented API endpoints for integration
- **MCP (Model Context Protocol) Support**: Integration with AI agents for intelligent auditing
- **Real-time Evidence Collection**: Live security posture assessment
- **Compliance Framework Support**: Built-in checks for SOC 2, ISO 27001, and other standards
- **Extensible Architecture**: Modular design for adding new cloud providers and controls

## Folder Structure

```
auditron/
├── main.py                 # FastAPI application and API routes
├── models.py              # Pydantic models for API requests/responses
├── requirements.txt       # Python dependencies
├── test.py               # MCP client testing script
├── key/                  # Cloud provider credentials (not in git)
│   └── auditron-global-mcp-hackathon.json
└── services/             # Cloud provider service modules
    ├── __init__.py
    ├── aws_service.py    # AWS security checks
    ├── azure_service.py  # Azure security checks
    └── gcp_service.py    # GCP security checks
```

## Supported Security Controls

### AWS Controls (15 checks)
- S3 bucket public access
- EBS volume encryption
- EFS encryption in transit
- RDS public accessibility
- RDS storage encryption
- EBS snapshot public access
- DynamoDB point-in-time recovery
- IAM console user MFA
- Root account MFA
- Security group SSH restrictions
- KMS key rotation
- CloudTrail logging
- AWS Config service
- GuardDuty threat detection
- Secrets Manager rotation

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add new security controls in the appropriate service module
4. Update the `SUPPORTED_CONTROLS` mapping in `main.py`
5. Test your changes
6. Submit a pull request

## License

This project is licensed under the MIT License.
