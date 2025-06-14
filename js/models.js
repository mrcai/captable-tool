/**
 * Data models for Cap Table Modeling Tool
 */

/**
 * Funding Round model
 */
class FundingRound {
    constructor(data = {}) {
        this.id = data.id || null;
        this.type = data.type || CONFIG.DEFAULTS.ROUND.TYPE;
        this.year = data.year || DateUtils.getCurrentYear();
        this.preMoneyValuation = data.preMoneyValuation || CONFIG.DEFAULTS.ROUND.PRE_MONEY_VALUATION;
        this.investment = data.investment || CONFIG.DEFAULTS.ROUND.INVESTMENT;
        this.revenue = data.revenue || CONFIG.DEFAULTS.ROUND.REVENUE;
        this.liquidationPref = data.liquidationPref || CONFIG.DEFAULTS.ROUND.LIQUIDATION_PREF;
        this.antiDilution = data.antiDilution || CONFIG.DEFAULTS.ROUND.ANTI_DILUTION;
        this.discountRate = data.discountRate || CONFIG.DEFAULTS.ROUND.DISCOUNT_RATE;
        
        // Calculated fields
        this.postMoneyValuation = null;
        this.equityPercentage = null;
        this.sharesIssued = null;
        this.ownershipPercent = null;
    }

    /**
     * Calculate post-money valuation
     */
    calculatePostMoney() {
        this.postMoneyValuation = this.preMoneyValuation + this.investment;
        return this.postMoneyValuation;
    }

    /**
     * Calculate equity percentage for this round
     */
    calculateEquityPercentage() {
        if (this.postMoneyValuation === null) {
            this.calculatePostMoney();
        }
        this.equityPercentage = (this.investment / this.postMoneyValuation) * 100;
        return this.equityPercentage;
    }

    /**
     * Calculate revenue multiple
     */
    getRevenueMultiple() {
        if (this.revenue <= 0) return null;
        return this.preMoneyValuation / this.revenue;
    }

    /**
     * Validate round data
     */
    validate() {
        return Validator.validateFundingRound(this);
    }

    /**
     * Export to plain object
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            year: this.year,
            preMoneyValuation: this.preMoneyValuation,
            investment: this.investment,
            revenue: this.revenue,
            liquidationPref: this.liquidationPref,
            antiDilution: this.antiDilution,
            discountRate: this.discountRate,
            postMoneyValuation: this.postMoneyValuation,
            equityPercentage: this.equityPercentage,
            sharesIssued: this.sharesIssued,
            ownershipPercent: this.ownershipPercent
        };
    }
}

/**
 * Company model
 */
class Company {
    constructor(data = {}) {
        this.companyName = data.companyName || '';
        this.currency = data.currency || CONFIG.DEFAULTS.CURRENCY;
        this.founderShares = data.founderShares || CONFIG.DEFAULTS.FOUNDER_SHARES;
        this.optionPoolPercent = data.optionPoolPercent || CONFIG.DEFAULTS.OPTION_POOL_PERCENT;
        this.optionPoolTopUp = data.optionPoolTopUp !== undefined ? data.optionPoolTopUp : true;
        this.useRevenueMultiples = data.useRevenueMultiples !== undefined ? data.useRevenueMultiples : true;
        this.exitYear = data.exitYear || (DateUtils.getCurrentYear() + CONFIG.DEFAULTS.EXIT_YEARS_AHEAD);
        this.exitValuation = data.exitValuation || CONFIG.DEFAULTS.EXIT_VALUATION;
        this.exitMultiple = data.exitMultiple || CONFIG.DEFAULTS.EXIT_MULTIPLE;
        
        this.rounds = [];
        if (data.rounds) {
            this.rounds = data.rounds.map(roundData => new FundingRound(roundData));
        }
    }

    /**
     * Add funding round
     */
    addRound(roundData) {
        const round = new FundingRound(roundData);
        round.id = this.rounds.length;
        this.rounds.push(round);
        return round;
    }

    /**
     * Remove funding round
     */
    removeRound(index) {
        if (index >= 0 && index < this.rounds.length) {
            this.rounds.splice(index, 1);
            // Re-index remaining rounds
            this.rounds.forEach((round, i) => {
                round.id = i;
            });
        }
    }

    /**
     * Get rounds sorted by year
     */
    getRoundsByYear() {
        return DataUtils.sortBy([...this.rounds], 'year', true);
    }

    /**
     * Calculate initial option pool shares
     */
    getInitialOptionPoolShares() {
        return Math.floor(this.founderShares * this.optionPoolPercent / (100 - this.optionPoolPercent));
    }

    /**
     * Get currency symbol
     */
    getCurrencySymbol() {
        return CONFIG.CURRENCIES[this.currency]?.symbol || '£';
    }

    /**
     * Validate company data
     */
    validate() {
        // Validate basic company data
        Validator.validateCompanyData(this);
        
        // Validate all rounds
        this.rounds.forEach((round, index) => {
            try {
                round.validate();
            } catch (error) {
                throw new ValidationError(`Round ${index + 1}`, error.message);
            }
        });

        return true;
    }

