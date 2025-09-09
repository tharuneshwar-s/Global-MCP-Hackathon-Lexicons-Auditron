'use client';

import React from 'react';
import './SampleQuestions.css';

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void;
  isLoading: boolean;
}

const sampleQuestions = [
  {
    id: 1,
    question: "Run AWS security audit for S3 public access, RDS encryption, and IAM MFA",
    category: "AWS Security"
  },
  {
    id: 2,
    question: "Audit Azure storage accounts and SQL databases for security compliance",
    category: "Azure Security"
  },
  {
    id: 3,
    question: "Check GCP Cloud Storage buckets and security controls compliance",
    category: "GCP Security"
  },
  {
    id: 4,
    question: "Generate a SOC 2 Type II compliance report with real audit findings",
    category: "Compliance"
  },
  {
    id: 5,
    question: "Create an ISO 27001 compliance assessment report",
    category: "Compliance"
  },
  {
    id: 6,
    question: "Perform multi-cloud security audit across AWS, Azure, and GCP",
    category: "Multi-Cloud"
  }
];

export const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onQuestionClick, isLoading }) => {
  return (
    <div className="sample-questions">
      <div className="sample-questions-header">
        <h3>Get Started with Common Security Audits</h3>
        <p>Click on any question below to begin your security audit</p>
        <div className="credentials-note">
          <span className="icon">ℹ️</span>
          <span>Make sure to configure your cloud credentials in Settings before running audits</span>
        </div>
      </div>
      
      <div className="questions-grid">
        {sampleQuestions.map((item) => (
          <button
            key={item.id}
            className={`question-card ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && onQuestionClick(item.question)}
            disabled={isLoading}
          >
            <div className="question-category">{item.category}</div>
            <div className="question-text">{item.question}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
