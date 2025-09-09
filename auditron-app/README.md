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

### Production Deployment

1. **Build Application:**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Deploy to Vercel (Recommended):**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Alternative Deployment:**
   ```bash
   npm start
   # Serves production build on port 3000
   ```

---

## 🧩 Core Components

### MessageList Component
**Purpose**: Displays chat conversation with AI assistant and handles document detection

**Key Features:**
- Message rendering with role-based styling (user/assistant)
- Streaming response handling with progressive content updates
- Document detection and download interface integration
- Loading states and error handling
- Auto-scroll to latest messages

**Props Interface:**
```typescript
interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  documentData?: DocumentData;
}
```

### ChatInput Component
**Purpose**: Handles user message input with streaming response management

**Key Features:**
- Auto-expanding textarea with proper sizing
- Send button with loading states
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Real-time character count and input validation
- Streaming response initiation and management

**State Management:**
```typescript
interface ChatInputState {
  input: string;
  isSubmitting: boolean;
  error?: string;
}
```

### DocumentDownloader Component
**Purpose**: Handles compliance document downloads and previews

**Key Features:**
- Document preview in new browser window
- Blob-based download system for HTML reports
- File size formatting and metadata display
- Error handling for failed downloads
- Responsive design for mobile and desktop

**Document Types:**
- SOC 2 Type II Reports
- ISO Compliance Documents
- Comprehensive Security Reports
- Custom Audit Documentation

### SampleQuestions Component
**Purpose**: Provides quick-start prompts for common audit scenarios

**Sample Categories:**
- **AWS Security Audits**: "Perform a comprehensive AWS security audit"
- **Azure Assessments**: "Check Azure security configurations"
- **Compliance Reports**: "Generate an SOC 2 Type II report"
- **Multi-Cloud Audits**: "Audit security across all cloud providers"

### SettingsDialog Component
**Purpose**: User preference management and configuration

**Settings Categories:**
- **Cloud Credentials**: Secure credential storage and management
- **Audit Preferences**: Default regions and control selections
- **UI Preferences**: Theme, notifications, and display options
- **Document Settings**: Default formats and download preferences

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

## 🎨 Styling & Design System

### CSS Architecture
```
src/
├── app/globals.css        # Global styles and CSS variables
├── components/
│   ├── App.css           # Main application styles
│   ├── Header.css        # Navigation styling
│   ├── Sidebar.css       # Sidebar and navigation
│   ├── MessageList.css   # Chat message styling
│   ├── ChatInput.css     # Input component styles
│   ├── Loading.css       # Loading animations
│   ├── SampleQuestions.css  # Quick-start styles
│   └── SettingsDialog.css   # Modal and dialog styles
```

### Design System
**Color Palette:**
- Primary: `#2563eb` (Blue 600)
- Secondary: `#64748b` (Slate 500)
- Success: `#059669` (Emerald 600)
- Warning: `#d97706` (Amber 600)
- Error: `#dc2626` (Red 600)

**Typography:**
- Primary Font: Inter, system fonts
- Code Font: Fira Code, monospace
- Heading Scale: 1.25 ratio
- Line Height: 1.5 for body text

**Responsive Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`
- Large Desktop: `> 1440px`

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

## 📱 User Interface Features

### Chat Interface
- **Message Bubbles**: Distinct styling for user and assistant messages
- **Typing Indicators**: Real-time feedback during AI processing
- **Message Status**: Delivery, read, and error status indicators
- **Rich Content**: Support for code blocks, lists, and formatted text
- **Scroll Management**: Auto-scroll with manual scroll override

### Document Management
- **Download System**: One-click download for generated compliance reports
- **Preview Functionality**: In-browser preview before download
- **Format Support**: HTML reports with embedded styling
- **Metadata Display**: File size, creation date, and document type
- **Error Recovery**: Graceful handling of download failures

### Navigation & Layout
- **Responsive Header**: User menu, logout, and branding
- **Collapsible Sidebar**: Session history and navigation (future feature)
- **Settings Modal**: User preferences and credential management
- **Loading States**: Skeleton screens and progress indicators
- **Error Boundaries**: Graceful error handling with recovery options

---

## 🧪 Testing & Development

### Running Tests

**Development Server:**
```bash
npm run dev
# Access at http://localhost:3000
```

**Production Build:**
```bash
npm run build
npm start
```

**Type Checking:**
```bash
npm run type-check
# or
npx tsc --noEmit
```

**Linting:**
```bash
npm run lint
npm run lint:fix
```

### Development Workflow

1. **Component Development:**
   - Create component in `src/components/`
   - Add corresponding CSS file
   - Export from `src/components/index.ts`
   - Import and use in pages or other components

2. **API Route Development:**
   - Create route in `src/app/api/`
   - Follow Next.js App Router patterns
   - Add proper TypeScript interfaces
   - Test with development server

3. **Hook Development:**
   - Create custom hook in `src/hooks/`
   - Follow React Hook patterns
   - Add TypeScript interfaces
   - Test in component integration

### Debugging Tools

**Browser Developer Tools:**
- React Developer Tools extension
- Network tab for API monitoring
- Console for error tracking
- Application tab for local storage

**VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Auto Rename Tag
- Prettier - Code formatter

---

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Environment variables configured in Vercel dashboard
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
out/

# Environment variables configured in Netlify dashboard
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted
```bash
# Build for production
npm run build

# Start production server
npm start

