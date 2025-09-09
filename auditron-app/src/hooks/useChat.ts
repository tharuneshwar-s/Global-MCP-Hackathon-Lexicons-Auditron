'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { geminiService } from '../services/geminiService';
import { useSessionManagement } from './useSessionManagement';

export const useChat = () => {
  const {
    currentSessionId,
    updateSession,
    createSession,
    sessions,
  } = useSessionManagement();

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [documentData, setDocumentData] = useState<{
    content: string;
    fileName: string;
    fileSize: string;
    documentType: string;
  } | null>(null);
  
  // Refs to track state and prevent multiple requests
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedMessagesRef = useRef<Message[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);

  // Update refs when session changes
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Initialize agent on load
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        await fetch('/api/chat', { method: 'PATCH' });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize agent:', error);
      }
    };

    initializeAgent();
  }, []);

  // Load session data when session changes
  useEffect(() => {
    if (currentSessionId && sessions.length > 0 && !sessionLoaded) {
      const currentSession = sessions.find(s => s.session_id === currentSessionId);
      if (currentSession && currentSession.session_data?.messages) {
        setMessages(currentSession.session_data.messages);
        lastSavedMessagesRef.current = currentSession.session_data.messages;
      } else {
        // New session, reset to welcome message
        const welcomeMessages: Message[] = [
          {
            role: 'assistant' as const,
            content: '👋 Hi! I\'m Audi, your AI Compliance Co-pilot. I can help you audit your cloud security posture across AWS, Azure, and GCP. What would you like me to check today?'
          }
        ];
        setMessages(welcomeMessages);
        lastSavedMessagesRef.current = welcomeMessages;
      }
      setSessionLoaded(true);
    }
  }, [currentSessionId, sessions, sessionLoaded]);

  // Reset session loaded flag when session changes
  useEffect(() => {
    setSessionLoaded(false);
  }, [currentSessionId]);

  // Debounced save function
  const debouncedSaveSession = useCallback((messagesToSave: Message[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const sessionId = currentSessionIdRef.current;
      if (!sessionId || !isInitialized || messagesToSave.length <= 1) return;

      // Check if messages have actually changed
      const messagesChanged = JSON.stringify(lastSavedMessagesRef.current) !== JSON.stringify(messagesToSave);
      if (!messagesChanged) return;

      const sessionData = { messages: messagesToSave };
      
      try {
        // Check if session exists
        const existingSession = sessions.find(s => s.session_id === sessionId);
        
        if (existingSession) {
          await updateSession(sessionId, sessionData);
        } else {
          await createSession(sessionData);
        }
        
        lastSavedMessagesRef.current = [...messagesToSave];
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }, 1000); // 1 second debounce
  }, [isInitialized, sessions, updateSession, createSession]);

  // Save session data when messages change (with debouncing)
  useEffect(() => {
    if (sessionLoaded && messages.length > 0) {
      debouncedSaveSession(messages);
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, sessionLoaded, debouncedSaveSession]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setCurrentStatus('');
    setStreamingMessage('');
    setDocumentData(null); // Clear previous document data

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
            
            // Check if the response contains document generation indicators and fetch document data
            if (accumulatedContent.includes('Report Generated Successfully') ||
                accumulatedContent.includes('compliance document generated') ||
                accumulatedContent.includes('SOC2_Report_') ||
                accumulatedContent.includes('ISO_') ||
                accumulatedContent.includes('Comprehensive_Compliance_Report_') ||
                accumulatedContent.includes('📄 Report Details:')) {
              
              // console.log('🔍 Document generation detected, fetching document data...');
              
              try {
                // Add a small delay to ensure backend has processed the document
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Fetch document data from the API
                const docResponse = await fetch('/api/chat?action=document');
                if (docResponse.ok) {
                  const docResult = await docResponse.json();
                  // console.log('📄 Document fetch result:', docResult);
                  if (docResult.documentData) {
                    setDocumentData(docResult.documentData);
                    // console.log('✅ Document data set:', docResult.documentData.fileName);
                  } else {
                    // console.log('❌ No document data in response');
                  }
                } else {
                  console.error('❌ Failed to fetch document data:', docResponse.status);
                }
              } catch (error) {
                console.error('❌ Failed to fetch document data:', error);
              }
            }
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
    setDocumentData(null); // Clear document data on reset
    geminiService.resetChat();
  }, []);

  return {
    messages,
    isLoading,
    currentStatus,
    streamingMessage,
    error,
    sendMessage,
    resetChat,
    documentData
  };
};
