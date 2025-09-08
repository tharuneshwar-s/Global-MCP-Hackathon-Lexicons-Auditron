'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useCredentials } from '../hooks/useCredentials';
import { SettingsDialog } from './SettingsDialog';
import './Header.css';
import { createClient } from '@/utils/supabase/client';

interface HeaderProps {
    onReset?: () => void;
    onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onToggleSidebar }) => {
    const { user, loading } = useAuth();
    const { hasCredentials } = useCredentials();
    const router = useRouter();
    const supabase = createClient();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCredentialsWarning, setShowCredentialsWarning] = useState(false);

    // Check if user needs to set up credentials
    useEffect(() => {
        if (user && !loading && !hasCredentials) {
            // Show warning after a short delay to let the page load
            const timer = setTimeout(() => {
                setShowCredentialsWarning(true);
            }, 2000);
            
            return () => clearTimeout(timer);
        } else {
            setShowCredentialsWarning(false);
        }
    }, [user, loading, hasCredentials]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const handleSettingsClick = () => {
        setIsSettingsOpen(true);
        setShowCredentialsWarning(false);
    };

    const handleSettingsClose = () => {
        setIsSettingsOpen(false);
    };

    const handleSettingsSave = () => {
        setShowCredentialsWarning(false);
        // Settings dialog will close automatically after successful save
    };

    return (
        <>
            <div className="header">
                <div className="header-left">
                    {!loading && user && (
                        <button 
                            onClick={onToggleSidebar} 
                            className="sidebar-toggle bg-blue-400"
                            title="Toggle sessions"
                            aria-label="Toggle sessions sidebar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    )}
                    <div className="header-content">
                        <h1>Audi - Auditron</h1>
                        <p>Multi-Cloud Security Auditing</p>
                    </div>
                </div>
                <div className="header-actions">
                    {!loading && user && (
                        <div className="user-info">
                            <div 
                                onClick={handleSettingsClick}
                                className="w-10 h-7 flex justify-center items-center rounded-full text-white cursor-pointer bg-blue-500 relative"
                                title="Cloud Provider Settings"
                                aria-label="Open settings"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                {!hasCredentials && (
                                    <span className="warning-indicator" title="Cloud credentials required">!</span>
                                )}
                            </div>
                            <span className="username">
                                👋 {user.user_metadata?.username || user.email}
                            </span>
                            <button onClick={handleLogout} className="logout-button !bg-blue-500" title="Logout">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Credentials Warning Banner */}
            {showCredentialsWarning && (
                <div className="credentials-warning">
                    <div className="warning-content">
                        <span className="warning-icon">⚠️</span>
                        <span>Please configure your cloud provider credentials to enable security auditing.</span>
                        <button onClick={handleSettingsClick} className="setup-credentials-button">
                            Setup Credentials
                        </button>
                        <button 
                            onClick={() => setShowCredentialsWarning(false)} 
                            className="dismiss-warning-button"
                            title="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Dialog */}
            <SettingsDialog 
                isOpen={isSettingsOpen}
                onClose={handleSettingsClose}
                onSave={handleSettingsSave}
            />
        </>
    );
};