# Configure reverse proxy (nginx recommended)
```

---

## 🔒 Security Best Practices

### Authentication Security
- **Session Management**: Secure JWT handling with automatic refresh
- **Route Protection**: Server-side authentication validation
- **CSRF Protection**: Built-in Next.js CSRF protection
- **XSS Prevention**: Proper input sanitization and output encoding

### API Security
- **Input Validation**: Comprehensive request validation with TypeScript
- **Rate Limiting**: Protection against abuse and DoS attacks
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Handling**: Secure error responses without information leakage

### Data Security
- **Credential Storage**: Encrypted storage with Row-Level Security
- **User Isolation**: Database-level user data separation
- **Audit Logging**: Comprehensive logging of user actions
- **Data Minimization**: Only collect and store necessary data

---

## 📊 Performance Optimization

### Build Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Built-in bundle analyzer
- **Image Optimization**: Next.js automatic image optimization

### Runtime Performance
- **Lazy Loading**: Component and route lazy loading
- **Memoization**: React.memo and useMemo optimization
- **Virtual Scrolling**: Efficient large list rendering
- **Service Worker**: Offline capability and caching

### Monitoring
- **Core Web Vitals**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error reporting
- **User Analytics**: Privacy-respecting user behavior tracking
- **Performance Metrics**: Real-time performance monitoring

---

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow ESLint and Prettier configurations
2. **TypeScript**: Maintain strict type safety
3. **Component Structure**: Follow established patterns
4. **Testing**: Add tests for new functionality
5. **Documentation**: Update README for significant changes

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes with proper TypeScript types
4. Test thoroughly in development environment
5. Update documentation as needed
6. Submit pull request with detailed description

### Adding New Features
1. **UI Components**: Follow existing design patterns
2. **API Integration**: Use established service patterns
3. **State Management**: Use React hooks and context appropriately
4. **Error Handling**: Implement comprehensive error boundaries
5. **Accessibility**: Ensure WCAG 2.1 AA compliance

---

**🎯 Ready to build intelligent compliance interfaces?**

The Auditron frontend provides a robust foundation for AI-powered security auditing with professional document generation. Start building your next-generation compliance platform today!

## Folder Structure

```
auditron-app/
├── public/
│   └── reports/                 # Generated compliance reports
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts     # Main API endpoint with streaming
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Home page component
│   ├── components/
│   │   ├── App.css              # Main application styles
│   │   ├── ChatInput.tsx        # Chat input component
│   │   ├── ChatInput.css        # Chat input styles
│   │   ├── Header.tsx           # Header component
│   │   ├── Header.css           # Header styles
│   │   ├── MessageList.tsx      # Message display component
│   │   ├── MessageList.css      # Message list styles
│   │   └── index.ts             # Component exports
│   ├── hooks/
│   │   └── useChat.ts           # Chat state management hook
│   ├── services/
│   │   └── geminiService.ts     # Gemini API service
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── tailwindcss.config.js        # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Google AI API key
- Access to Auditron MCP server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auditron-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Next.js Configuration
   NEXT_PUBLIC_URL=http://localhost:3001
   
   # Google AI API Key (required for Gemini AI functionality)
   GOOGLE_API_KEY=your_google_api_key_here
   
   # MCP Server URL (required for MCP tool integration)
   MCP_URL=https://ztaip-ikvkcyhd-4xp4r634bq-uc.a.run.app/mcp
   ```

4. **Get Google AI API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Replace `your_google_api_key_here` in `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
# or
yarn build
yarn start
```

### Using Turbopack (Faster Development)
```bash
npm run dev --turbopack
# or
yarn dev --turbopack
```

## Key Components

### Chat Interface (`useChat` Hook)
- Manages conversation state and message history
- Handles streaming responses from the AI
- Provides loading states and error handling
- Maintains conversation context

### Message Components
- **MessageList**: Displays conversation with streaming support
- **ChatInput**: User input with send functionality
- **Header**: Application header with reset functionality

### API Route (`/api/chat`)
- Handles chat requests with streaming support
- Integrates with Google Gemini AI model
- Manages tool calling and document generation
- Provides conversation history management

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_URL` | Public URL for the app | `http://localhost:3001` | Yes |
| `GOOGLE_API_KEY` | Google AI API key for Gemini | - | Yes |
| `MCP_URL` | MCP server endpoint | - | Yes |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

## Features in Detail

### Document Generation
The app can generate various compliance documents:

- **SOC 2 Type II Reports**: Based on real AWS audit findings
- **ISO Compliance Reports**: Supporting multiple ISO standards
- **Comprehensive Reports**: Multi-framework compliance assessments
- **Professional Formatting**: Clean, printable HTML documents

### AI Capabilities
- **Natural Language Processing**: Understands complex audit requests
- **Context Awareness**: Maintains conversation state
- **Tool Integration**: Seamlessly calls audit and document generation tools
- **Streaming Responses**: Real-time response generation

### Security Auditing
- **AWS Security Checks**: 15+ security controls
- **Multi-Cloud Support**: AWS, Azure, GCP
- **Real-time Results**: Live security posture assessment
- **Evidence Collection**: Detailed findings with actionable insights

## API Integration

The frontend communicates with:
1. **Internal API Route** (`/api/chat`): Main chat functionality
2. **MCP Server**: Tool integration and audit capabilities
3. **Google Gemini**: AI language model for responses

## Styling and Theming

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Styled React components
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface

## Troubleshooting

### Common Issues

1. **API Key Error**
   ```
   Error: GOOGLE_API_KEY environment variable is not set
   ```
   Solution: Ensure your `.env` file contains a valid Google AI API key

2. **MCP Connection Error**
   ```
   Error: MCP_URL environment variable is not set
   ```
   Solution: Verify the MCP server URL in your `.env` file

3. **Build Errors**
   ```
   Module not found: Can't resolve...
   ```
   Solution: Run `npm install` to ensure all dependencies are installed

### Development Tips

- Use the browser dev tools to monitor API calls
- Check the console for streaming response logs
- Use the `/docs` endpoint on the backend for API documentation
- Monitor network tab for real-time streaming data


