/**
 * Utility functions for Cap Table Modeling Tool
 */

/**
 * DOM manipulation utilities
 */
class DOMUtils {
    /**
     * Safely get element by ID
     */
    static getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new UIError(id, `Element with ID '${id}' not found`);
        }
        return element;
    }

    /**
     * Safely get element value
     */
    static getValue(id, defaultValue = '') {
        try {
            const element = this.getElement(id);
            return element.value || defaultValue;
        } catch (error) {
            console.warn(`Could not get value for element ${id}:`, error.message);
            return defaultValue;
        }
    }

    /**
     * Safely set element value
     */
    static setValue(id, value) {
        try {
            const element = this.getElement(id);
            element.value = value;
            return true;
        } catch (error) {
            console.warn(`Could not set value for element ${id}:`, error.message);
            return false;
        }
    }

    /**
     * Get numeric value with comma removal
     */
    static getNumericValue(id, defaultValue = 0) {
        const value = this.getValue(id).toString().replace(/,/g, '');
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Get integer value
     */
    static getIntegerValue(id, defaultValue = 0) {
        const num = this.getNumericValue(id, defaultValue);
        return Math.floor(num);
    }

    /**
     * Get checkbox value
     */
    static getCheckboxValue(id, defaultValue = false) {
        try {
            const element = this.getElement(id);
            return element.checked;
        } catch (error) {
            console.warn(`Could not get checkbox value for element ${id}:`, error.message);
            return defaultValue;
        }
    }

    /**
     * Show/hide element
     */
    static toggleElement(id, show) {
        try {
            const element = this.getElement(id);
            element.style.display = show ? 'block' : 'none';
        } catch (error) {
            console.warn(`Could not toggle element ${id}:`, error.message);
        }
    }

    /**
     * Add event listener safely
     */
    static addEventListenerSafe(id, event, handler) {
        try {
            const element = this.getElement(id);
            element.addEventListener(event, handler);
            return true;
        } catch (error) {
            console.warn(`Could not add event listener to ${id}:`, error.message);
            return false;
        }
    }
}

/**
 * Number formatting utilities
 */
class NumberUtils {
    /**
     * Format number with commas
     */
    static formatWithCommas(num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }
        return num.toLocaleString();
    }

    /**
     * Format currency amount
     */
    static formatCurrency(amount, currency = 'GBP') {
        const symbol = CONFIG.CURRENCIES[currency]?.symbol || '£';
        const formattedAmount = this.formatNumber(amount);
        return `${symbol}${formattedAmount}`;
    }

    /**
     * Format large numbers with K/M/B suffixes
     */
    static formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }

        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(1) + 'B';
        }
        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1) + 'M';
        }
        if (num >= 1_000) {
            return (num / 1_000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    /**
     * Parse number from formatted string
     */
    static parseNumber(str) {
        if (typeof str === 'number') {
            return str;
        }
        
        const cleaned = str.toString().replace(/,/g, '');
        const num = parseFloat(cleaned);
        
        if (isNaN(num)) {
            throw new ValidationError('number', `Invalid number format: ${str}`);
        }
        
        return num;
    }

    /**
     * Calculate percentage
     */
    static calculatePercentage(part, whole, decimals = 1) {
        if (whole === 0) return 0;
        return parseFloat(((part / whole) * 100).toFixed(decimals));
    }

    /**
     * Calculate IRR (Internal Rate of Return)
     */
    static calculateIRR(investment, returnAmount, years) {
        if (years <= 0 || investment <= 0) return 0;
        
        const multiple = returnAmount / investment;
        if (multiple <= 0) return -100;
        
        return (Math.pow(multiple, 1 / years) - 1) * 100;
    }
}

/**
 * Date utilities
 */
class DateUtils {
    /**
     * Get current year
     */
    static getCurrentYear() {
        return new Date().getFullYear();
    }

    /**
     * Validate year is reasonable
     */
    static isValidYear(year) {
        const currentYear = this.getCurrentYear();
        return year >= CONFIG.VALIDATION.MIN_YEAR && year <= CONFIG.VALIDATION.MAX_YEAR;
    }

    /**
     * Calculate years between two years
     */
    static yearsBetween(startYear, endYear) {
        return Math.max(0, endYear - startYear);
    }
}

/**
 * Data utilities
 */
class DataUtils {
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            throw new DataError('clone', 'Failed to clone object', obj);
        }
    }

    /**
     * Check if object is empty
     */
    static isEmpty(obj) {
        return obj === null || obj === undefined || 
               (typeof obj === 'object' && Object.keys(obj).length === 0) ||
               (typeof obj === 'string' && obj.trim() === '');
    }

    /**
     * Merge objects safely
     */
    static merge(...objects) {
        return Object.assign({}, ...objects);
    }

    /**
     * Get nested property safely
     */
    static getNestedProperty(obj, path, defaultValue = null) {
        try {
            return path.split('.').reduce((current, key) => current[key], obj) || defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * Sort array of objects by property
     */
    static sortBy(array, property, ascending = true) {
        return array.sort((a, b) => {
            const aVal = this.getNestedProperty(a, property);
            const bVal = this.getNestedProperty(b, property);
            
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    }
}

/**
 * UI utilities
 */
class UIUtils {
    /**
     * Debounce function
     */
    static debounce(func, wait = CONFIG.UI.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Show loading state
     */
    static showLoading(elementId) {
        DOMUtils.toggleElement('loadingSpinner', true);
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
        }
    }

    /**
     * Hide loading state
     */
    static hideLoading(elementId) {
        DOMUtils.toggleElement('loadingSpinner', false);
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
        }
    }

    /**
     * Setup number formatting for input field
     */
    static setupNumberFormatting(element) {
        if (!element) return;

        element.addEventListener('input', function(e) {
            UIUtils.formatNumberInput(e.target);
        });
        
        element.addEventListener('focus', function(e) {
            // Remove formatting on focus for easier editing
            const value = e.target.value.replace(/,/g, '');
            e.target.value = value;
        });
        
        element.addEventListener('blur', function(e) {
            // Add formatting back on blur
            UIUtils.formatNumberInput(e.target);
        });
    }

    /**
     * Format number input field
     */
    static formatNumberInput(input) {
        if (!input) return;
        
        let value = input.value.replace(/,/g, '');
        if (value && !isNaN(value)) {
            const num = parseInt(value);
            input.value = NumberUtils.formatWithCommas(num);
        }
    }

    /**
     * Setup tooltips
     */
    static initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        return tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    /**
     * Create alert element
     */
    static createAlert(message, type = 'info', dismissible = true) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} ${dismissible ? 'alert-dismissible' : ''} fade show`;
        alertDiv.setAttribute('role', 'alert');
        
        alertDiv.innerHTML = `
            ${message}
            ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : ''}
        `;
        
        return alertDiv;
    }
}

/**
 * Storage utilities
 */
class StorageUtils {
    /**
     * Save to localStorage with error handling
     */
    static save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * Load from localStorage with error handling
     */
    static load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove from localStorage
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    /**
     * Clear all localStorage
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }
}

// Make utilities globally available
window.DOMUtils = DOMUtils;
window.NumberUtils = NumberUtils;
window.DateUtils = DateUtils;
window.DataUtils = DataUtils;
window.UIUtils = UIUtils;
window.StorageUtils = StorageUtils;