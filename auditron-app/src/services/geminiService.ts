interface ChatMessage {
  role: string;
  parts: { text: string }[];
}

interface StreamChunk {
  type: 'status' | 'content' | 'complete' | 'error';
  content: string;
}

class GeminiService {
  private history: ChatMessage[] = [];

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async *sendMessageStream(message: string): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data as StreamChunk;
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in stream:', error);
      yield { type: 'error', content: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  async resetChat(): Promise<void> {
    try {
      await fetch('/api/chat', {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  }
}

export const geminiService = new GeminiService();
