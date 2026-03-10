// Service Worker Registration for Tracksy Offline Capabilities

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config?: {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}): void {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(
  swUrl: string,
  config?: {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
  }
): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Content is cached for offline use.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Register for background sync
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        registration.sync.register('tracksy-expense-sync')
          .then(() => {
            console.log('Background sync registered');
          })
          .catch((error) => {
            console.error('Background sync registration failed:', error);
          });
      }

      // Setup message listener for communication with SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          console.log(`Background sync completed: ${event.data.synced} items`);
          
          // Notify the app about sync completion
          window.dispatchEvent(new CustomEvent('syncComplete', {
            detail: { synced: event.data.synced }
          }));
        }
      });

    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(
  swUrl: string,
  config?: {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
  }
): void {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Helper function to send messages to service worker
export function sendMessageToSW(message: any): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Request sync from service worker
export function requestSync(): void {
  sendMessageToSW({ type: 'SYNC_REQUEST' });
}

// Update cache from service worker
export function updateCache(assets: string[]): void {
  sendMessageToSW({ type: 'CACHE_UPDATE', assets });
}

// Check if app is running as PWA
export function isRunningStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Install prompt handling
let deferredPrompt: any = null;

export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('installPromptAvailable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('appInstalled'));
  });
}

export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          resolve(true);
        } else {
          console.log('User dismissed the install prompt');
          resolve(false);
        }
        deferredPrompt = null;
      });
    } else {
      resolve(false);
    }
  });
}

// Network status helpers
export function getNetworkStatus(): {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} {
  const online = navigator.onLine;
  
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      isOnline: online,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    };
  }
  
  return { isOnline: online };
}

// Setup network listeners
export function setupNetworkListeners(): void {
  window.addEventListener('online', () => {
    console.log('App is back online');
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline: true }
    }));
    
    // Request background sync when coming back online
    requestSync();
  });

  window.addEventListener('offline', () => {
    console.log('App is now offline');
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline: false }
    }));
  });
}

// Initialize all PWA features
export function initializePWA(): void {
  setupInstallPrompt();
  setupNetworkListeners();
  
  // Register service worker
  register({
    onSuccess: (registration) => {
      console.log('Tracksy is ready for offline use');
    },
    onUpdate: (registration) => {
      console.log('New version available! Please refresh.');
      
      // Dispatch event for app to handle update
      window.dispatchEvent(new CustomEvent('updateAvailable', {
        detail: { registration }
      }));
    }
  });
}

export default {
  register,
  unregister,
  sendMessageToSW,
  requestSync,
  updateCache,
  isRunningStandalone,
  setupInstallPrompt,
  showInstallPrompt,
  getNetworkStatus,
  setupNetworkListeners,
  initializePWA
};