// Types based on the FastAPI backend models

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AuditRequest {
  controls: string[];
}

export interface AuditResult {
  control_id: string;
  status: string;
  summary: string;
  evidence: any;
}

export interface AuditResponse {
  provider: string;
  results: AuditResult[];
}

export interface ToolInfo {
  id: string;
  description: string;
}

export interface ToolsResponse {
  tool_count: number;
  providers: {
    aws: ToolInfo[];
    gcp: ToolInfo[];
    azure: ToolInfo[];
  };
}

export interface MCPToolCall {
  name: string;
  args?: any;
}

export interface MCPResponse {
  result?: any;
  error?: string;
}
