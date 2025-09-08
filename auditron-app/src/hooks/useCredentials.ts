'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AWSCredentials {
  access_key_id: string;
  secret_access_key: string;
  region: string;
}

interface AzureCredentials {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  subscription_id: string;
}

interface GCPCredentials {
  service_account_json: string; // Store the entire JSON as a string
}

interface Credentials {
  aws_credentials: AWSCredentials | null;
  azure_credentials: AzureCredentials | null;
  gcp_credentials: GCPCredentials | null;
}

export const useCredentials = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credentials>({
    aws_credentials: null,
    azure_credentials: null,
    gcp_credentials: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs to prevent multiple API calls
  const fetchingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    if (!user || fetchingRef.current || lastFetchedUserIdRef.current === user.id) return;

    fetchingRef.current = true;
    lastFetchedUserIdRef.current = user.id;
    setIsLoading(true);
    console.log('Fetching credentials for user:', user?.id);
    try {
      const response = await fetch('/api/credentials');
      console.log('Credentials API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Credentials data:', data);
        setCredentials(data.credentials);
        
        // Check if user has at least one set of credentials
        const hasAnyCredentials = !!(
          data.credentials.aws_credentials ||
          data.credentials.azure_credentials ||
          data.credentials.gcp_credentials
        );
        setHasCredentials(hasAnyCredentials);
      } else {
        console.error('Failed to fetch credentials');
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []); // Remove user dependency

  const saveCredentials = useCallback(async (
    awsCredentials?: AWSCredentials | null,
    azureCredentials?: AzureCredentials | null,
    gcpCredentials?: GCPCredentials | null
  ) => {
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    if (isSaving) return false;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    return new Promise<boolean>((resolve) => {
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        console.log('Saving credentials for user:', user?.id);
        try {
          const payload: any = {};
          
          if (awsCredentials !== undefined) payload.aws_credentials = awsCredentials;
          if (azureCredentials !== undefined) payload.azure_credentials = azureCredentials;
          if (gcpCredentials !== undefined) payload.gcp_credentials = gcpCredentials?.service_account_json ? JSON.parse(gcpCredentials?.service_account_json) : null;

          console.log('Save payload:', payload);

          const response = await fetch('/api/credentials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          console.log('Save response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Save response data:', data);
            setCredentials(data.credentials);
            
            // Update hasCredentials flag
            const hasAnyCredentials = !!(
              data.credentials.aws_credentials ||
              data.credentials.azure_credentials ||
              data.credentials.gcp_credentials
            );
            setHasCredentials(hasAnyCredentials);
            
            resolve(true);
          } else {
            console.error('Failed to save credentials');
            resolve(false);
          }
        } catch (error) {
          console.error('Error saving credentials:', error);
          resolve(false);
        } finally {
          setIsSaving(false);
        }
      }, 500); // 500ms debounce
    });
  }, [user, isSaving]);

  const deleteCredentials = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const response = await fetch('/api/credentials', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCredentials({
          aws_credentials: null,
          azure_credentials: null,
          gcp_credentials: null
        });
        setHasCredentials(false);
        return true;
      } else {
        console.error('Failed to delete credentials');
        return false;
      }
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch credentials when user changes (only once)
  useEffect(() => {
    if (user && !fetchingRef.current) {
      fetchCredentials();
    } else if (!user) {
      setCredentials({
        aws_credentials: null,
        azure_credentials: null,
        gcp_credentials: null
      });
      setHasCredentials(false);
      fetchingRef.current = false;
      lastFetchedUserIdRef.current = null; // Reset when user logs out
    }
  }, [user]); // Remove fetchCredentials from dependencies

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    credentials,
    hasCredentials,
    isLoading: isLoading || isSaving,
    fetchCredentials,
    saveCredentials,
    deleteCredentials
  };
};

export type { AWSCredentials, AzureCredentials, GCPCredentials, Credentials };
