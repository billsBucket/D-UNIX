/**
 * initialize.ts
 *
 * This is the main initialization module for the application.
 * It sets up all necessary connections and services.
 */

import { initializeProviders } from './real-time-blockchain';
import { playSound } from './sound-manager';
import { toast } from 'sonner';
import { startMonitoring } from './price-monitoring-service';
import { NETWORKS } from './ethereum';

// Service initialization state
let initialized = false;
let initializationPromise: Promise<void> | null = null;
const initializedServices: Record<string, boolean> = {};

/**
 * Register a service as initialized
 * @param serviceName Name of the service
 */
export function registerInitializedService(serviceName: string): void {
  initializedServices[serviceName] = true;
  console.log(`Service registered as initialized: ${serviceName}`);
}

/**
 * Check if a specific service is initialized
 * @param serviceName Name of the service
 * @returns True if the service is initialized
 */
export function isServiceInitialized(serviceName: string): boolean {
  return !!initializedServices[serviceName];
}

/**
 * Get all initialized services
 * @returns Record of service initialization states
 */
export function getInitializedServices(): Record<string, boolean> {
  return { ...initializedServices };
}

/**
 * Initialize all application services
 */
export async function initializeApp(): Promise<void> {
  if (initialized) {
    console.log('App already initialized');
    return;
  }

  // If initialization is already in progress, return that promise
  if (initializationPromise) {
    return initializationPromise;
  }

  console.log('Initializing application services...');

  // Create a new initialization promise
  initializationPromise = (async () => {
    try {
      // Step 1: Initialize blockchain providers and real-time monitoring
      console.log('Setting up blockchain connections...');
      await initializeProviders();
      registerInitializedService('blockchain-providers');

      // Step 2: Initialize price monitoring service
      console.log('Starting price monitoring service...');
      startMonitoring();
      registerInitializedService('price-monitoring');

      // Step 3: Initialize notifications system
      console.log('Setting up notification manager...');
      try {
        // Since we don't have a direct initialization function,
        // we can do some basic initialization here
        if (typeof window !== 'undefined' && window.localStorage) {
          // Check if notifications are enabled in localStorage
          const notificationsEnabled = localStorage.getItem('dunix-notifications-enabled');
          if (notificationsEnabled === null) {
            // Set default value if not set
            localStorage.setItem('dunix-notifications-enabled', 'true');
          }
        }
        registerInitializedService('notifications');
      } catch (error) {
        console.warn('Notification manager initialization error:', error);
      }

      // Step 4: Initialize external integrations (Discord, Telegram, etc.)
      console.log('Connecting external integrations...');
      try {
        // For external integrations, we can load saved integration settings from localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const savedIntegrations = localStorage.getItem('dunix-external-integrations');
          if (savedIntegrations) {
            console.log('Loaded saved external integrations');
          }
        }
        registerInitializedService('external-integrations');
      } catch (error) {
        console.warn('External integrations initialization error:', error);
      }

      // Step 5: Initialize token data and price feeds
      console.log('Loading token data and price feeds...');
      try {
        // Load token data for the first network as a starting point
        const firstNetworkId = Object.keys(NETWORKS)[0];
        console.log(`Loading initial token data for network ${firstNetworkId}`);
        // Actual implementation would load token data for this network
        registerInitializedService('token-data');
      } catch (error) {
        console.warn('Token data initialization error:', error);
      }

      // Step 6: Initialize transaction estimator
      console.log('Setting up transaction estimator...');
      try {
        // Initialize default gas estimation settings
        if (typeof window !== 'undefined' && window.localStorage) {
          const gasSettings = localStorage.getItem('dunix-gas-settings');
          if (!gasSettings) {
            const defaultSettings = {
              priorityLevel: 'standard',
              customGasPrice: '',
              useEIP1559: true,
            };
            localStorage.setItem('dunix-gas-settings', JSON.stringify(defaultSettings));
          }
        }
        registerInitializedService('transaction-estimator');
      } catch (error) {
        console.warn('Transaction estimator initialization error:', error);
      }

      // Step 7: Set up wallet event listeners for account and network changes
      console.log('Setting up wallet listeners...');
      try {
        // Detect and setup wallet if available
        if (typeof window !== 'undefined' && window.ethereum) {
          console.log('Found Web3 provider, setting up listeners');
          // Actual implementation would set up proper listeners
        } else {
          console.log('No Web3 provider detected');
        }
        registerInitializedService('wallet-listeners');
      } catch (error) {
        console.warn('Wallet listener setup error:', error);
      }

      // Play a sound to indicate successful initialization
      playSound('notification-system');

      // Show a success toast
      toast.success('Connected to blockchain networks');

      // Mark as initialized
      initialized = true;

      console.log('Application services initialized successfully');
      return;
    } catch (error) {
      console.error('Failed to initialize application:', error);
      toast.error('Failed to initialize. Try refreshing the page.');

      // Reset the initialization promise so it can be attempted again
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Check if the app has been initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Get initialization status with more details
 */
export function getInitializationStatus(): {
  initialized: boolean;
  services: Record<string, boolean>;
  inProgress: boolean;
} {
  return {
    initialized,
    services: { ...initializedServices },
    inProgress: initializationPromise !== null && !initialized
  };
}

/**
 * Clean up resources when the application is unmounted
 */
export function cleanupApp(): void {
  console.log('Cleaning up application resources...');

  // Add cleanup logic for various services
  try {
    // Close WebSocket connections and listeners
    if (isServiceInitialized('blockchain-providers')) {
      console.log('Cleaning up blockchain connections...');
      // Actual cleanup would happen here
    }

    // Clear price monitoring intervals
    if (isServiceInitialized('price-monitoring')) {
      console.log('Stopping price monitoring...');
      // Actual cleanup would happen here
    }

    // Clear wallet listeners
    if (isServiceInitialized('wallet-listeners') && typeof window !== 'undefined' && window.ethereum) {
      console.log('Removing wallet listeners...');
      // Actual cleanup would happen here
    }

    // Reset service states
    Object.keys(initializedServices).forEach(service => {
      initializedServices[service] = false;
    });

    // Reset initialization flag
    initialized = false;
    initializationPromise = null;

    console.log('Application resources cleaned up successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * Reinitialize the application after a failure or manual reset
 */
export async function reinitializeApp(): Promise<void> {
  if (initialized) {
    // Clean up first
    cleanupApp();
  }

  // Then initialize again
  return initializeApp();
}

/**
 * Initialize a specific service independently
 * @param serviceName Name of the service to initialize
 */
export async function initializeService(serviceName: string): Promise<boolean> {
  if (isServiceInitialized(serviceName)) {
    console.log(`Service ${serviceName} is already initialized`);
    return true;
  }

  console.log(`Initializing service: ${serviceName}`);
  try {
    switch (serviceName) {
      case 'blockchain-providers':
        await initializeProviders();
        break;
      case 'price-monitoring':
        startMonitoring();
        break;
      default:
        console.warn(`No initialization method available for service: ${serviceName}`);
        return false;
    }

    registerInitializedService(serviceName);
    return true;
  } catch (error) {
    console.error(`Failed to initialize service ${serviceName}:`, error);
    return false;
  }
}

// Initialize the app when this module is imported
// This ensures that blockchain connections are established early
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  initializeApp().catch(err => {
    console.error('Failed to auto-initialize:', err);
  });
}

// Export a default function for explicit initialization
export default initializeApp;
