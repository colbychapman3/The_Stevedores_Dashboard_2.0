// PWA Install Manager
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkInstallStatus();
        this.setupEventListeners();
        this.createInstallButton();
    }

    checkInstallStatus() {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('App is running as installed PWA');
        } else if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('App is running as installed PWA (iOS)');
        }
    }

    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt event fired');
            
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Store the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show install button if not already installed
            if (!this.isInstalled) {
                this.showInstallButton();
            }
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccessMessage();
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
            
            // Track installation
            this.trackInstallation();
        });

        // Listen for app update
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showUpdateNotification();
            });
        }
    }

    createInstallButton() {
        // Create install button element
        this.installButton = document.createElement('div');
        this.installButton.id = 'pwa-install-prompt';
        this.installButton.className = 'pwa-install-prompt hidden';
        this.installButton.innerHTML = `
            <div class="install-prompt-content">
                <div class="install-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="install-text">
                    <h3>Install Stevedores Dashboard</h3>
                    <p>Install this app for faster access and offline use</p>
                </div>
                <div class="install-actions">
                    <button id="install-app-btn" class="install-btn primary">
                        <i class="fas fa-plus mr-2"></i>Install
                    </button>
                    <button id="install-dismiss-btn" class="install-btn secondary">
                        <i class="fas fa-times mr-2"></i>Not Now
                    </button>
                </div>
            </div>
        `;

        // Add styles
        this.addInstallStyles();

        // Add event listeners to buttons
        this.setupInstallButtonEvents();

        // Add to body
        document.body.appendChild(this.installButton);
    }

    addInstallStyles() {
        const styles = `
            .pwa-install-prompt {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                border: 1px solid #e5e7eb;
                max-width: 400px;
                width: calc(100% - 40px);
                z-index: 1000;
                transition: all 0.3s ease;
            }

            .pwa-install-prompt.hidden {
                opacity: 0;
                transform: translateX(-50%) translateY(100px);
                pointer-events: none;
            }

            .pwa-install-prompt.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            .install-prompt-content {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .install-icon {
                flex-shrink: 0;
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
            }

            .install-text {
                flex: 1;
                min-width: 0;
            }

            .install-text h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                line-height: 1.3;
            }

            .install-text p {
                margin: 0;
                font-size: 14px;
                color: #6b7280;
                line-height: 1.4;
            }

            .install-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex-shrink: 0;
            }

            .install-btn {
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 80px;
            }

            .install-btn.primary {
                background: #3b82f6;
                color: white;
            }

            .install-btn.primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }

            .install-btn.secondary {
                background: #f3f4f6;
                color: #6b7280;
            }

            .install-btn.secondary:hover {
                background: #e5e7eb;
                color: #374151;
            }

            @media (max-width: 480px) {
                .install-prompt-content {
                    padding: 16px;
                    gap: 12px;
                }

                .install-icon {
                    width: 40px;
                    height: 40px;
                    font-size: 18px;
                }

                .install-text h3 {
                    font-size: 15px;
                }

                .install-text p {
                    font-size: 13px;
                }

                .install-actions {
                    gap: 6px;
                }

                .install-btn {
                    padding: 6px 12px;
                    font-size: 13px;
                }
            }

            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1001;
                max-width: 300px;
                animation: slideInRight 0.3s ease;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .install-success-message {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1001;
                animation: slideInDown 0.3s ease;
            }

            @keyframes slideInDown {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupInstallButtonEvents() {
        // Install button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#install-app-btn')) {
                this.installApp();
            } else if (e.target.closest('#install-dismiss-btn')) {
                this.dismissInstallPrompt();
            }
        });
    }

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.classList.remove('hidden');
            this.installButton.classList.add('show');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (!this.isInstalled) {
                    this.hideInstallButton();
                }
            }, 10000);
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.remove('show');
            this.installButton.classList.add('hidden');
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }

    dismissInstallPrompt() {
        this.hideInstallButton();
        
        // Store dismissal preference
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    shouldShowInstallPrompt() {
        // Don't show if already installed
        if (this.isInstalled) return false;
        
        // Check if user dismissed recently (within 7 days)
        const dismissedTime = localStorage.getItem('pwa-install-dismissed');
        if (dismissedTime) {
            const daysSinceDismissal = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissal < 7) return false;
        }
        
        return true;
    }

    showInstallSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'install-success-message';
        message.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-3"></i>
                <div>
                    <div class="font-semibold">App Installed Successfully!</div>
                    <div class="text-sm opacity-90">You can now access Stevedores Dashboard from your home screen</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold">App Updated!</div>
                    <div class="text-sm opacity-90">New features are now available</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 opacity-75 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    trackInstallation() {
        // Track PWA installation
        if (window.gtag) {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'Stevedores Dashboard'
            });
        }
        
        console.log('PWA installation tracked');
    }

    // Public method to manually trigger install prompt
    triggerInstallPrompt() {
        if (this.deferredPrompt && !this.isInstalled) {
            this.installApp();
        } else if (!this.isInstalled) {
            this.showInstallInstructions();
        }
    }

    showInstallInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'install-instructions';
        instructions.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <h3 class="text-lg font-semibold mb-4">Install Stevedores Dashboard</h3>
                <div class="space-y-3 text-sm">
                    <div>
                        <strong>Chrome/Edge:</strong> Look for the install icon in the address bar
                    </div>
                    <div>
                        <strong>Safari (iOS):</strong> Tap the share button and select "Add to Home Screen"
                    </div>
                    <div>
                        <strong>Firefox:</strong> Look for "Install" in the address bar menu
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Got it
                </button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        overlay.appendChild(instructions);
        
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
}

// Initialize PWA Install Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaInstallManager = new PWAInstallManager();
});

// Global function to trigger install
window.installPWA = () => {
    if (window.pwaInstallManager) {
        window.pwaInstallManager.triggerInstallPrompt();
    }
};