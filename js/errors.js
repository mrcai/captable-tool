/**
 * Custom error classes and error handling utilities
 */

/**
 * Base class for application-specific errors
 */
class CapTableError extends Error {
    constructor(message, code = 'GENERAL_ERROR') {
        super(message);
        this.name = 'CapTableError';
        this.code = code;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Validation errors for user input
 */
class ValidationError extends CapTableError {
    constructor(field, message, value = null) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

/**
 * Calculation errors for mathematical operations
 */
class CalculationError extends CapTableError {
    constructor(operation, message, data = null) {
        super(message, 'CALCULATION_ERROR');
        this.name = 'CalculationError';
        this.operation = operation;
        this.data = data;
    }
}

/**
 * Data errors for malformed or missing data
 */
class DataError extends CapTableError {
    constructor(dataType, message, data = null) {
        super(message, 'DATA_ERROR');
        this.name = 'DataError';
        this.dataType = dataType;
        this.data = data;
    }
}

/**
 * UI errors for DOM manipulation issues
 */
class UIError extends CapTableError {
    constructor(element, message) {
        super(message, 'UI_ERROR');
        this.name = 'UIError';
        this.element = element;
    }
}

/**
 * Error handler utility class
 */
class ErrorHandler {
    static logError(error, context = {}) {
        console.error('CapTable Error:', {
            name: error.name,
            message: error.message,
            code: error.code,
            timestamp: error.timestamp,
            context: context,
            stack: error.stack
        });
    }

    static showUserError(error, fallbackMessage = 'An unexpected error occurred') {
        let userMessage = fallbackMessage;
        let alertType = 'danger';

        if (error instanceof ValidationError) {
            userMessage = `Invalid ${error.field}: ${error.message}`;
            alertType = 'warning';
        } else if (error instanceof CalculationError) {
            userMessage = `Calculation error in ${error.operation}: ${error.message}`;
            alertType = 'danger';
        } else if (error instanceof DataError) {
            userMessage = `Data error: ${error.message}`;
            alertType = 'warning';
        } else if (error instanceof UIError) {
            userMessage = `Interface error: ${error.message}`;
            alertType = 'warning';
        } else if (error instanceof CapTableError) {
            userMessage = error.message;
        }

        // Show alert to user (assumes showAlert function exists)
        if (typeof showAlert === 'function') {
            showAlert(userMessage, alertType);
        } else {
            alert(userMessage);
        }
    }

    static handleError(error, context = {}, showToUser = true) {
        this.logError(error, context);
        
        if (showToUser) {
            this.showUserError(error);
        }
    }

    static wrapAsync(asyncFn, context = {}) {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                this.handleError(error, { ...context, args });
                throw error;
            }
        };
    }

    static wrapSync(syncFn, context = {}) {
        return (...args) => {
            try {
                return syncFn(...args);
            } catch (error) {
                this.handleError(error, { ...context, args });
                throw error;
            }
        };
    }
}

/**
 * Input validation utilities
 */
class Validator {
    static validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new ValidationError(fieldName, `${fieldName} is required`);
        }
        return true;
    }

    static validateNumber(value, fieldName, min = null, max = null) {
        this.validateRequired(value, fieldName);
        
        const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        
        if (isNaN(num)) {
            throw new ValidationError(fieldName, `${fieldName} must be a valid number`, value);
        }

        if (min !== null && num < min) {
            throw new ValidationError(fieldName, `${fieldName} must be at least ${min}`, value);
        }

        if (max !== null && num > max) {
            throw new ValidationError(fieldName, `${fieldName} must be no more than ${max}`, value);
        }

        return num;
    }

    static validateInteger(value, fieldName, min = null, max = null) {
        const num = this.validateNumber(value, fieldName, min, max);
        
        if (!Number.isInteger(num)) {
            throw new ValidationError(fieldName, `${fieldName} must be a whole number`, value);
        }

        return num;
    }

    static validateYear(value, fieldName) {
        return this.validateInteger(
            value, 
            fieldName, 
            CONFIG.VALIDATION.MIN_YEAR, 
            CONFIG.VALIDATION.MAX_YEAR
        );
    }

    static validatePercentage(value, fieldName) {
        return this.validateNumber(value, fieldName, 0, 100);
    }

    static validateCurrency(value, fieldName) {
        this.validateRequired(value, fieldName);
        
        if (!CONFIG.CURRENCIES[value]) {
            throw new ValidationError(fieldName, `Invalid currency: ${value}`, value);
        }

        return value;
    }

    static validateRoundType(value, fieldName) {
        this.validateRequired(value, fieldName);
        
        if (!CONFIG.ROUND_TYPES.includes(value)) {
            throw new ValidationError(fieldName, `Invalid round type: ${value}`, value);
        }

        return value;
    }

    static validateCompanyData(data) {
        const errors = [];

        try {
            Validator.validateRequired(data.companyName, 'Company Name');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateInteger(
                data.founderShares, 
                'Founder Shares',
                CONFIG.VALIDATION.MIN_FOUNDER_SHARES,
                CONFIG.VALIDATION.MAX_FOUNDER_SHARES
            );
        } catch (e) { errors.push(e); }

        try {
            Validator.validatePercentage(data.optionPoolPercent, 'Option Pool Percentage');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateCurrency(data.currency, 'Currency');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateYear(data.exitYear, 'Exit Year');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateNumber(
                data.exitValuation,
                'Exit Valuation',
                CONFIG.VALIDATION.MIN_VALUATION,
                CONFIG.VALIDATION.MAX_VALUATION
            );
        } catch (e) { errors.push(e); }

        if (errors.length > 0) {
            throw new ValidationError('Company Data', `${errors.length} validation error(s)`, errors);
        }

        return true;
    }

    static validateFundingRound(round) {
        const errors = [];

        try {
            Validator.validateRoundType(round.type, 'Round Type');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateYear(round.year, 'Round Year');
        } catch (e) { errors.push(e); }

        try {
            Validator.validateNumber(
                round.preMoneyValuation,
                'Pre-Money Valuation',
                CONFIG.VALIDATION.MIN_VALUATION,
                CONFIG.VALIDATION.MAX_VALUATION
            );
        } catch (e) { errors.push(e); }

        try {
            Validator.validateNumber(
                round.investment,
                'Investment Amount',
                CONFIG.VALIDATION.MIN_INVESTMENT,
                CONFIG.VALIDATION.MAX_INVESTMENT
            );
        } catch (e) { errors.push(e); }

        try {
            Validator.validateNumber(round.revenue, 'Revenue', 0);
        } catch (e) { errors.push(e); }

        if (errors.length > 0) {
            throw new ValidationError('Funding Round', `${errors.length} validation error(s) in ${round.type}`, errors);
        }

        return true;
    }
}

// Make classes globally available
window.CapTableError = CapTableError;
window.ValidationError = ValidationError;
window.CalculationError = CalculationError;
window.DataError = DataError;
window.UIError = UIError;
window.ErrorHandler = ErrorHandler;
window.Validator = Validator;