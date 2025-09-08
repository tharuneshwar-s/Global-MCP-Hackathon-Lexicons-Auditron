'use client';

import { useState, useCallback } from 'react';
import type { Message } from '../types';
import { geminiService } from '../services/geminiService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m Audi, your AI Compliance Co-pilot. I can help you audit your cloud security posture across AWS, Azure, and GCP. What would you like me to check today?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setCurrentStatus('');
    setStreamingMessage('');

    try {
      let accumulatedContent = '';
      
      for await (const chunk of geminiService.sendMessageStream(content)) {
        switch (chunk.type) {
          case 'status':
            setCurrentStatus(chunk.content);
            break;
          case 'content':
            accumulatedContent += chunk.content;
            setStreamingMessage(accumulatedContent);
            break;
          case 'complete':
            setCurrentStatus('');
            // Add the final message to the messages array
            const finalMessage: Message = { role: 'assistant', content: accumulatedContent };
            setMessages(prev => [...prev, finalMessage]);
            setStreamingMessage('');
            break;
          case 'error':
            setError(chunk.content);
            const errorMessage: Message = {
              role: 'assistant',
              content: `🚨 Sorry, I encountered an error: ${chunk.content}\n\nThis might be due to:\n• MCP server connectivity issues\n• Invalid API key\n• Rate limiting\n\nPlease try again in a moment.`
            };
            setMessages(prev => [...prev, errorMessage]);
            setStreamingMessage('');
            break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);

      const errorResponse: Message = {
        role: 'assistant',
        content: `🚨 Sorry, I encountered an error: ${errorMessage}\n\nThis might be due to:\n• MCP server connectivity issues\n• Invalid API key\n• Rate limiting\n\nPlease try again in a moment.`
      };
      setMessages(prev => [...prev, errorResponse]);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
      setCurrentStatus('');
    }
  }, [isLoading]);

  const resetChat = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Hi! I\'m Audi, your AI Compliance Co-pilot. I can help you audit your cloud security posture across AWS, Azure, and GCP. What would you like me to check today?'
      }
    ]);
    setError(null);
    geminiService.resetChat();
  }, []);

  return {
    messages,
    isLoading,
    currentStatus,
    streamingMessage,
    error,
    sendMessage,
    resetChat
  };
};
