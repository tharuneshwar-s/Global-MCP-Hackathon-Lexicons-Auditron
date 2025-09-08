'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import { createClient } from '@/utils/supabase/client';

interface HeaderProps {
    onReset?: () => void;
    onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onToggleSidebar }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    return (
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
                        <span className="username">
                            👋 {user.user_metadata?.username || user.email}
                        </span>
                        <button onClick={handleLogout} className=" py-0 bg-red-500" title="Logout">
                            Logout
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
