// Advanced logging system with multiple levels and formats
class Logger {
    constructor(context = 'Application') {
        this.context = context;
        this.logLevel = this.getLogLevel();
        this.logToConsole = true;
        this.logToStorage = true;
        this.maxStorageSize = 1000; // Maximum number of logs to store
        this.logBuffer = [];
        this.initializeLogger();
    }

    // Initialize logger
    initializeLogger() {
        this.loadStoredLogs();
        this.setupGlobalErrorHandler();
        this.info('Logger initialized', { context: this.context });
    }

    // Get log level from environment or default to 'info'
    getLogLevel() {
        const level = localStorage.getItem('logLevel') || 'info';
        return level.toLowerCase();
    }

    // Set log level
    setLogLevel(level) {
        this.logLevel = level.toLowerCase();
        localStorage.setItem('logLevel', this.logLevel);
        this.info('Log level changed', { newLevel: this.logLevel });
    }

    // Log levels hierarchy
    getLevelPriority(level) {
        const levels = {
            'debug': 0,
            'info': 1,
            'warn': 2,
            'error': 3,
            'fatal': 4
        };
        return levels[level] || 0;
    }

    // Check if log level should be recorded
    shouldLog(level) {
        return this.getLevelPriority(level) >= this.getLevelPriority(this.logLevel);
    }

    // Format log message
    formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            context: this.context,
            message,
            data: data || {},
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: this.getSessionId()
        };

        return logEntry;
    }

    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = this.generateUniqueId();
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    // Generate unique ID
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Core logging method
    log(level, message, data = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = this.formatMessage(level, message, data);

        // Log to console
        if (this.logToConsole) {
            this.logToConsoleFormatted(logEntry);
        }

        // Store log entry
        if (this.logToStorage) {
            this.storeLogEntry(logEntry);
        }

        // Send to remote logging service if configured
        this.sendToRemoteLogger(logEntry);
    }

    // Log to console with formatting
    logToConsoleFormatted(logEntry) {
        const { level, message, context, timestamp, data } = logEntry;
        const colorStyles = {
            'DEBUG': 'color: #6b7280; font-weight: normal;',
            'INFO': 'color: #3b82f6; font-weight: normal;',
            'WARN': 'color: #f59e0b; font-weight: bold;',
            'ERROR': 'color: #ef4444; font-weight: bold;',
            'FATAL': 'color: #dc2626; font-weight: bold; background: #fee2e2;'
        };

        const style = colorStyles[level] || 'color: #000;';
        const timeStr = new Date(timestamp).toLocaleTimeString();
        
        console.log(
            `%c[${timeStr}] ${level} [${context}] ${message}`,
            style,
            data
        );
    }

    // Store log entry in local storage
    storeLogEntry(logEntry) {
        try {
            this.logBuffer.push(logEntry);
            
            // Maintain buffer size
            if (this.logBuffer.length > this.maxStorageSize) {
                this.logBuffer = this.logBuffer.slice(-this.maxStorageSize);
            }
            
            // Store in localStorage
            localStorage.setItem('appLogs', JSON.stringify(this.logBuffer));
        } catch (error) {
            console.error('Failed to store log entry:', error);
        }
    }

    // Load stored logs
    loadStoredLogs() {
        try {
            const storedLogs = localStorage.getItem('appLogs');
            if (storedLogs) {
                this.logBuffer = JSON.parse(storedLogs);
            }
        } catch (error) {
            console.error('Failed to load stored logs:', error);
            this.logBuffer = [];
        }
    }

    // Send to remote logging service
    async sendToRemoteLogger(logEntry) {
        // This would typically send to a service like LogRocket, Sentry, etc.
        // For now, we'll just store it locally
        try {
            // Example: Send to a remote API
            // await fetch('/api/logs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logEntry)
            // });
        } catch (error) {
            console.error('Failed to send log to remote service:', error);
        }
    }

    // Setup global error handler
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.error('Global error caught', {
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }

    // Debug level logging
    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    // Info level logging
    info(message, data = {}) {
        this.log('info', message, data);
    }

    // Warning level logging
    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    // Error level logging
    error(message, data = {}) {
        this.log('error', message, data);
    }

    // Fatal level logging
    fatal(message, data = {}) {
        this.log('fatal', message, data);
    }

    // Performance timing
    time(label) {
        const startTime = performance.now();
        this.debug(`Timer started: ${label}`);
        
        return {
            end: () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                this.info(`Timer finished: ${label}`, { duration: `${duration.toFixed(2)}ms` });
                return duration;
            }
        };
    }

    // Log user action
    logUserAction(action, details = {}) {
        this.info(`User action: ${action}`, {
            action,
            details,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId()
        });
    }

    // Log system event
    logSystemEvent(event, details = {}) {
        this.info(`System event: ${event}`, {
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // Log API call
    logApiCall(method, url, status, duration, data = {}) {
        const level = status >= 400 ? 'error' : 'info';
        this.log(level, `API ${method} ${url}`, {
            method,
            url,
            status,
            duration: `${duration}ms`,
            data
        });
    }

    // Log database operation
    logDatabaseOperation(operation, collection, document, success, error = null) {
        const level = success ? 'info' : 'error';
        this.log(level, `Database ${operation}`, {
            operation,
            collection,
            document,
            success,
            error
        });
    }

    // Get current user ID (would be integrated with auth system)
    getCurrentUserId() {
        // This would typically get the current user ID from your auth system
        return sessionStorage.getItem('userId') || 'anonymous';
    }

    // Get all logs
    getLogs(level = null, limit = 100) {
        let logs = this.logBuffer;
        
        if (level) {
            logs = logs.filter(log => log.level === level.toUpperCase());
        }
        
        return logs.slice(-limit);
    }

    // Clear all logs
    clearLogs() {
        this.logBuffer = [];
        localStorage.removeItem('appLogs');
        this.info('All logs cleared');
    }

    // Export logs as JSON
    exportLogs() {
        const logs = this.getLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.info('Logs exported', { filename: exportFileDefaultName });
    }

    // Get log statistics
    getLogStats() {
        const stats = {
            total: this.logBuffer.length,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            fatal: 0
        };

        this.logBuffer.forEach(log => {
            const level = log.level.toLowerCase();
            if (stats.hasOwnProperty(level)) {
                stats[level]++;
            }
        });

        return stats;
    }

    // Set remote logging endpoint
    setRemoteEndpoint(endpoint) {
        this.remoteEndpoint = endpoint;
        this.info('Remote logging endpoint set', { endpoint });
    }

    // Enable/disable console logging
    setConsoleLogging(enabled) {
        this.logToConsole = enabled;
        this.info(`Console logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Enable/disable storage logging
    setStorageLogging(enabled) {
        this.logToStorage = enabled;
        this.info(`Storage logging ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Create global logger instance
const logger = new Logger('Application');

// Make Logger available globally for browser usage
if (typeof window !== 'undefined') {
    window.Logger = Logger;
    window.logger = logger;
}
