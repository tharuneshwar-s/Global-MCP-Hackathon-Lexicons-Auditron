# Auditron Frontend - AI-Powered Compliance Chat Interface

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-blue?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Integrated-green?style=flat-square&logo=supabase)](https://supabase.com/)

A sophisticated Next.js frontend providing an intuitive chat interface for AI-powered security auditing, compliance assessment, and automated document generation. Built with modern React patterns and seamless backend integration.

---

## 🌟 Key Features

### 💬 Intelligent Chat Interface
- **Conversational Security Auditing**: Natural language interaction for complex security assessments
- **Real-time Streaming Responses**: Live AI responses with typing indicators and progressive content
- **ChatGPT-style Interface**: Modern message bubbles with role-based styling and status indicators
- **Context-Aware Conversations**: Maintains conversation history for intelligent follow-ups and clarifications

### 🛡️ Multi-Cloud Security Auditing
- **AWS Security Assessment**: Comprehensive security posture evaluation across 15+ controls
- **Azure Security Evaluation**: Multi-service security configuration analysis
- **GCP Security Analysis**: Cloud storage security and access control verification
- **Live Security Findings**: Real-time audit results with detailed evidence and remediation steps

### 📄 Professional Document Generation
- **SOC 2 Type II Reports**: Automated SOC compliance documentation with real audit data
- **ISO Standards Reports**: ISO 27001, 9001, and other framework compliance assessments
- **Multi-Framework Reports**: Comprehensive compliance documentation spanning multiple standards
- **Document Download System**: Professional HTML reports with download and preview capabilities
- **Real Audit Integration**: Documents generated from actual security findings, not templates

### 🔧 Advanced AI Integration
- **MCP Protocol Support**: Seamless integration with Model Context Protocol for specialized tools
- **Google Gemini 2.5 Flash**: Advanced AI model with tool-calling capabilities
- **LangChain Framework**: Sophisticated AI agent architecture with memory and reasoning
- **Tool Execution Feedback**: Visual indicators for AI tool usage and execution status
- **Intelligent Error Recovery**: Graceful handling of tool failures and network issues

### 🎨 Premium User Experience
- **Responsive Design**: Fully responsive interface optimized for desktop, tablet, and mobile
- **Custom Scrollbars**: Polished UI elements with smooth scrolling and custom styling
- **Loading States**: Comprehensive visual feedback during AI processing and tool execution
- **Sample Questions**: Interactive quick-start prompts for common audit scenarios
- **Settings Management**: User preferences and configuration through modal dialogs

### 🔐 Enterprise Security & Authentication
- **Supabase Authentication**: Secure user registration, login, and session management
- **Row-Level Security**: User-isolated data with database-level security policies
- **Credential Management**: Secure storage and retrieval of cloud provider credentials
- **Environment Security**: Proper API key management and environment variable handling
- **CORS Configuration**: Secure cross-origin resource sharing for API communication

---

## 🏗️ Application Architecture

### Component Hierarchy
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main chat interface
│   ├── auth/              # Authentication pages
│   └── api/               # API route handlers
├── components/            # React components
│   ├── Header.tsx         # Navigation and user menu
│   ├── Sidebar.tsx        # Chat history and navigation
│   ├── MessageList.tsx    # Chat message display
│   ├── ChatInput.tsx      # Message input with streaming
│   ├── DocumentDownloader.tsx  # Document handling
│   ├── SampleQuestions.tsx     # Quick-start prompts
│   ├── SettingsDialog.tsx      # User preferences
│   └── Loading.tsx        # Loading states and indicators
├── services/              # External service integrations
│   ├── geminiService.ts   # Google Gemini AI client
│   └── mcpService.ts      # MCP protocol client
├── hooks/                 # Custom React hooks
│   ├── useChat.ts         # Chat state management
│   ├── useCredentials.ts  # Credential management
│   └── useSessionManagement.ts  # Session handling
├── contexts/              # React context providers
│   └── AuthContext.tsx    # Authentication state
└── utils/                 # Utility functions
    └── supabase/          # Supabase client configuration
```

### Data Flow Architecture
```
Frontend React App
       ↓
Supabase Auth (User Session)
       ↓
Next.js API Routes (/api/chat)
       ↓
Google Gemini 2.5 Flash
       ↓
MCP Gateway (sequence.ai)
       ↓
Auditron FastAPI Backend
       ↓
Cloud Provider APIs (AWS/Azure/GCP)
       ↓
Security Findings & Documents
       ↓
Document Download System
```

---

## 🚀 Quick Start Guide

### Prerequisites

**Required Software:**
- Node.js 18.0 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Required Services:**
- Supabase project for authentication and data storage
- Google AI API key for Gemini integration
- Auditron backend server (local or deployed)

### Development Setup

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd auditron-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Google AI Configuration
   GOOGLE_AI_API_KEY=your_gemini_api_key
   
   # Backend Integration
   MCP_URL=http://localhost:8000/mcp
   # or for production: https://your-sequence-ai-gateway.com/mcp
   
   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access Application:**
   - Development: http://localhost:3000
   - Authentication: http://localhost:3000/auth
   - API Documentation: http://localhost:3000/api

---

## 🔗 API Integration

### Chat API Endpoint (`/api/chat`)
**Purpose**: Handles AI conversation and streaming responses

**Request Format:**
```typescript
interface ChatRequest {
  message: string;
  sessionId?: string;
  userId: string;
}
```

**Response Format:**
```typescript
interface ChatResponse {
  message: string;
  documentData?: {
    content: string;
    fileName: string;
    fileSize: number;
  };
  toolCalls?: ToolCall[];
  sessionId: string;
}
```

**Streaming Implementation:**
- Server-Sent Events (SSE) for real-time responses
- Progressive content updates with proper parsing
- Document detection and metadata extraction
- Error handling and reconnection logic

### Credentials API Endpoint (`/api/credentials`)
**Purpose**: Manages secure cloud provider credential storage

**Supported Providers:**
- AWS (Access Key ID, Secret Access Key, Region)
- Azure (Subscription ID, Tenant ID, Client credentials)
- GCP (Service Account JSON, Project ID)

**Security Features:**
- Row-Level Security with user isolation
- Encrypted storage in Supabase
- Minimal privilege access patterns
- Automatic credential validation

### Sessions API Endpoint (`/api/sessions`)
**Purpose**: Manages chat session persistence and history

**Features:**
- Session creation and retrieval
- Message history storage
- User-isolated session management
- Automatic cleanup and maintenance

---


## 🔧 Configuration & Environment

### Required Environment Variables

**Supabase Integration:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
```

**AI Integration:**
```env
GOOGLE_AI_API_KEY=AIza...your_gemini_api_key
```

**Backend Integration:**
```env
# Development
MCP_URL=http://localhost:8000/mcp

# Production
MCP_URL=https://your-sequence-ai-gateway.com/mcp
```

**Application Settings:**
```env
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NODE_ENV=production
```

### Optional Configuration
```env
# Analytics and Monitoring
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_DOCUMENT_PREVIEW=true
NEXT_PUBLIC_ENABLE_MULTI_SESSION=true
```


---
