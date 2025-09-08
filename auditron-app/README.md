# Auditron App

A modern, AI-powered compliance and audit assistant with an intuitive chat interface for real-time security assessments and compliance document generation.

## Overview

Auditron App is a Next.js-based frontend application that provides an interactive chat interface for security auditing and compliance management. It integrates with the Auditron backend and uses advanced AI capabilities through Google's Gemini model and LangChain framework.

## Features

### 🤖 AI-Powered Chat Interface
- **Conversational Auditing**: Natural language interaction for security assessments
- **Real-time Streaming**: Live response streaming with typing indicators
- **ChatGPT-style UI**: Clean, modern interface with message bubbles and status indicators
- **Context Awareness**: Maintains conversation history for intelligent follow-ups

### 🛡️ Multi-Cloud Security Auditing
- **AWS Security Audit**: Comprehensive security posture assessment
- **Azure Security Checks**: Multi-service security evaluation
- **GCP Security Assessment**: Cloud storage and security analysis
- **Real-time Results**: Live security findings with detailed evidence

### 📋 Compliance Document Generation
- **SOC 2 Type II Reports**: Automated SOC compliance document creation
- **ISO Standards (27001, 9001, etc.)**: ISO compliance assessment reports
- **Comprehensive Reports**: Multi-framework compliance documentation
- **Downloadable Documents**: HTML format reports with professional styling
- **Real Data Integration**: Uses actual audit findings, not mock data

### 🔧 Advanced Tool Integration
- **MCP (Model Context Protocol)**: Integration with specialized audit tools
- **LangChain Framework**: Sophisticated AI agent capabilities
- **Tool Status Indicators**: Visual feedback for tool execution
- **Error Handling**: Graceful error management and user feedback

### 🎨 Modern User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Custom Scrollbars**: Polished UI with custom styling
- **Loading States**: Clear visual feedback during processing
- **Minimalist Design**: Clean, distraction-free interface
- **Dark/Light Theme**: Adaptive design for user preference

### 🔒 Security & Configuration
- **Environment Variables**: Secure API key management
- **CORS Support**: Proper cross-origin resource sharing
- **Type Safety**: Full TypeScript implementation
- **Error Boundaries**: Robust error handling

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Performance Optimization

- Uses Next.js App Router for optimal performance
- Implements streaming for responsive user experience
- Lazy loading for components
- Optimized bundle size with tree shaking

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License.
