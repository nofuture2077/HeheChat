import { useState, useEffect, useCallback } from 'react';

interface VersionCheckResult {
  newVersionAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

interface UseVersionCheckOptions {
  checkInterval?: number; // in milliseconds, default: 1 hour
  remoteManifestUrl?: string;
  enabled?: boolean;
  onNewVersionDetected?: (currentVersion: string, latestVersion: string) => void;
}

const DEFAULT_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY_LAST_CHECK = 'hehe-version-last-check';
const STORAGE_KEY_CURRENT_VERSION = 'hehe-current-version';

export function useVersionCheck(options: UseVersionCheckOptions = {}): VersionCheckResult {
  const {
    checkInterval = DEFAULT_CHECK_INTERVAL,
    remoteManifestUrl,
    enabled = true,
    onNewVersionDetected
  } = options;

  const [state, setState] = useState<VersionCheckResult>({
    newVersionAvailable: false,
    currentVersion: '0.0.1',
    latestVersion: null,
    isChecking: false,
    lastChecked: null,
    error: null
  });

  // Get current version from local manifest or fallback to package version
  const getCurrentVersion = useCallback(async (): Promise<string> => {
    try {
      // Try to get version from local storage first
      const storedVersion = localStorage.getItem(STORAGE_KEY_CURRENT_VERSION);
      if (storedVersion) {
        return storedVersion;
      }

      // Fetch local manifest to get current version
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        const version = manifest.version || '0.0.1';
        localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, version);
        return version;
      }
    } catch (error) {
      console.warn('Failed to get current version from manifest:', error);
    }
    
    // Fallback to hardcoded version
    return '0.0.1';
  }, []);

  // Check if enough time has passed since last check
  const shouldCheck = useCallback((): boolean => {
    const lastCheckStr = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
    if (!lastCheckStr) return true;

    const lastCheck = new Date(parseInt(lastCheckStr, 10));
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastCheck.getTime();

    return timeSinceLastCheck >= checkInterval;
  }, [checkInterval]);

  // Compare version strings (simple semver comparison)
  const compareVersions = useCallback((current: string, latest: string): boolean => {
    // Remove 'v' prefix if present
    const cleanCurrent = current.replace(/^v/, '');
    const cleanLatest = latest.replace(/^v/, '');

    // Simple string comparison works for most semver cases
    // For more complex version comparison, you could use a library like semver
    return cleanCurrent !== cleanLatest;
  }, []);

  // Fetch remote manifest and check version
  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!enabled || state.isChecking) return;

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Get current version
      const currentVersion = await getCurrentVersion();

      // Fetch remote manifest with cache busting
      const cacheBuster = Date.now();
      const response = await fetch(`${remoteManifestUrl}?t=${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch remote manifest: ${response.status}`);
      }

      const remoteManifest = await response.json();
      const latestVersion = remoteManifest.version;

      if (!latestVersion) {
        throw new Error('Remote manifest does not contain version information');
      }

      // Update last check timestamp
      const now = new Date();
      localStorage.setItem(STORAGE_KEY_LAST_CHECK, now.getTime().toString());

      // Check if versions differ
      const newVersionAvailable = compareVersions(currentVersion, latestVersion);

      setState(prev => ({
        ...prev,
        newVersionAvailable,
        currentVersion,
        latestVersion,
        isChecking: false,
        lastChecked: now,
        error: null
      }));

      // Notify if new version is available
      if (newVersionAvailable && onNewVersionDetected) {
        onNewVersionDetected(currentVersion, latestVersion);
      }

      console.log(`Version check completed: current=${currentVersion}, latest=${latestVersion}, updateAvailable=${newVersionAvailable}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Version check failed:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage
      }));
    }
  }, [enabled, state.isChecking, getCurrentVersion, remoteManifestUrl, compareVersions, onNewVersionDetected]);

  // Manual check function
  const checkNow = useCallback((): void => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Initialize current version and set up periodic checks
  useEffect(() => {
    if (!enabled) return;

    // Initialize current version and store it in localStorage
    getCurrentVersion().then(version => {
      setState(prev => ({ ...prev, currentVersion: version }));
      // Always store the current version in localStorage when the app loads
      localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, version);
    });

    // Check immediately if enough time has passed
    if (shouldCheck()) {
      checkForUpdates();
    }

    // Set up periodic checks
    const intervalId = setInterval(() => {
      if (shouldCheck()) {
        checkForUpdates();
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [enabled, checkInterval]); // Removed shouldCheck, checkForUpdates, getCurrentVersion to prevent endless loop

  return {
    ...state,
    checkNow
  } as VersionCheckResult & { checkNow: () => void };
}
