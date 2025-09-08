from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
import asyncio
import os

api_key = "AIzaSyBwhjmyM7GZk5nuqF0PCc6mRUQ5sUMUWwk"

# Configure the MCP client to connect to AI Gateway
client = MultiServerMCPClient(
    {
        "auditron-lang": {
            "transport": "streamable_http",
            "url": "https://ztaip-oaq9lz32-4xp4r634bq-uc.a.run.app/mcp",
        }
    }
)

async def main():
    # Get tools from the MCP server
    """Fetch tools from the MCP server, build an agent, and invoke it with a sample prompt.

    Replace the placeholder URL in `client` with a real MCP gateway URL before running.
    """
    tools = await client.get_tools()

    # Initialize the Google Gemini model
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)
    
    # Create a LangGraph agent with the tools
    agent = create_react_agent(model, tools)

    # Use the agent with a short example prompt. Many agents expect a messages list.
    payload = {"messages": [{"role": "user", "content": "list all tools"}]}

    response = await agent.ainvoke(payload)

    # Print a compact representation of the response
    print("Agent response:")
    print(response)


if __name__ == "__main__":
    asyncio.run(main())