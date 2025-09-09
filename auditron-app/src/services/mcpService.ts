import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ToolsResponse, AuditResponse, ToolInfo } from "../types";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// MCP Protocol implementation using proper SDK
class MCPService {
  private client: Client | null = null;
  private transport: any | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log("🚀 Initializing MCP client with remote transport...");

      // Create SSE transport for the remote MCP server
      //   this.transport = new SSEClientTransport(
      //     new URL('https://ztaip-1lictvpa-4xp4r634bq-uc.a.run.app/sse')
      //   );

      this.transport = new SSEClientTransport(
        new URL("http://localhost:8000/mcp")
      );

      // Create MCP client
      this.client = new Client(
        {
          name: "auditron-ui",
          version: "1.0.0",
        },
        {
          capabilities: {
            experimental: {},
            sampling: {},
            roots: { listChanged: false },
            tools: {},
            prompts: {
                listChanged: true
            }
          },
        }
      );

      // Connect to the MCP server
      await this.client.connect(this.transport!);

      this.isInitialized = true;
      console.log("✅ MCP client connected successfully");
    } catch (error) {
      console.error("❌ MCP initialization failed:", error);


      this.isInitialized = false;
      throw error;
    }
  }

  private async ensureConnected(): Promise<void> {
    await this.initialize();
    if (!this.client) {
      throw new Error("MCP client not initialized");
    }
  }

  async listTools(): Promise<ToolsResponse | { error: string }> {
    try {
      await this.ensureConnected();

      console.log("🔄 Listing MCP tools...");
      const response = await this.client!.listTools();

      console.log("✅ MCP tools response:", response);

      // Transform MCP tools response to match our ToolsResponse interface
      const tools = response.tools || [];
      const providers: { aws: ToolInfo[]; gcp: ToolInfo[]; azure: ToolInfo[] } =
        {
          aws: [],
          gcp: [],
          azure: [],
        };

      tools.forEach((tool: any) => {
        const toolName = tool.name.toLowerCase();
        if (toolName.includes("aws")) {
          providers.aws.push({ id: tool.name, description: tool.description });
        } else if (toolName.includes("azure")) {
          providers.azure.push({
            id: tool.name,
            description: tool.description,
          });
        } else if (toolName.includes("gcp")) {
          providers.gcp.push({ id: tool.name, description: tool.description });
        }
      });

      return {
        tool_count: tools.length,
        providers,
      };
    } catch (error) {
      console.warn(
        "⚠️ MCP server not accessible, using mock data for development"
      );
      console.error("MCP Error:", error);

      // Return mock data for development/testing
      return {
        tool_count: 6,
        providers: {
          aws: [
            {
              id: "AWS-S3-PUBLIC-ACCESS-V1",
              description: "Checks for publicly accessible S3 buckets",
            },
            {
              id: "AWS-RDS-PUBLIC-ACCESS-V1",
              description: "Checks for publicly accessible RDS instances",
            },
            {
              id: "AWS-IAM-MFA-V1",
              description: "Checks for MFA enabled on IAM users",
            },
          ],
          azure: [
            {
              id: "AZURE-STORAGE-PUBLIC-ACCESS-V1",
              description: "Checks for publicly accessible storage accounts",
            },
            {
              id: "AZURE-VM-NSG-V1",
              description: "Checks VM network security groups",
            },
          ],
          gcp: [
            {
              id: "GCP-STORAGE-PUBLIC-ACCESS-V1",
              description: "Checks for publicly accessible storage buckets",
            },
          ],
        },
      };
    }
  }

  private async callTool(toolName: string, arguments_: any): Promise<any> {
    await this.ensureConnected();

    console.log(`🔄 Calling MCP tool: ${toolName}`, arguments_);
    const response = await this.client!.callTool({
      name: toolName,
      arguments: arguments_,
    });

    console.log(`✅ Tool response for ${toolName}:`, response);
    return response;
  }

  async auditAWS(
    controls: string[]
  ): Promise<AuditResponse | { error: string }> {
    try {
      const response = await this.callTool("auditAwsAuditAwsPost", {
        controls,
      });

      // Parse the response content
      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === "text") {
          try {
            return JSON.parse(content.text) as AuditResponse;
          } catch {
            return { provider: "aws", results: [] } as AuditResponse;
          }
        }
      }

      return { provider: "aws", results: [] } as AuditResponse;
    } catch (error) {
      console.error("❌ AWS audit error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown AWS audit error",
      };
    }
  }

  async auditAzure(
    controls: string[]
  ): Promise<AuditResponse | { error: string }> {
    try {
      const response = await this.callTool("auditAzureAuditAzurePost", {
        controls,
      });

      // Parse the response content
      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === "text") {
          try {
            return JSON.parse(content.text) as AuditResponse;
          } catch {
            return { provider: "azure", results: [] } as AuditResponse;
          }
        }
      }

      return { provider: "azure", results: [] } as AuditResponse;
    } catch (error) {
      console.error("❌ Azure audit error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown Azure audit error",
      };
    }
  }

  async auditGCP(
    controls: string[]
  ): Promise<AuditResponse | { error: string }> {
    try {
      const response = await this.callTool("auditGcpAuditGcpPost", {
        controls,
      });

      // Parse the response content
      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === "text") {
          try {
            return JSON.parse(content.text) as AuditResponse;
          } catch {
            return { provider: "gcp", results: [] } as AuditResponse;
          }
        }
      }

      return { provider: "gcp", results: [] } as AuditResponse;
    } catch (error) {
      console.error("❌ GCP audit error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown GCP audit error",
      };
    }
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const mcpService = new MCPService();
