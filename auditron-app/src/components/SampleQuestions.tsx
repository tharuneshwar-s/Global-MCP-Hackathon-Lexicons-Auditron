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
    question: "Check all AWS S3 buckets for public access vulnerabilities",
    category: "AWS Security"
  },
  {
    id: 2,
    question: "Audit Azure storage accounts for public container access",
    category: "Azure Security"
  },
  {
    id: 3,
    question: "Verify GCP Cloud Storage buckets are not publicly accessible",
    category: "GCP Security"
  },
  {
    id: 4,
    question: "Check if AWS RDS instances have encryption enabled",
    category: "AWS Encryption"
  },
  {
    id: 5,
    question: "Audit AWS IAM users for MFA enforcement",
    category: "AWS IAM"
  },
  {
    id: 6,
    question: "Generate a comprehensive SOC 2 compliance report",
    category: "Compliance"
  }
];

export const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onQuestionClick, isLoading }) => {
  return (
    <div className="sample-questions">
      <div className="sample-questions-header">
        <h3>Get Started with Common Security Audits</h3>
        <p>Click on any question below to begin your security audit</p>
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