    /**
     * Export to plain object
     */
    toObject() {
        return {
            companyName: this.companyName,
            currency: this.currency,
            founderShares: this.founderShares,
            optionPoolPercent: this.optionPoolPercent,
            optionPoolTopUp: this.optionPoolTopUp,
            useRevenueMultiples: this.useRevenueMultiples,
            exitYear: this.exitYear,
            exitValuation: this.exitValuation,
            exitMultiple: this.exitMultiple,
            rounds: this.rounds.map(round => round.toObject())
        };
    }
}

/**
 * Cap Table Stage model (represents cap table at a specific point in time)
 */
class CapTableStage {
    constructor(data = {}) {
        this.stage = data.stage || 'Incorporation';
        this.year = data.year || DateUtils.getCurrentYear();
        this.totalShares = data.totalShares || 0;
        this.founderShares = data.founderShares || 0;
        this.optionPoolShares = data.optionPoolShares || 0;
        this.investorShares = data.investorShares || 0;
        this.newInvestorShares = data.newInvestorShares || 0;
        this.round = data.round || null;
        this.liquidationStack = data.liquidationStack || [];
        
        // Calculated ownership percentages
        this.founderOwnership = data.founderOwnership || 0;
        this.optionPoolOwnership = data.optionPoolOwnership || 0;
        this.investorOwnership = data.investorOwnership || 0;
        this.newInvestorOwnership = data.newInvestorOwnership || 0;
        
        // Valuation data
        this.preMoneyValuation = data.preMoneyValuation || 0;
        this.postMoneyValuation = data.postMoneyValuation || 0;
        this.investment = data.investment || 0;
        this.revenue = data.revenue || 0;
        this.revenueMultiple = data.revenueMultiple || 0;
    }

    /**
     * Calculate ownership percentages
     */
    calculateOwnership() {
        if (this.totalShares === 0) return;
        
        this.founderOwnership = NumberUtils.calculatePercentage(this.founderShares, this.totalShares);
        this.optionPoolOwnership = NumberUtils.calculatePercentage(this.optionPoolShares, this.totalShares);
        this.investorOwnership = NumberUtils.calculatePercentage(this.investorShares, this.totalShares);
        this.newInvestorOwnership = NumberUtils.calculatePercentage(this.newInvestorShares, this.totalShares);
    }

    /**
     * Validate ownership adds up to 100%
     */
    validateOwnership() {
        const total = this.founderOwnership + this.optionPoolOwnership + this.investorOwnership;
        const tolerance = 0.1; // Allow small rounding errors
        
        if (Math.abs(total - 100) > tolerance) {
            throw new CalculationError(
                'ownership_validation',
                `Ownership percentages total ${total.toFixed(2)}%, expected 100%`,
                { stage: this.stage, total, breakdown: {
                    founders: this.founderOwnership,
                    esop: this.optionPoolOwnership,
                    investors: this.investorOwnership
                }}
            );
        }
        
        return true;
    }

    /**
     * Export to plain object
     */
    toObject() {
        return {
            stage: this.stage,
            year: this.year,
            totalShares: this.totalShares,
            founderShares: this.founderShares,
            optionPoolShares: this.optionPoolShares,
            investorShares: this.investorShares,
            newInvestorShares: this.newInvestorShares,
            founderOwnership: this.founderOwnership,
            optionPoolOwnership: this.optionPoolOwnership,
            investorOwnership: this.investorOwnership,
            newInvestorOwnership: this.newInvestorOwnership,
            preMoneyValuation: this.preMoneyValuation,
            postMoneyValuation: this.postMoneyValuation,
            investment: this.investment,
            revenue: this.revenue,
            revenueMultiple: this.revenueMultiple,
            liquidationStack: this.liquidationStack,
            round: this.round ? this.round.toObject() : null
        };
    }
}

/**
 * Returns Analysis model
 */
class ReturnsAnalysis {
    constructor(data = {}) {
        this.exitValuation = data.exitValuation || 0;
        this.exitYear = data.exitYear || DateUtils.getCurrentYear();
        this.founderReturn = data.founderReturn || 0;
        this.esopReturn = data.esopReturn || 0;
        this.totalInvestorReturn = data.totalInvestorReturn || 0;
        this.roundReturns = data.roundReturns || [];
        this.liquidationWaterfall = data.liquidationWaterfall || [];
        this.finalOwnership = data.finalOwnership || {
            founders: 0,
            esop: 0,
            investors: 0
        };
    }

    /**
     * Add round return
     */
    addRoundReturn(roundReturn) {
        this.roundReturns.push(roundReturn);
    }

    /**
     * Get total investment across all rounds
     */
    getTotalInvestment() {
        return this.roundReturns.reduce((total, round) => total + round.investment, 0);
    }

    /**
     * Get weighted average IRR
     */
    getWeightedAverageIRR() {
        const totalInvestment = this.getTotalInvestment();
        if (totalInvestment === 0) return 0;
        
        const weightedIRR = this.roundReturns.reduce((total, round) => {
            const weight = round.investment / totalInvestment;
            return total + (round.irr * weight);
        }, 0);
        
        return weightedIRR;
    }

    /**
     * Export to plain object
     */
    toObject() {
        return {
            exitValuation: this.exitValuation,
            exitYear: this.exitYear,
            founderReturn: this.founderReturn,
            esopReturn: this.esopReturn,
            totalInvestorReturn: this.totalInvestorReturn,
            roundReturns: this.roundReturns,
            liquidationWaterfall: this.liquidationWaterfall,
            finalOwnership: this.finalOwnership
        };
    }
}

// Make models globally available
window.FundingRound = FundingRound;
window.Company = Company;
window.CapTableStage = CapTableStage;
window.ReturnsAnalysis = ReturnsAnalysis;