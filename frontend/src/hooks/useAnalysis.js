import { useState, useCallback, useRef } from 'react';
import { analyzeCompanyApi } from '../services/api';

/**
 * useAnalysis
 * 
 * Custom hook to manage the state of the AI Investment Agent.
 * Tracks loading, errors, data, and supports request cancellation and retries.
 */
export const useAnalysis = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Track the last queried company for the retry mechanism
  const [lastQuery, setLastQuery] = useState("");

  // Store the active AbortController to cancel previous duplicate requests
  const abortControllerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => prev?.id === Date.now() ? null : prev);
    }, 4000);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const analyze = useCallback(async (companyName) => {
    if (isLoading) return;
    
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Please enter a valid company name.");
      return;
    }

    // Prevent duplicate searches for the same company if already loaded successfully
    if (trimmedName.toLowerCase() === lastQuery.toLowerCase() && data && !error) {
      return;
    }

    // Cancel any previous request if it is still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this specific request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset UI state for the new request
    setIsLoading(true);
    setError(null);
    setData(null);
    setLastQuery(trimmedName);
    showToast(`Started research on ${trimmedName}...`, "info");

    try {
      const result = await analyzeCompanyApi(trimmedName, abortController.signal);
      setData(result);
      showToast(`Analysis completed for ${trimmedName}.`, "success");
    } catch (err) {
      // Ignore errors caused by manual cancellation
      if (err.message !== "RequestCancelled") {
        setError(err.message || "An unexpected error occurred during analysis.");
        showToast("Research failed. Please try again.", "error");
      }
    } finally {
      // Only clear loading state if this is still the active request
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [data, error, lastQuery, showToast, isLoading]);

  const retry = useCallback(() => {
    if (lastQuery) {
      analyze(lastQuery);
    }
  }, [analyze, lastQuery]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setLastQuery("");
    setToast(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { data, isLoading, error, analyze, retry, reset, toast, clearToast };
};
