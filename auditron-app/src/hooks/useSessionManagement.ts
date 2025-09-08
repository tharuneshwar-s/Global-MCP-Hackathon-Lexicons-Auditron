'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Session {
  session_id: string;
  session_data: any;
  created_at: string;
  updated_at: string;
}

export const useSessionManagement = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Generate a random session ID
  const generateSessionId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Get current session ID from URL or create new one
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('session_id');
    if (sessionIdFromUrl) {
      setCurrentSessionId(sessionIdFromUrl);
    } else {
      // Create new session ID and update URL
      const newSessionId = generateSessionId();
      setCurrentSessionId(newSessionId);
      const newUrl = `${window.location.pathname}?session_id=${newSessionId}`;
      router.push(newUrl);
    }
  }, [searchParams]);

  // Fetch all sessions (only once or when needed)
  const fetchSessions = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Fetch sessions only once when component mounts
  useEffect(() => {
    fetchSessions();
  }, []); // Empty dependency array to run only once

  // Create new session
  const createSession = useCallback(async (sessionData: any = {}) => {
    if (!currentSessionId || isCreatingSession) return null;

    setIsCreatingSession(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          sessionData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(prev => {
          // Check if session already exists to avoid duplicates
          const existingIndex = prev.findIndex(s => s.session_id === data.session.session_id);
          if (existingIndex !== -1) {
            // Update existing session
            const newSessions = [...prev];
            newSessions[existingIndex] = data.session;
            return newSessions;
          } else {
            // Add new session
            return [data.session, ...prev];
          }
        });
        return data.session;
      } else {
        console.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
    return null;
  }, [currentSessionId, isCreatingSession]);

  // Update session data
  const updateSession = useCallback(async (sessionId: string, sessionData: any) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          sessionData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(prev => 
          prev.map(session => 
            session.session_id === sessionId ? data.session : session
          )
        );
        return data.session;
      } else {
        console.error('Failed to update session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
    return null;
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.session_id !== sessionId));
        
        // If deleting current session, create new one
        if (sessionId === currentSessionId) {
          const newSessionId = generateSessionId();
          setCurrentSessionId(newSessionId);
          const newUrl = `${window.location.pathname}?session_id=${newSessionId}`;
          router.push(newUrl);
        }
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [currentSessionId, generateSessionId, router]);

  // Switch to a different session
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    const newUrl = `${window.location.pathname}?session_id=${sessionId}`;
    router.push(newUrl);
  }, [router]);

  // Create new session and switch to it
  const createNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    const newUrl = `${window.location.pathname}?session_id=${newSessionId}`;
    router.push(newUrl);
  }, [generateSessionId, router]);

  return {
    sessions,
    currentSessionId,
    isLoading,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    createNewSession,
  };
};
