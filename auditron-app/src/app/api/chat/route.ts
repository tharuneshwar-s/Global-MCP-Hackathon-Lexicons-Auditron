import { NextRequest, NextResponse } from "next/server";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const API_KEY = process.env.GOOGLE_API_KEY;
const MCP_URL = process.env.MCP_URL;

if (!API_KEY) {
  throw new Error(
    "GOOGLE_API_KEY environment variable is not set. Please add it to your .env file."
  );
}

if (!MCP_URL) {
  throw new Error(
    "MCP_URL environment variable is not set. Please add it to your .env file."
  );
}

// Check if user has credentials for cloud providers
const checkUserCredentials = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { hasCredentials: false, error: "User not authenticated" };
    }

    const { data: credentials, error } = await supabase
      .from("credentials")
      .select("aws_credentials, azure_credentials, gcp_credentials")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      return { hasCredentials: false, error: "Failed to fetch credentials" };
    }

    const hasAnyCredentials = !!(
      credentials?.aws_credentials ||
      credentials?.azure_credentials ||
      credentials?.gcp_credentials
    );

    return {
      hasCredentials: hasAnyCredentials,
      credentials: credentials || null,
      user,
    };
  } catch (error) {
    console.error("Error checking credentials:", error);
    return { hasCredentials: false, error: "Internal error" };
  }
};

