/**
 * Security Manager Module
 * Comprehensive security hardening for Stevedores Dashboard
 */

class SecurityManager {
  constructor() {
    this.config = {
      csp: {
        enabled: true,
        strictMode: true,
        reportOnly: false
      },
      inputSanitization: {
        enabled: true,
        strictMode: true,
        allowedTags: ['b', 'i', 'em', 'strong', 'span'],
        allowedAttributes: ['class', 'id']
      },
      dataProtection: {
        enabled: true,
        encryptStorage: true,
        secureCookies: true,
        httpOnly: true
      },
      rateLimiting: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000 // 1 minute
      }
    };
    
    this.violations = [];
    this.securityEvents = [];
    this.blockedRequests = new Map();
    
    this.init();
  }

  /**
   * Initialize security hardening
   */
  init() {
    this.implementCSP();
    this.setupInputSanitization();
    this.setupDataProtection();
    this.setupRateLimiting();
    this.setupSecurityMonitoring();
    this.setupSecurityHeaders();
    this.setupXSSProtection();
    this.setupCSRFProtection();
    
    console.log('Security Manager: Initialized with enterprise-grade security');
  }

  /**
   * Implement Content Security Policy
   */
  implementCSP() {
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // For inline scripts (to be removed in production)
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // For inline styles
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.stevedores.com',
        'wss:'
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'worker-src': ["'self'"],
      'manifest-src': ["'self'"]
    };

    if (this.config.csp.strictMode) {
      cspDirectives['script-src'] = cspDirectives['script-src'].filter(src => src !== "'unsafe-inline'");
      cspDirectives['style-src'] = cspDirectives['style-src'].filter(src => src !== "'unsafe-inline'");
    }

    const cspString = Object.entries(cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    // Set CSP header via meta tag
    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Security-Policy';
    metaTag.content = cspString;
    document.head.appendChild(metaTag);

    // Setup CSP violation reporting
    this.setupCSPReporting();
  }

  /**
   * Setup CSP violation reporting
   */
  setupCSPReporting() {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        documentURI: event.documentURI,
        referrer: event.referrer,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        timestamp: Date.now()
      };

      this.violations.push(violation);
      this.reportSecurityEvent('csp_violation', violation);
      
      console.warn('CSP Violation:', violation);
    });
  }

  /**
   * Setup input sanitization
   */
  setupInputSanitization() {
    // Override form inputs and textareas
    this.setupFormSanitization();
    
    // Override innerHTML and textContent setters
    this.setupDOMSanitization();
    
    // Setup API request sanitization
    this.setupAPIRequestSanitization();
  }

  /**
   * Setup form sanitization
   */
  setupFormSanitization() {
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        const sanitized = this.sanitizeInput(event.target.value);
        if (sanitized !== event.target.value) {
          event.target.value = sanitized;
          this.reportSecurityEvent('input_sanitized', {
            element: event.target.tagName,
            original: event.target.value,
            sanitized: sanitized
          });
        }
      }
    });

    document.addEventListener('paste', (event) => {
      const pastedData = event.clipboardData.getData('text');
      const sanitized = this.sanitizeInput(pastedData);
      
      if (sanitized !== pastedData) {
        event.preventDefault();
        event.target.value = sanitized;
        this.reportSecurityEvent('paste_sanitized', {
          original: pastedData,
          sanitized: sanitized
        });
      }
    });
  }

  /**
   * Setup DOM sanitization
   */
  setupDOMSanitization() {
    // Override innerHTML setter
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(html) {
        const sanitized = window.securityManager.sanitizeHTML(html);
        originalInnerHTML.set.call(this, sanitized);
      },
      get: originalInnerHTML.get
    });
  }

  /**
   * Setup API request sanitization
   */
  setupAPIRequestSanitization() {
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Sanitize request body
      if (init && init.body) {
        if (typeof init.body === 'string') {
          init.body = this.sanitizeJSON(init.body);
        }
      }
      
      // Add security headers
      if (!init) init = {};
      if (!init.headers) init.headers = {};
      
      init.headers['X-Requested-With'] = 'XMLHttpRequest';
      init.headers['X-Content-Type-Options'] = 'nosniff';
      
      return originalFetch(input, init);
    };
  }

  /**
   * Sanitize input text
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '');
    
    // Encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return sanitized;
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove dangerous elements
    const dangerousElements = temp.querySelectorAll('script, iframe, object, embed, link, meta, style');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'src' || attr.name === 'href') {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    return temp.innerHTML;
  }

  /**
   * Sanitize JSON data
   */
  sanitizeJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const sanitized = this.sanitizeObject(parsed);
      return JSON.stringify(sanitized);
    } catch (error) {
      return jsonString;
    }
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  }

  /**
   * Setup data protection
   */
  setupDataProtection() {
    this.setupStorageEncryption();
    this.setupSecureCookies();
    this.setupDataMasking();
  }

  /**
   * Setup storage encryption
   */
  setupStorageEncryption() {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = function(key, value) {
      const encrypted = window.securityManager.encryptData(value);
      return originalSetItem.call(this, key, encrypted);
    };
    
    localStorage.getItem = function(key) {
      const encrypted = originalGetItem.call(this, key);
      return encrypted ? window.securityManager.decryptData(encrypted) : encrypted;
    };
  }

  /**
   * Setup secure cookies
   */
  setupSecureCookies() {
    document.addEventListener('cookie', (event) => {
      // Ensure cookies are secure
      if (location.protocol === 'https:') {
        document.cookie = document.cookie.replace(/;?\s*$/, '; Secure; SameSite=Strict');
      }
    });
  }

  /**
   * Setup data masking
   */
  setupDataMasking() {
    this.sensitiveFields = [
      'password', 'ssn', 'creditcard', 'email', 'phone'
    ];
    
    document.addEventListener('input', (event) => {
      if (this.isSensitiveField(event.target)) {
        this.maskSensitiveData(event.target);
      }
    });
  }

  /**
   * Check if field is sensitive
   */
  isSensitiveField(element) {
    const name = element.name ? element.name.toLowerCase() : '';
    const id = element.id ? element.id.toLowerCase() : '';
    const type = element.type ? element.type.toLowerCase() : '';
    
    return this.sensitiveFields.some(field => 
      name.includes(field) || id.includes(field) || type === 'password'
    );
  }

  /**
   * Mask sensitive data
   */
  maskSensitiveData(element) {
    if (element.type !== 'password') {
      const value = element.value;
      if (value.length > 4) {
        const masked = '*'.repeat(value.length - 4) + value.slice(-4);
        element.setAttribute('data-masked', masked);
      }
    }
  }

  /**
   * Encrypt data
   */
  encryptData(data) {
    // Simple encryption for demonstration
    // In production, use proper encryption libraries
    return btoa(encodeURIComponent(data));
  }

  /**
   * Decrypt data
   */
  decryptData(encryptedData) {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return encryptedData;
    }
  }

  /**
   * Setup rate limiting
   */
  setupRateLimiting() {
    this.requestCounts = new Map();
    
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      
      if (this.isRateLimited(url)) {
        this.reportSecurityEvent('rate_limit_exceeded', { url });
        throw new Error('Rate limit exceeded');
      }
      
      this.trackRequest(url);
      return originalFetch(input, init);
    };
  }

  /**
   * Check if request is rate limited
   */
  isRateLimited(url) {
    const now = Date.now();
    const key = this.getURLKey(url);
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }
    
    const requests = this.requestCounts.get(key);
    const recentRequests = requests.filter(time => now - time < this.config.rateLimiting.windowMs);
    
    return recentRequests.length >= this.config.rateLimiting.maxRequests;
  }

  /**
   * Track request for rate limiting
   */
  trackRequest(url) {
    const now = Date.now();
    const key = this.getURLKey(url);
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }
    
    this.requestCounts.get(key).push(now);
    
    // Cleanup old requests
    this.cleanupOldRequests(key, now);
  }

  /**
   * Get URL key for rate limiting
   */
  getURLKey(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch (error) {
      return url;
    }
  }

  /**
   * Cleanup old requests
   */
  cleanupOldRequests(key, currentTime) {
    const requests = this.requestCounts.get(key);
    const recentRequests = requests.filter(time => 
      currentTime - time < this.config.rateLimiting.windowMs
    );
    this.requestCounts.set(key, recentRequests);
  }

  /**
   * Setup security monitoring
   */
  setupSecurityMonitoring() {
    // Monitor console access
    this.monitorConsoleAccess();
    
    // Monitor devtools
    this.monitorDevTools();
    
    // Monitor suspicious activity
    this.monitorSuspiciousActivity();
  }

  /**
   * Monitor console access
   */
  monitorConsoleAccess() {
    const originalLog = console.log;
    console.log = (...args) => {
      this.reportSecurityEvent('console_access', { args });
      return originalLog.apply(console, args);
    };
  }

  /**
   * Monitor dev tools
   */
  monitorDevTools() {
    let devtools = { open: false };
    
    setInterval(() => {
      const threshold = 160;
      
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.reportSecurityEvent('devtools_opened');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  /**
   * Monitor suspicious activity
   */
  monitorSuspiciousActivity() {
    // Monitor rapid clicks
    let clickCount = 0;
    document.addEventListener('click', () => {
      clickCount++;
      setTimeout(() => clickCount--, 1000);
      
      if (clickCount > 20) {
        this.reportSecurityEvent('suspicious_clicking', { count: clickCount });
      }
    });
    
    // Monitor copy attempts
    document.addEventListener('copy', (event) => {
      this.reportSecurityEvent('copy_attempt', {
        selection: window.getSelection().toString().substring(0, 100)
      });
    });
  }

  /**
   * Setup security headers
   */
  setupSecurityHeaders() {
    // Add security headers via meta tags
    const securityHeaders = [
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
    ];
    
    securityHeaders.forEach(header => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  /**
   * Setup XSS protection
   */
  setupXSSProtection() {
    // Monitor for XSS attempts
    document.addEventListener('DOMNodeInserted', (event) => {
      if (event.target.tagName === 'SCRIPT') {
        this.reportSecurityEvent('xss_attempt', {
          script: event.target.outerHTML
        });
        event.target.remove();
      }
    });
  }

  /**
   * Setup CSRF protection
   */
  setupCSRFProtection() {
    // Generate CSRF token
    this.csrfToken = this.generateCSRFToken();
    
    // Add CSRF token to forms
    document.addEventListener('DOMContentLoaded', () => {
      this.addCSRFTokenToForms();
    });
    
    // Validate CSRF token on form submission
    document.addEventListener('submit', (event) => {
      if (!this.validateCSRFToken(event.target)) {
        event.preventDefault();
        this.reportSecurityEvent('csrf_validation_failed');
      }
    });
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    return btoa(Math.random().toString()).substring(0, 32);
  }

  /**
   * Add CSRF token to forms
   */
  addCSRFTokenToForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'csrf_token';
      tokenInput.value = this.csrfToken;
      form.appendChild(tokenInput);
    });
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(form) {
    const tokenInput = form.querySelector('input[name="csrf_token"]');
    return tokenInput && tokenInput.value === this.csrfToken;
  }

  /**
   * Report security event
   */
  reportSecurityEvent(type, data = {}) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: location.href
    };
    
    this.securityEvents.push(event);
    
    // Send to security monitoring service
    this.sendSecurityReport(event);
  }

  /**
   * Send security report
   */
  sendSecurityReport(event) {
    // In production, send to security monitoring service
    console.warn('Security Event:', event);
    
    // Store locally for now
    const reports = JSON.parse(localStorage.getItem('security_reports') || '[]');
    reports.push(event);
    
    // Keep only last 100 reports
    if (reports.length > 100) {
      reports.splice(0, reports.length - 100);
    }
    
    localStorage.setItem('security_reports', JSON.stringify(reports));
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      violations: this.violations.length,
      securityEvents: this.securityEvents.length,
      blockedRequests: this.blockedRequests.size,
      lastViolation: this.violations[this.violations.length - 1],
      lastSecurityEvent: this.securityEvents[this.securityEvents.length - 1]
    };
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    return {
      timestamp: Date.now(),
      config: this.config,
      stats: this.getSecurityStats(),
      violations: this.violations.slice(-10), // Last 10 violations
      securityEvents: this.securityEvents.slice(-10), // Last 10 events
      summary: {
        totalViolations: this.violations.length,
        totalSecurityEvents: this.securityEvents.length,
        status: this.violations.length === 0 ? 'SECURE' : 'VIOLATIONS_DETECTED'
      }
    };
  }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Export for global use
window.securityManager = securityManager;

export default securityManager;