'use client';

import { useState, useEffect } from 'react';
import { useCredentials, AWSCredentials, AzureCredentials, GCPCredentials } from '../hooks/useCredentials';
import { useAuth } from '../contexts/AuthContext';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave }) => {
  const { credentials, saveCredentials, isLoading } = useCredentials();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'aws' | 'azure' | 'gcp'>('aws');
  const [awsForm, setAwsForm] = useState<AWSCredentials>({
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1'
  });
  const [azureForm, setAzureForm] = useState<AzureCredentials>({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    subscription_id: ''
  });
  const [gcpForm, setGcpForm] = useState<GCPCredentials>({
    service_account_json: ''
  });
  const [gcpJsonInput, setGcpJsonInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  // Load existing credentials when dialog opens
  useEffect(() => {
    if (isOpen && credentials) {
      if (credentials.aws_credentials) {
        setAwsForm(credentials.aws_credentials);
      }
      if (credentials.azure_credentials) {
        setAzureForm(credentials.azure_credentials);
      }
      if (credentials.gcp_credentials) {
        setGcpForm(credentials.gcp_credentials);
        setGcpJsonInput(credentials.gcp_credentials.service_account_json);
      }
    }
  }, [isOpen, credentials]);

  const handleGcpJsonChange = (jsonString: string) => {
    setGcpJsonInput(jsonString);
    // Update the form with the raw JSON string
    setGcpForm({ service_account_json: jsonString });
  };

  const handleSave = async () => {
    if (!user) {
      setSaveStatus('error');
      console.error('User not authenticated');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    console.log('Saving credentials for user:', user.id);

    try {
      let gcpCreds: GCPCredentials | null = null;
      
      // Validate and parse GCP credentials
      if (gcpJsonInput.trim()) {
        try {
          // Validate that it's valid JSON and has required fields
          const parsed = JSON.parse(gcpJsonInput);
          if (!parsed.type || !parsed.project_id || !parsed.client_email) {
            throw new Error('Invalid GCP service account JSON - missing required fields');
          }
          gcpCreds = { service_account_json: gcpJsonInput.trim() };
        } catch (error) {
          setSaveStatus('error');
          setIsSaving(false);
          return;
        }
      }

      // Validate AWS credentials
      let awsCreds: AWSCredentials | null = null;
      if (awsForm.access_key_id.trim() && awsForm.secret_access_key.trim()) {
        awsCreds = awsForm;
      }

      // Validate Azure credentials
      let azureCreds: AzureCredentials | null = null;
      if (azureForm.tenant_id.trim() && azureForm.client_id.trim() && azureForm.client_secret.trim() && azureForm.subscription_id.trim()) {
        azureCreds = azureForm;
      }

      const success = await saveCredentials(awsCreds, azureCreds, gcpCreds);
      
      if (success) {
        setSaveStatus('success');
        setTimeout(() => {
          onSave?.();
          onClose();
        }, 1000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSaveStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-dialog-overlay">
      <div className="settings-dialog sizer">
        <div className="settings-dialog-header">
          <h2>Cloud Provider Settings</h2>
          <span className="text-red-500 text-xl cursor-pointer" onClick={handleClose}>x</span>
        </div>

        <div className="settings-dialog-tabs">
          <button 
            className={`tab ${activeTab === 'aws' ? 'active' : ''}`}
            onClick={() => setActiveTab('aws')}
          >
            AWS
          </button>
          <button 
            className={`tab ${activeTab === 'azure' ? 'active' : ''}`}
            onClick={() => setActiveTab('azure')}
          >
            Azure
          </button>
          <button 
            className={`tab ${activeTab === 'gcp' ? 'active' : ''}`}
            onClick={() => setActiveTab('gcp')}
          >
            GCP
          </button>
        </div>

        <div className="settings-dialog-content">
          {activeTab === 'aws' && (
            <div className="form-section">
              <h3>AWS Credentials</h3>
              <div className="form-group">
                <label htmlFor="aws-access-key">Access Key ID</label>
                <input
                  id="aws-access-key"
                  type="text"
                  value={awsForm.access_key_id}
                  onChange={(e) => setAwsForm({ ...awsForm, access_key_id: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div className="form-group">
                <label htmlFor="aws-secret-key">Secret Access Key</label>
                <input
                  id="aws-secret-key"
                  type="password"
                  value={awsForm.secret_access_key}
                  onChange={(e) => setAwsForm({ ...awsForm, secret_access_key: e.target.value })}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
              <div className="form-group">
                <label htmlFor="aws-region">Region</label>
                <select
                  id="aws-region"
                  value={awsForm.region}
                  onChange={(e) => setAwsForm({ ...awsForm, region: e.target.value })}
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-east-2">US East (Ohio)</option>
                  <option value="us-west-1">US West (N. California)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="eu-central-1">Europe (Frankfurt)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'azure' && (
            <div className="form-section">
              <h3>Azure Credentials</h3>
              <div className="form-group">
                <label htmlFor="azure-tenant-id">Tenant ID</label>
                <input
                  id="azure-tenant-id"
                  type="text"
                  value={azureForm.tenant_id}
                  onChange={(e) => setAzureForm({ ...azureForm, tenant_id: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="azure-client-id">Client ID</label>
                <input
                  id="azure-client-id"
                  type="text"
                  value={azureForm.client_id}
                  onChange={(e) => setAzureForm({ ...azureForm, client_id: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="azure-client-secret">Client Secret</label>
                <input
                  id="azure-client-secret"
                  type="password"
                  value={azureForm.client_secret}
                  onChange={(e) => setAzureForm({ ...azureForm, client_secret: e.target.value })}
                  placeholder="Your client secret"
                />
              </div>
              <div className="form-group">
                <label htmlFor="azure-subscription-id">Subscription ID</label>
                <input
                  id="azure-subscription-id"
                  type="text"
                  value={azureForm.subscription_id}
                  onChange={(e) => setAzureForm({ ...azureForm, subscription_id: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
            </div>
          )}

          {activeTab === 'gcp' && (
            <div className="form-section">
              <h3>GCP Service Account Key</h3>
              <div className="form-group">
                <label htmlFor="gcp-json">Service Account JSON</label>
                <textarea
                  id="gcp-json"
                  value={gcpJsonInput}
                  onChange={(e) => handleGcpJsonChange(e.target.value)}
                  placeholder="Paste your GCP service account JSON key here..."
                  rows={10}
                />
                <small>Paste the entire JSON content from your downloaded service account key file.</small>
              </div>
            </div>
          )}
        </div>

        <div className="settings-dialog-footer">
          {saveStatus === 'success' && (
            <div className="save-status success">✅ Credentials saved successfully!</div>
          )}
          {saveStatus === 'error' && (
            <div className="save-status error">❌ Failed to save credentials. Please check your inputs.</div>
          )}
          
          <div className="dialog-actions">
            <button 
              className="cancel-button" 
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              className="save-button" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
