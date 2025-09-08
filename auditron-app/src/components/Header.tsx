import React from 'react';
import './Header.css';

interface HeaderProps {
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <div className="header">
      <div className="sizer header-content">
        <h1>Audi - Auditron</h1>
        <p>Multi-Cloud Security Auditing</p>
      </div>
      {onReset && (
        <div className="header-actions">
          <button onClick={onReset} className="reset-button" title="Reset Chat">
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
