/**
 * Configuration constants for Cap Table Modeling Tool
 */
const CONFIG = {
    // Default values for new companies
    DEFAULTS: {
        FOUNDER_SHARES: 10_000_000,
        OPTION_POOL_PERCENT: 20,
        EXIT_YEARS_AHEAD: 6,
        EXIT_VALUATION: 100_000_000,
        EXIT_MULTIPLE: 5,
        CURRENCY: 'GBP',
        
        // Funding round defaults
        ROUND: {
            PRE_MONEY_VALUATION: 5_000_000,
            INVESTMENT: 1_000_000,
            REVENUE: 0,
            LIQUIDATION_PREF: '1x',
            ANTI_DILUTION: 'none',
            DISCOUNT_RATE: 0
        }
    },

    // Validation limits
    VALIDATION: {
        MIN_YEAR: 2020,
        MAX_YEAR: 2050,
        MIN_FOUNDER_SHARES: 1,
        MAX_FOUNDER_SHARES: 1_000_000_000,
        MIN_OPTION_POOL: 0,
        MAX_OPTION_POOL: 100,
        MIN_VALUATION: 1,
        MAX_VALUATION: 1_000_000_000_000,
        MIN_INVESTMENT: 1,
        MAX_INVESTMENT: 1_000_000_000_000
    },

    // Currency configuration
    CURRENCIES: {
        'GBP': { symbol: '£', name: 'British Pound' },
        'USD': { symbol: '$', name: 'US Dollar' },
        'EUR': { symbol: '€', name: 'Euro' }
    },

    // Round types
    ROUND_TYPES: [
        'Bootstrap',
        'Pre-Seed', 
        'Seed',
        'Series A',
        'Series B', 
        'Series C',
        'Series D',
        'Growth',
        'SAFE',
        'Convertible'
    ],

    // Liquidation preferences
    LIQUIDATION_PREFERENCES: [
        { value: '1x', label: '1x Non-Participating' },
        { value: '1x-participating', label: '1x Participating' },
        { value: '2x', label: '2x Non-Participating' },
        { value: '2x-participating', label: '2x Participating' }
    ],

    // Anti-dilution options
    ANTI_DILUTION_OPTIONS: [
        { value: 'none', label: 'None' },
        { value: 'weighted-average', label: 'Weighted Average' },
        { value: 'full-ratchet', label: 'Full Ratchet' }
    ],

    // UI configuration
    UI: {
        DEBOUNCE_DELAY: 1000,
        ALERT_AUTO_DISMISS: 3000,
        CHART_HEIGHT: 400,
        NUMBER_FORMAT_THRESHOLD: 1000
    },

    // Sensitivity analysis
    SENSITIVITY: {
        SCENARIOS: [
            { label: '-20%', multiplier: 0.8, class: 'text-danger' },
            { label: '-10%', multiplier: 0.9, class: 'text-warning' },
            { label: 'Base', multiplier: 1.0, class: 'fw-bold' },
            { label: '+10%', multiplier: 1.1, class: 'text-success' },
            { label: '+20%', multiplier: 1.2, class: 'text-success' }
        ]
    },

    // Template configurations
    TEMPLATES: {
        saas: {
            companyName: "SaaS Startup Co",
            founderShares: 10_000_000,
            optionPool: 20,
            rounds: [
                { type: "Seed", yearOffset: 0, preMoneyValuation: 3_000_000, investment: 500_000, revenue: 50_000 },
                { type: "Series A", yearOffset: 1, preMoneyValuation: 8_000_000, investment: 2_000_000, revenue: 500_000 },
                { type: "Series B", yearOffset: 3, preMoneyValuation: 25_000_000, investment: 10_000_000, revenue: 2_000_000 }
            ],
            exitYearOffset: 6,
            exitValuation: 100_000_000,
            exitRevenue: 20_000_000
        },
        fintech: {
            companyName: "FinTech Innovations Ltd",
            founderShares: 10_000_000,
            optionPool: 15,
            rounds: [
                { type: "Seed", yearOffset: 0, preMoneyValuation: 5_000_000, investment: 1_000_000, revenue: 100_000 },
                { type: "Series A", yearOffset: 1, preMoneyValuation: 15_000_000, investment: 5_000_000, revenue: 1_000_000 },
                { type: "Series B", yearOffset: 3, preMoneyValuation: 50_000_000, investment: 20_000_000, revenue: 5_000_000 }
            ],
            exitYearOffset: 6,
            exitValuation: 200_000_000,
            exitRevenue: 50_000_000
        },
        healthtech: {
            companyName: "HealthTech Solutions",
            founderShares: 10_000_000,
            optionPool: 18,
            rounds: [
                { type: "Seed", yearOffset: 0, preMoneyValuation: 2_000_000, investment: 500_000, revenue: 0 },
                { type: "Series A", yearOffset: 2, preMoneyValuation: 8_000_000, investment: 3_000_000, revenue: 200_000 },
                { type: "Series B", yearOffset: 4, preMoneyValuation: 30_000_000, investment: 15_000_000, revenue: 2_000_000 }
            ],
            exitYearOffset: 8,
            exitValuation: 150_000_000,
            exitRevenue: 25_000_000
        }
    },

    // UK Tax schemes
    TAX_SCHEMES: {
        SEIS: {
            name: 'SEIS',
            fullName: 'Seed Enterprise Investment Scheme',
            reliefRate: 0.5,
            maxInvestment: 200_000,
            description: '50% income tax relief, CGT exemption'
        },
        EIS: {
            name: 'EIS', 
            fullName: 'Enterprise Investment Scheme',
            reliefRate: 0.3,
            maxInvestment: 1_000_000,
            description: '30% income tax relief, CGT deferral'
        },
        EMI: {
            name: 'EMI',
            fullName: 'Enterprise Management Incentives',
            cgtRate: 0.1,
            standardCgtRate: 0.2,
            description: 'CGT rate: 10% vs 20%'
        }
    }
};

// Make config globally available
window.CONFIG = CONFIG;