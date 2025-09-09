import React, { useState } from 'react';

interface DocumentData {
  content: string;
  fileName: string;
  fileSize: string;
  documentType: string;
}

interface DocumentDownloaderProps {
  documentData: DocumentData;
}

export const DocumentDownloader: React.FC<DocumentDownloaderProps> = ({ documentData }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    
    try {
      // Create a blob with the HTML content
      const blob = new Blob([documentData.content], { type: 'text/html' });
      
      // Create a download URL
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = documentData.fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    // Open the HTML content in a new window for preview
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(documentData.content);
      newWindow.document.close();
    }
  };

  const getDocumentIcon = () => {
    switch (documentData.documentType) {
      case 'SOC':
        return '📋';
      case 'ISO':
        return '🏆';
      case 'COMPREHENSIVE':
        return '📊';
      default:
        return '📄';
    }
  };

  return (
    <div className="document-downloader">
      <div className="document-card">
        <div className="document-header">
          <div className="document-icon">
            {getDocumentIcon()}
          </div>
          <div className="document-info">
            <h4 className="document-title">{documentData.fileName}</h4>
            <p className="document-size">{documentData.fileSize}</p>
          </div>
        </div>
        
        <div className="document-actions">
          <button 
            onClick={handlePreview}
            className="btn-download"
            title="Download report file"
          >
            📥 Download
          </button>
          
          {/* <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-download"
            title="Download report file"
          >
            {isDownloading ? (
              <>⏳ Downloading...</>
            ) : (
              <>📥 Download</>
            )}
          </button> */}
        </div>
      </div>

      <style jsx>{`
        .document-downloader {
          margin: 16px 0;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .document-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .document-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .document-icon {
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .document-info {
          flex: 1;
        }

        .document-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          word-break: break-all;
        }

        .document-size {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }

        .document-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-preview,
        .btn-download {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-preview {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .btn-preview:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .btn-download {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .btn-download:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        }

        .btn-download:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 640px) {
          .document-actions {
            flex-direction: column;
          }

          .btn-preview,
          .btn-download {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