// Helper function to get current user ID for inclusion in prompts
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// PDF Generation Functions
function generateSOCReportHTML(params: any): string {
  const { organizationName, assessmentPeriod, controls } = params;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SOC 2 Report - ${organizationName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .control { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .control-title { font-weight: bold; color: #2c3e50; }
        .status { padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        .compliant { background-color: #d4edda; color: #155724; }
        .non-compliant { background-color: #f8d7da; color: #721c24; }
      </style>
      
    </head>
    <body  onload="window.print()">
      <div class="header">
        <h1>SOC 2 Type II Report</h1>
        <h2>${organizationName}</h2>
        <p>Assessment Period: ${assessmentPeriod}</p>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <p>This SOC 2 Type II report evaluates the effectiveness of ${organizationName}'s controls relevant to security, availability, processing integrity, confidentiality, and privacy.</p>
      </div>

      <div class="section">
        <h2>Control Assessment</h2>
        ${controls
          .map(
            (control: any, index: number) => `
          <div class="control">
            <div class="control-title">${control.name}</div>
            <p><strong>Description:</strong> ${control.description}</p>
            <p><strong>Status:</strong> <span class="status ${
              control.status === "compliant" ? "compliant" : "non-compliant"
            }">${control.status.toUpperCase()}</span></p>
            <p><strong>Evidence:</strong> ${control.evidence}</p>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Conclusion</h2>
        <p>The assessment has been completed in accordance with the AICPA's SOC 2 reporting standards.</p>
      </div>
    </body>
    </html>
  `;
}

function generateISOReportHTML(params: any): string {
  const { organizationName, standard, assessmentDate, requirements } = params;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ISO ${standard} Compliance Report - ${organizationName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .requirement { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .req-title { font-weight: bold; color: #2c3e50; }
        .status { padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        .compliant { background-color: #d4edda; color: #155724; }
        .non-compliant { background-color: #f8d7da; color: #721c24; }
        .partial { background-color: #fff3cd; color: #856404; }
      </style>
    </head>
    <body  onload="window.print()">
      <div class="header">
        <h1>ISO ${standard} Compliance Assessment</h1>
        <h2>${organizationName}</h2>
        <p>Assessment Date: ${assessmentDate}</p>
      </div>

      <div class="section">
        <h2>Assessment Scope</h2>
        <p>This report evaluates ${organizationName}'s compliance with ISO ${standard} requirements.</p>
      </div>

      <div class="section">
        <h2>Requirements Assessment</h2>
        ${requirements
          .map(
            (req: any, index: number) => `
          <div class="requirement">
            <div class="req-title">${req.clause}: ${req.title}</div>
            <p><strong>Description:</strong> ${req.description}</p>
            <p><strong>Status:</strong> <span class="status ${
              req.status === "compliant"
                ? "compliant"
                : req.status === "partial"
                ? "partial"
                : "non-compliant"
            }">${req.status.toUpperCase()}</span></p>
            <p><strong>Evidence:</strong> ${req.evidence}</p>
            ${
              req.gaps
                ? `<p><strong>Gaps Identified:</strong> ${req.gaps}</p>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Recommendations</h2>
        <p>Based on the assessment findings, the following recommendations are provided to achieve full compliance.</p>
      </div>
    </body>
    </html>
  `;
}

function generateComplianceReportHTML(params: any): string {
  const { organizationName, reportType, assessmentDate, findings } = params;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprehensive Compliance Report - ${organizationName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .finding { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .finding-title { font-weight: bold; color: #2c3e50; }
        .severity { padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .high { background-color: #f8d7da; color: #721c24; }
        .medium { background-color: #fff3cd; color: #856404; }
        .low { background-color: #d4edda; color: #155724; }
        .summary { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
      </style>
    </head>
    <body  onload="window.print()">
      <div class="header">
        <h1>Comprehensive Compliance Report</h1>
        <h2>${organizationName}</h2>
        <p>Report Type: ${reportType} | Assessment Date: ${assessmentDate}</p>
      </div>

      <div class="section summary">
        <h2>Executive Summary</h2>
        <p>This comprehensive compliance report covers multiple regulatory frameworks and standards applicable to ${organizationName}.</p>
      </div>

      <div class="section">
        <h2>Key Findings</h2>
        ${findings
          .map(
            (finding: any, index: number) => `
          <div class="finding">
            <div class="finding-title">${finding.title}</div>
            <p><strong>Severity:</strong> <span class="severity ${finding.severity.toLowerCase()}">${finding.severity.toUpperCase()}</span></p>
            <p><strong>Description:</strong> ${finding.description}</p>
            <p><strong>Impact:</strong> ${finding.impact}</p>
            <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Conclusion and Next Steps</h2>
        <p>The assessment provides a comprehensive view of the organization's compliance posture across multiple frameworks.</p>
      </div>
    </body>
    </html>
  `;
}

// Document Generation Tools
const generateSOCTool = tool(
  async ({ organizationName, auditPeriod, controls, findings }) => {
    try {
      // Transform the data to match our HTML generation function
      const transformedControls = findings.map(
        (finding: any, index: number) => ({
          name: finding.control,
          description: `Assessment of ${finding.control} control`,
          status:
            finding.status === "compensating-control"
              ? "compliant"
              : finding.status,
          evidence: finding.description,
        })
      );

      const htmlContent = generateSOCReportHTML({
        organizationName,
        assessmentPeriod: auditPeriod,
        controls: transformedControls,
      });

      // Generate filename for reference (but don't save file)
      const filename = `SOC2_Report_${organizationName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.html`;

      return {
        success: true,
        documentType: "SOC",
        content: htmlContent,
        fileName: filename,
        fileSize: `${Math.round(htmlContent.length / 1024)} KB`,
        message: `✅ SOC 2 compliance document generated successfully for ${organizationName}`,
        summary: `Generated SOC 2 Type II report with ${findings.length} control assessments`,
        reportData: {
          organizationName,
          auditPeriod,
          controlsAssessed: findings.length,
          complianceStatus: transformedControls.filter(c => c.status === 'compliant').length,
          nonCompliantControls: transformedControls.filter(c => c.status === 'non-compliant').length
        }
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to generate SOC document: ${errorMessage}`,
        documentType: "SOC",
      };
    }
  },
  {
    name: "generate_soc_document",
    description:
      "Generate a SOC 2 Type II compliance document in HTML format using REAL audit findings. Returns the complete HTML content in the response buffer instead of saving to file. Must be called AFTER aws_security_audit to use actual compliance data, not sample data.",
    schema: z.object({
      organizationName: z
        .string()
        .describe("Name of the organization being audited"),
      auditPeriod: z
        .string()
        .describe("Audit period (e.g., 'January 1, 2024 - December 31, 2024')"),
      controls: z
        .array(z.string())
        .describe(
          "List of SOC controls assessed - derive from real audit findings"
        ),
      findings: z
        .array(
          z.object({
            control: z.string(),
            status: z.enum([
              "compliant",
              "non-compliant",
              "compensating-control",
            ]),
            description: z.string(),
            recommendation: z.string().optional(),
          })
        )
        .describe(
          "REAL audit findings for each control - map from actual AWS audit results"
        ),
    }),
  }
);

const generateISOTool = tool(
  async ({
    organizationName,
    standard,
    auditPeriod,
    requirements,
    compliance,
  }) => {
    try {
      // Transform the data to match our HTML generation function
      const transformedRequirements = compliance.map(
        (comp: any, index: number) => ({
          clause: comp.requirement,
          title: `Requirement ${comp.requirement}`,
          description:
            requirements[index] || `Assessment of ${comp.requirement}`,
          status: comp.status === "not-applicable" ? "compliant" : comp.status,
          evidence: comp.evidence || "Assessment completed",
          gaps: comp.notes || "",
        })
      );

      const htmlContent = generateISOReportHTML({
        organizationName,
        standard,
        assessmentDate: auditPeriod,
        requirements: transformedRequirements,
      });

      // Generate filename for reference (but don't save file)
      const filename = `ISO_${standard.replace(
        /\s+/g,
        "_"
      )}_Report_${organizationName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.html`;

      return {
        success: true,
        documentType: "ISO",
        content: htmlContent,
        fileName: filename,
        fileSize: `${Math.round(htmlContent.length / 1024)} KB`,
        message: `✅ ${standard} compliance document generated successfully for ${organizationName}`,
        summary: `Generated ${standard} assessment with ${compliance.length} requirement evaluations`,
        reportData: {
          organizationName,
          standard,
          auditPeriod,
          requirementsAssessed: compliance.length,
          compliantRequirements: transformedRequirements.filter(r => r.status === 'compliant').length,
          nonCompliantRequirements: transformedRequirements.filter(r => r.status === 'non-compliant').length
        }
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to generate ISO document: ${errorMessage}`,
        documentType: "ISO",
      };
    }
  },
  {
    name: "generate_iso_document",
    description:
      "Generate an ISO compliance document (ISO 27001, ISO 9001, etc.) in HTML format using REAL audit data. Returns the complete HTML content in the response buffer instead of saving to file. Must be called AFTER aws_security_audit to use actual compliance status.",
    schema: z.object({
      organizationName: z
        .string()
        .describe("Name of the organization being audited"),
      standard: z
        .string()
        .describe("ISO standard (e.g., 'ISO 27001', 'ISO 9001')"),
      auditPeriod: z.string().describe("Audit period"),
      requirements: z
        .array(z.string())
        .describe(
          "List of ISO requirements assessed - derive from real audit scope"
        ),
      compliance: z
        .array(
          z.object({
            requirement: z.string(),
            status: z.enum(["compliant", "non-compliant", "not-applicable"]),
            evidence: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .describe(
          "REAL compliance status for each requirement - map from actual audit findings"
        ),
    }),
  }
);

const generateComplianceReportTool = tool(
  async ({ organizationName, frameworks, auditData, recommendations }) => {
    try {
      // Transform the data to match our HTML generation function
      const transformedFindings = recommendations.map(
        (rec: any, index: number) => ({
          title: `Priority ${rec.priority.toUpperCase()}: ${rec.framework}`,
          severity: rec.priority,
          description: rec.description,
          impact: `Affects ${rec.framework} compliance framework`,
          recommendation: rec.timeline
            ? `${rec.description} (Timeline: ${rec.timeline})`
            : rec.description,
        })
      );

      const htmlContent = generateComplianceReportHTML({
        organizationName,
        reportType: frameworks.join(", "),
        assessmentDate: new Date().toLocaleDateString(),
        findings: transformedFindings,
      });

      // Generate filename for reference (but don't save file)
      const filename = `Comprehensive_Compliance_Report_${organizationName.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.html`;

      return {
        success: true,
        documentType: "COMPREHENSIVE",
        content: htmlContent,
        fileName: filename,
        fileSize: `${Math.round(htmlContent.length / 1024)} KB`,
        message: `✅ Comprehensive compliance report generated successfully for ${organizationName}`,
        summary: `Generated multi-framework report covering ${frameworks.join(
          ", "
        )} with ${recommendations.length} findings`,
        reportData: {
          organizationName,
          frameworks,
          assessmentDate: new Date().toLocaleDateString(),
          totalFindings: recommendations.length,
          highPriorityFindings: recommendations.filter(r => r.priority === 'high').length,
          mediumPriorityFindings: recommendations.filter(r => r.priority === 'medium').length,
          lowPriorityFindings: recommendations.filter(r => r.priority === 'low').length,
          auditSummary: auditData
        }
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to generate compliance report: ${errorMessage}`,
        documentType: "COMPREHENSIVE",
      };
    }
  },
  {
    name: "generate_compliance_report",
    description:
      "Generate a comprehensive compliance report covering multiple frameworks using REAL audit data. Returns the complete HTML content in the response buffer instead of saving to file. Must be called AFTER aws_security_audit to use actual findings.",
    schema: z.object({
      organizationName: z.string().describe("Name of the organization"),
      frameworks: z
        .array(z.string())
        .describe("Compliance frameworks covered - based on real audit scope"),
      auditData: z
        .object({
          totalControls: z.number(),
          compliantControls: z.number(),
          criticalFindings: z.number(),
          riskLevel: z.enum(["low", "medium", "high", "critical"]),
        })
        .describe("REAL summary audit data from actual security audit results"),
      recommendations: z
        .array(
          z.object({
            priority: z.enum(["high", "medium", "low"]),
            framework: z.string(),
            description: z.string(),
            timeline: z.string().optional(),
          })
        )
        .describe(
          "REAL implementation recommendations based on actual audit findings"
        ),
    }),
  }
);


class GeminiService {
  private mcpClient: any;
  private langchainModel: ChatGoogleGenerativeAI;
  private agent: any;
  private conversationHistory: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [];
  private lastDocumentData: {
    content: string;
    fileName: string;
    fileSize: string;
    documentType: string;
  } | null = null;

  constructor() {
    this.langchainModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.01,
      apiKey: API_KEY,
      streaming: true, // Enable streaming for the model
    });

    // Configure the MCP client
    this.mcpClient = new MultiServerMCPClient({
      "auditron-lang": {
        transport: "http",
        url: MCP_URL!,
      },
    });

    this.initializeAgent();
  }

  // Add methods to manage conversation history
  private addToHistory(
    role: "user" | "assistant" | "system",
    content: string
  ): void {
    this.conversationHistory.push({ role, content });
    // Keep only the last 20 messages to prevent context overflow
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  private getConversationHistory(): Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> {
    return [...this.conversationHistory];
  }

  // Public method to get history length for logging
  public getHistoryLength(): number {
    return this.conversationHistory.length;
  }

  // Public method to get conversation history for debugging
  public getHistory(): Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> {
    return this.getConversationHistory();
  }

  private clearHistory(): void {
    this.conversationHistory = [];
  }

  // Methods to manage document data
  getLastDocumentData() {
    return this.lastDocumentData;
  }

  setDocumentData(data: {
    content: string;
    fileName: string;
    fileSize: string;
    documentType: string;
  }) {
    this.lastDocumentData = data;
  }

  clearDocumentData() {
    this.lastDocumentData = null;
  }

  async initializeAgent() {
    try {
      console.log("🔄 Initializing agent with MCP server...");
      
      // Get tools from the MCP server with timeout and retry
      let mcpTools = [];
      let retryCount = 0;
      const maxRetries = 3;
      const timeout = 10000; // 10 seconds timeout

      while (retryCount < maxRetries) {
        try {
          console.log(`🔗 Attempting to connect to MCP server (attempt ${retryCount + 1}/${maxRetries})...`);
          
          // Create a promise with timeout
          const toolsPromise = this.mcpClient.getTools();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MCP connection timeout')), timeout)
          );
          
          mcpTools = await Promise.race([toolsPromise, timeoutPromise]);
          console.log(`✅ Successfully connected to MCP server. Found ${mcpTools.length} tools.`);
          break;
        } catch (error) {
          retryCount++;
          console.error(`❌ MCP connection attempt ${retryCount} failed:`, error);
          
          if (retryCount >= maxRetries) {
            console.warn("⚠️ Max retries reached. Proceeding with custom tools only.");
            mcpTools = []; // Use empty array if MCP fails
            break;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Add our custom document generation tools
      const customTools = [
        generateSOCTool,
        generateISOTool,
        generateComplianceReportTool,
      ];

      // Use all available tools (MCP + custom)
      const allTools = [...mcpTools, ...customTools];
      console.log(`🛠️ Total tools available: ${allTools.length} (${mcpTools.length} MCP + ${customTools.length} custom)`);

      // Create a LangGraph agent with all tools
      this.agent = createReactAgent({
        llm: this.langchainModel,
        tools: allTools,
      });

      console.log("✅ LangChain agent initialized successfully");
      
      if (mcpTools.length === 0) {
        console.warn("⚠️ Warning: No MCP tools available. Audit functions may be limited.");
      }
    } catch (error) {
      console.error("❌ Failed to initialize LangChain agent:", error);
      
      // Fallback: create agent with custom tools only
      try {
        console.log("🔄 Attempting fallback initialization with custom tools only...");
        const customTools = [
          generateSOCTool,
          generateISOTool,
          generateComplianceReportTool,
        ];
        
        this.agent = createReactAgent({
          llm: this.langchainModel,
          tools: customTools,
        });
        
        console.log("✅ Fallback agent initialized with custom tools only");
      } catch (fallbackError) {
        console.error("❌ Fallback initialization also failed:", fallbackError);
        throw fallbackError;
      }
    }
  }

  async *sendMessageStream(
    message: string
  ): AsyncGenerator<{ type: string; content: string }, void, unknown> {
    // Add user message to history

    await this.initializeAgent();

    this.addToHistory("user", message);

    // Get current user ID for tool calls
    const userId = await getCurrentUserId();
    if (!userId) {
      yield {
        type: "error",
        content: "⚠️ User not authenticated. Please log in to access audit tools.",
      };
      return;
    }

    // Use LangChain agent if available
    if (this.agent) {
      yield { type: "status", content: "Processing your request..." };

      const systemInstructions = `You are Auditron, an AI-powered compliance and audit assistant. You have access to powerful tools for generating compliance documents and performing security audits.

IMPORTANT: The current authenticated user ID is: ${userId}

When calling ANY audit tools (aws_security_audit, azure_security_audit, gcp_security_audit), you MUST include the user_id parameter with the value: ${userId}

Available tools:
1. For SOC 2 reports: Use the generate_soc_document tool
2. For ISO standards (27001, 9001, etc.): Use the generate_iso_document tool  
3. For comprehensive multi-framework reports: Use the generate_compliance_report tool
4. For AWS security audits: Use the aws_security_audit tool with user_id: ${userId}
5. For Azure security audits: Use the azure_security_audit tool with user_id: ${userId}
6. For GCP security audits: Use the gcp_security_audit tool with user_id: ${userId}

CRITICAL INSTRUCTIONS:
1. ALWAYS pass user_id: "${userId}" when calling audit tools
2. ONLY use real data from actual tool results. DO NOT use mock or sample data.
3. Provide CONCISE responses with report summaries - do NOT stream long document content.
4. When document generation tools return HTML content, present them as clean summaries with key findings.
5. The audit tools will automatically use the user's stored credentials based on the user_id.
6. Document generation tools return HTML content in the response buffer - present key metrics and findings instead of raw HTML.

RESPONSE FORMAT FOR DOCUMENT GENERATION:
- Brief summary of what was generated
- Key findings/metrics (e.g., "Found X non-compliant controls")
- Report metadata (file name, size, organization details)
- Next steps or recommendations
- DO NOT include the full HTML content in the response

WORKFLOW FOR COMPLIANCE REPORTS:
1. When user asks for SOC 2 or compliance reports, FIRST run the appropriate security audit tool (aws_security_audit, azure_security_audit, or gcp_security_audit) to get real audit data
2. Then use the real audit findings to generate SOC 2 or ISO reports with actual compliance status
3. Present results as clean summaries with key findings, NOT full document content

EXAMPLE GOOD RESPONSE:
"✅ SOC 2 Report Generated Successfully

**Summary:** 
- Organization: [Company Name]
- Assessment Period: January 1, 2024 - December 31, 2024
- Controls Assessed: 5
- Non-Compliant Controls: 3 (Critical issues found)

**Key Findings:**
- CloudTrail logging disabled (Critical)
- RDS instances publicly accessible (High Risk)
- S3 buckets with public access (High Risk)

**� Report Details:**
File: SOC2_Report_Company_2024-09-08.html (45 KB)
Content: Complete HTML report with detailed findings and evidence

**Next Steps:** Priority remediation of critical logging and access controls required for compliance."

DO NOT include full HTML content or long text in responses. Keep responses clean and actionable.`;

      // Build message history for context
      const messageHistory = [
        { role: "system", content: systemInstructions },
        ...this.getConversationHistory(),
      ];

      const payload = {
        messages: messageHistory,
      };

      console.log("Sending message to agent:", message);
      console.log("User ID for tool calls:", userId);

      try {
        // Use streaming with LangGraph agent
        const stream = await this.agent.stream(payload, {
          streamMode: "messages",
        });

        let isToolCalling = false;
        let assistantResponse = "";
        let capturedDocumentData: any = null;

        for await (const chunk of stream) {
          // Handle the chunk array structure - chunk is an array with message and metadata
          if (Array.isArray(chunk) && chunk.length > 0) {
            // console.log("\n\nStream chunk: ", chunk[0]);

            // console.log("\n\n\tAIMessageChunk: ", chunk[0], typeof chunk[0]);

            console.log("\n\n**************************====");

            console.log("id: ", chunk[0]?.id);
            console.log("content: ", chunk[0]?.content);
            console.log("additional_kwargs: ", chunk[0]?.name);
            console.log("tool_calls: ", chunk[0]?.tool_calls);
            console.log("tool_responses: ", chunk[0]?.tool_responses);
            console.log("type: ", chunk[0]?.type);

            console.log("**************************====\n\n");

            const message = chunk[0]; // First element is usually the message

            // Check for tool responses that might contain document data
            if (message && message.tool_responses && Array.isArray(message.tool_responses)) {
              for (const toolResponse of message.tool_responses) {
                if (toolResponse.content && typeof toolResponse.content === 'string') {
                  try {
                    const responseData = JSON.parse(toolResponse.content);
                    if (responseData.content && responseData.fileName && responseData.documentType) {
                      capturedDocumentData = {
                        content: responseData.content,
                        fileName: responseData.fileName,
                        fileSize: responseData.fileSize || 'Unknown size',
                        documentType: responseData.documentType
                      };
                      console.log('📄 Captured document data:', capturedDocumentData.fileName);
                    }
                  } catch (e) {
                    // Not JSON or not document data, continue
                  }
                }
              }
            }

            // Also check if the content itself is a tool response with document data
            if (message && message.content && typeof message.content === 'string') {
              try {
                const responseData = JSON.parse(message.content);
                if (responseData.success && responseData.content && responseData.fileName && responseData.documentType) {
                  capturedDocumentData = {
                    content: responseData.content,
                    fileName: responseData.fileName,
                    fileSize: responseData.fileSize || 'Unknown size',
                    documentType: responseData.documentType
                  };
                  console.log('📄 Captured document data from content:', capturedDocumentData.fileName);
                }
              } catch (e) {
                // Not JSON, continue with normal processing
              }
            }

            if (
              message &&
              message.name &&
              message.content &&
              typeof message.content === "string"
            ) {
              const toolName = message.name;
              
              // Check if this is a document generation tool
              if (toolName && (toolName.includes('generate_soc_document') || 
                              toolName.includes('generate_iso_document') || 
                              toolName.includes('generate_compliance_report'))) {
                
                try {
                  const responseData = JSON.parse(message.content);
                  if (responseData.success && responseData.content && responseData.fileName && responseData.documentType) {
                    capturedDocumentData = {
                      content: responseData.content,
                      fileName: responseData.fileName,
                      fileSize: responseData.fileSize || 'Unknown size',
                      documentType: responseData.documentType
                    };
                    console.log('📄 Captured document data from tool:', capturedDocumentData.fileName);
                  }
                } catch (e) {
                  console.error('Failed to parse tool response as JSON:', e);
                }
              }
              
              yield {
                type: "status",
                content: `📊 Processing ${toolName} results...`,
              };
              isToolCalling = false;
            }
            // Check if this is an AI message with content
            else if (
              message &&
              message.content &&
              typeof message.content === "string"
            ) {
              if (isToolCalling) {
                yield {
                  type: "status",
                  content: "Generating response from analysis...",
                };
                isToolCalling = false;
              }

              const content = message.content;
              assistantResponse += content;

              yield { type: "content", content: content };
            }
          }
        }

        // Store captured document data
        if (capturedDocumentData) {
          this.setDocumentData(capturedDocumentData);
          console.log('🎉 Document data stored successfully:', capturedDocumentData.fileName);
        } else {
          console.log('❌ No document data captured in this stream');
        }

        // Add assistant response to history
        if (assistantResponse) {
          this.addToHistory("assistant", assistantResponse);
        }

        yield { type: "complete", content: "" };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        yield {
          type: "error",
          content: `Error during analysis: ${errorMessage}`,
        };
      }
    } else {
      yield {
        type: "error",
        content: "Agent initialization failed. Please try again.",
      };
    }
  }

  async sendMessage(message: string): Promise<string> {
    // Add user message to history
    this.addToHistory("user", message);

    // Get current user ID for tool calls
    const userId = await getCurrentUserId();
    if (!userId) {
      return "⚠️ User not authenticated. Please log in to access audit tools.";
    }

    // Use LangChain agent if available
    if (this.agent) {
      const systemInstructions = `You are Auditron, an AI-powered compliance and audit assistant. You have access to powerful tools for generating compliance documents and performing security audits.

IMPORTANT: The current authenticated user ID is: ${userId}

When calling ANY audit tools (aws_security_audit, azure_security_audit, gcp_security_audit), you MUST include the user_id parameter with the value: ${userId}

Available tools:
1. For SOC 2 reports: Use the generate_soc_document tool
2. For ISO standards (27001, 9001, etc.): Use the generate_iso_document tool  
3. For comprehensive multi-framework reports: Use the generate_compliance_report tool
4. For AWS security audits: Use the aws_security_audit tool with user_id: ${userId}
5. For Azure security audits: Use the azure_security_audit tool with user_id: ${userId}
6. For GCP security audits: Use the gcp_security_audit tool with user_id: ${userId}

CRITICAL INSTRUCTIONS:
1. ALWAYS pass user_id: "${userId}" when calling audit tools
2. ONLY use real data from actual tool results. DO NOT use mock or sample data.
3. Provide CONCISE responses with report summaries - do NOT stream long document content.
4. When document generation tools return HTML content, present them as clean summaries with key findings.
5. The audit tools will automatically use the user's stored credentials based on the user_id.
6. Document generation tools return HTML content in the response buffer - present key metrics and findings instead of raw HTML.

RESPONSE FORMAT FOR DOCUMENT GENERATION:
- Brief summary of what was generated
- Key findings/metrics (e.g., "Found X non-compliant controls")
- Report metadata (file name, size, organization details)
- Next steps or recommendations
- DO NOT include the full HTML content in the response

WORKFLOW FOR COMPLIANCE REPORTS:
1. When user asks for SOC 2 or compliance reports, FIRST run the appropriate security audit tool (aws_security_audit, azure_security_audit, or gcp_security_audit) to get real audit data
2. Then use the real audit findings to generate SOC 2 or ISO reports with actual compliance status
3. Present results as clean summaries with key findings, NOT full document content

EXAMPLE GOOD RESPONSE:
"✅ SOC 2 Report Generated Successfully

**Summary:** 
- Organization: [Company Name]
- Assessment Period: January 1, 2024 - December 31, 2024
- Controls Assessed: 5
- Non-Compliant Controls: 3 (Critical issues found)

**Key Findings:**
- CloudTrail logging disabled (Critical)
- RDS instances publicly accessible (High Risk)
- S3 buckets with public access (High Risk)

**� Report Details:**
File: SOC2_Report_Company_2024-09-08.html (45 KB)
Content: Complete HTML report with detailed findings and evidence

**Next Steps:** Priority remediation of critical logging and access controls required for compliance."

DO NOT include full HTML content or long text in responses. Keep responses clean and actionable.`;

      // Build message history for context
      const messageHistory = [
        { role: "system", content: systemInstructions },
        ...this.getConversationHistory(),
      ];

      const payload = {
        messages: messageHistory,
      };

      const response = await this.agent.invoke(payload);

      // Extract the response content
      const responseText =
        response?.messages?.slice(-1)[0]?.content || "No response from agent";

      // Add assistant response to history
      this.addToHistory("assistant", responseText);

      return responseText;
    }

    return "Sorry, the agent is not initialized yet. Please try again.";
  }

  resetChat(): void {
    // Clear conversation history
    this.clearHistory();

    if (this.agent) {
      // Reset agent if needed
      this.initializeAgent();
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();

// Initialize agent endpoint
export async function PATCH(request: NextRequest) {
  try {
    await geminiService.initializeAgent();
    return NextResponse.json({
      success: true,
      message: "Agent initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing agent:", error);
    return NextResponse.json(
      { error: "Failed to initialize agent" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, stream } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Received message:", message);
    console.log(
      "Current conversation history length:",
      geminiService.getHistoryLength()
    );

    // Handle streaming requests
    if (stream) {
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of geminiService.sendMessageStream(
              message
            )) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error occurred";
            const errorData = `data: ${JSON.stringify({
              type: "error",
              content: errorMessage,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle non-streaming requests (fallback)
    const response = await geminiService.sendMessage(message);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    geminiService.resetChat();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'document') {
      // Return the last generated document data
      const documentData = geminiService.getLastDocumentData();
      return NextResponse.json({ documentData });
    }
    
    if (action === 'history') {
      const history = geminiService.getHistory();
      return NextResponse.json({
        history,
        length: history.length,
        message: "Conversation history retrieved successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error in GET endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
