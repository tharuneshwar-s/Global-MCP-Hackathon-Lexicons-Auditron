'use client';

import React, { useEffect } from 'react';
import { useSessionManagement } from '../hooks/useSessionManagement';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const {
    sessions,
    currentSessionId,
    isLoading,
    fetchSessions,
    deleteSession,
    switchSession,
    createNewSession,
  } = useSessionManagement();

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getSessionTitle = (session: any) => {
    const sessionData = session.session_data;
    if (sessionData && sessionData.messages && sessionData.messages.length > 0) {
      const firstUserMessage = sessionData.messages.find((msg: any) => msg.role === 'user');
      if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }
    return 'New Chat';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Chat Sessions</h2>
          <button className="!bg-transparent !w-fit !h-fit !p-0 !text-red-500" onClick={onToggle} title="Close sidebar" aria-label="Close sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="new-chat-btn" onClick={()=>{createNewSession(); onToggle();}} title="Start a new chat" aria-label="Start a new chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>

        <div className="sidebar-content">
          {isLoading ? (
            <div className="loading-sessions">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="no-sessions">No sessions found</div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`session-item ${
                    session.session_id === currentSessionId ? 'active' : ''
                  }`}
                  onClick={() => switchSession(session.session_id)}
                >
                  <div className="session-content">
                    <div className="session-title">
                      {getSessionTitle(session)}
                    </div>
                    <div className="session-date">
                      {formatDate(session.updated_at)}
                    </div>
                  </div>
                  <button
                    className="delete-session-btn"
                    title="Delete session"
                    aria-label="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
