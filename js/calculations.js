/**
 * Core calculation engine for Cap Table Modeling Tool
 */

class CapTableCalculator {
    /**
     * Calculate cap table evolution through funding rounds
     */
    static calculateEvolution(company) {
        try {
            // Validate input
            company.validate();
            
            const evolution = [];
            const rounds = company.getRoundsByYear();
            
            // Initialize tracking variables
            let founderShares = company.founderShares;
            let optionPoolShares = company.getInitialOptionPoolShares();
            let totalInvestorShares = 0;
            
            // Create initial incorporation stage
            const incorporationStage = this._createIncorporationStage(
                company, 
                founderShares, 
                optionPoolShares,
                rounds[0]?.year
            );
            evolution.push(incorporationStage);
            
            // Process each funding round
            for (const round of rounds) {
                const stage = this._processRound(
                    round,
                    founderShares,
                    optionPoolShares,
                    totalInvestorShares,
                    company,
                    evolution[evolution.length - 1]
                );
                
                // Update tracking variables
                optionPoolShares = stage.optionPoolShares;
                totalInvestorShares = stage.investorShares;
                
                evolution.push(stage);
            }
            
            return evolution;
            
        } catch (error) {
            throw new CalculationError(
                'cap_table_evolution',
                `Failed to calculate cap table evolution: ${error.message}`,
                { company: company.toObject() }
            );
        }
    }

    /**
     * Create incorporation stage
     */
    static _createIncorporationStage(company, founderShares, optionPoolShares, firstRoundYear) {
        const totalShares = founderShares + optionPoolShares;
        const year = firstRoundYear ? firstRoundYear - 1 : DateUtils.getCurrentYear();
        
        const stage = new CapTableStage({
            stage: 'Incorporation',
            year: year,
            totalShares: totalShares,
            founderShares: founderShares,
            optionPoolShares: optionPoolShares,
            investorShares: 0,
            newInvestorShares: 0,
            liquidationStack: []
        });
        
        stage.calculateOwnership();
        stage.validateOwnership();
        
        return stage;
    }

    /**
     * Process a single funding round
     */
    static _processRound(round, founderShares, optionPoolShares, totalInvestorShares, company, previousStage) {
        try {
            const postMoneyValuation = round.preMoneyValuation + round.investment;
            
            // Calculate ownership percentage for new investors
            const investorOwnershipPercent = (round.investment / postMoneyValuation) * 100;
            
            // Calculate total shares before this round
            let totalSharesBefore = founderShares + optionPoolShares + totalInvestorShares;
            
            // Calculate new shares to issue for investors
            const newInvestorShares = Math.floor(
                totalSharesBefore * investorOwnershipPercent / (100 - investorOwnershipPercent)
            );
            
            // Handle option pool top-up if enabled
            let optionPoolTopUpShares = 0;
            if (company.optionPoolTopUp) {
                const targetOptionPoolShares = Math.floor(
                    (totalSharesBefore + newInvestorShares) * company.optionPoolPercent / 100
                );
                optionPoolTopUpShares = Math.max(0, targetOptionPoolShares - optionPoolShares);
                optionPoolShares += optionPoolTopUpShares;
            }
            
            // Update totals
            const newTotalInvestorShares = totalInvestorShares + newInvestorShares;
            const totalSharesAfter = totalSharesBefore + newInvestorShares + optionPoolTopUpShares;
            
            // Create liquidation stack entry
            const liquidationStack = [...previousStage.liquidationStack];
            liquidationStack.push({
                round: round.type,
                investment: round.investment,
                preference: round.liquidationPref,
                shares: newInvestorShares,
                year: round.year,
                ownershipPercent: (newInvestorShares / totalSharesAfter) * 100
            });
            
            // Create stage
            const stage = new CapTableStage({
                stage: round.type,
                year: round.year,
                round: round,
                totalShares: totalSharesAfter,
                founderShares: founderShares,
                optionPoolShares: optionPoolShares,
                investorShares: newTotalInvestorShares,
                newInvestorShares: newInvestorShares,
                preMoneyValuation: round.preMoneyValuation,
                postMoneyValuation: postMoneyValuation,
                investment: round.investment,
                revenue: round.revenue,
                revenueMultiple: round.revenue > 0 ? postMoneyValuation / round.revenue : 0,
                liquidationStack: liquidationStack
            });
            
            stage.calculateOwnership();
            stage.validateOwnership();
            
            return stage;
            
        } catch (error) {
            throw new CalculationError(
                'round_processing',
                `Failed to process ${round.type} round: ${error.message}`,
                { round: round.toObject() }
            );
        }
    }

    /**
     * Calculate returns analysis
     */
    static calculateReturns(capTableEvolution, company) {
        try {
            if (!capTableEvolution || capTableEvolution.length === 0) {
                throw new DataError('cap_table', 'Cap table evolution is empty');
            }
            
            const finalStage = capTableEvolution[capTableEvolution.length - 1];
            const exitValuation = company.exitValuation;
            const exitYear = company.exitYear;
            
            // Calculate basic returns based on ownership percentages
            const founderReturn = (finalStage.founderOwnership / 100) * exitValuation;
            const esopReturn = (finalStage.optionPoolOwnership / 100) * exitValuation;
            const totalInvestorReturn = (finalStage.investorOwnership / 100) * exitValuation;
            
            // Calculate individual round returns
            const roundReturns = this._calculateRoundReturns(
                company.rounds,
                finalStage.liquidationStack,
                exitValuation,
                exitYear
            );
            
            // Create returns analysis
            const returns = new ReturnsAnalysis({
                exitValuation: exitValuation,
                exitYear: exitYear,
                founderReturn: founderReturn,
                esopReturn: esopReturn,
                totalInvestorReturn: totalInvestorReturn,
                roundReturns: roundReturns,
                liquidationWaterfall: [], // Simplified for now
                finalOwnership: {
                    founders: finalStage.founderOwnership,
                    esop: finalStage.optionPoolOwnership,
                    investors: finalStage.investorOwnership
                }
            });
            
            return returns;
            
        } catch (error) {
            throw new CalculationError(
                'returns_calculation',
                `Failed to calculate returns: ${error.message}`,
                { 
                    capTableLength: capTableEvolution?.length,
                    company: company.toObject()
                }
            );
        }
    }

    /**
     * Calculate returns for individual rounds
     */
    static _calculateRoundReturns(rounds, liquidationStack, exitValuation, exitYear) {
        const roundReturns = [];
        
        for (const round of rounds) {
            try {
                const yearsHeld = DateUtils.yearsBetween(round.year, exitYear);
                
                // Find this round's entry in the liquidation stack
                const roundEntry = liquidationStack.find(
                    entry => entry.round === round.type && entry.year === round.year
                );
                
                if (!roundEntry) {
                    console.warn(`No liquidation stack entry found for ${round.type} round`);
                    continue;
                }
                
                // Calculate return based on actual ownership percentage
                const investorReturn = (roundEntry.ownershipPercent / 100) * exitValuation;
                const multipleOfMoney = round.investment > 0 ? investorReturn / round.investment : 0;
                const irr = NumberUtils.calculateIRR(round.investment, investorReturn, yearsHeld);
                
                roundReturns.push({
                    round: round.type,
                    year: round.year,
                    investment: round.investment,
                    yearsHeld: yearsHeld,
                    exitValue: investorReturn,
                    multipleOfMoney: multipleOfMoney,
                    irr: irr,
                    revenue: round.revenue,
                    revenueMultiple: round.getRevenueMultiple() || 0,
                    ownershipPercent: roundEntry.ownershipPercent
                });
                
            } catch (error) {
                console.error(`Error calculating returns for ${round.type}:`, error);
                // Continue with other rounds
            }
        }
        
        return roundReturns;
    }

    /**
     * Calculate scenario sensitivity analysis
     */
    static calculateSensitivityScenarios(company, roundIndex, scenarios = CONFIG.SENSITIVITY.SCENARIOS) {
        try {
            const baselineRound = company.rounds[roundIndex];
            if (!baselineRound) {
                throw new DataError('round', `Round index ${roundIndex} not found`);
            }
            
            const scenarioResults = [];
            
            for (const scenario of scenarios) {
                try {
                    // Create modified company data
                    const modifiedCompany = new Company(company.toObject());
                    modifiedCompany.rounds[roundIndex].preMoneyValuation = 
                        baselineRound.preMoneyValuation * scenario.multiplier;
                    
                    // Calculate scenario results
                    const capTable = this.calculateEvolution(modifiedCompany);
                    const returns = this.calculateReturns(capTable, modifiedCompany);
                    
                    // Find the specific round's return data
                    const roundReturn = returns.roundReturns.find(r => r.round === baselineRound.type);
                    
                    scenarioResults.push({
                        label: scenario.label,
                        class: scenario.class,
                        multiplier: scenario.multiplier,
                        preMoneyValuation: modifiedCompany.rounds[roundIndex].preMoneyValuation,
                        founderReturn: returns.founderReturn,
                        esopReturn: returns.esopReturn,
                        totalInvestorReturn: returns.totalInvestorReturn,
                        roundMultiple: roundReturn ? roundReturn.multipleOfMoney : 0,
                        roundIRR: roundReturn ? roundReturn.irr : 0
                    });
                    
                } catch (error) {
                    console.error(`Error in scenario ${scenario.label}:`, error);
                    // Add empty result to maintain array consistency
                    scenarioResults.push({
                        label: scenario.label,
                        class: scenario.class,
                        error: error.message
                    });
                }
            }
            
            return scenarioResults;
            
        } catch (error) {
            throw new CalculationError(
                'sensitivity_analysis',
                `Failed to calculate sensitivity scenarios: ${error.message}`,
                { roundIndex, company: company.toObject() }
            );
        }
    }

    /**
     * Calculate UK tax benefits
     */
    static calculateUKTaxBenefits(returns, taxOptions = {}) {
        try {
            const benefits = {
                seisRelief: 0,
                eisRelief: 0,
                emiSaving: 0,
                totalBenefits: 0
            };
            
            if (taxOptions.seisEligible && returns.roundReturns.length > 0) {
                const seisInvestment = Math.min(
                    returns.roundReturns[0].investment,
                    CONFIG.TAX_SCHEMES.SEIS.maxInvestment
                );
                benefits.seisRelief = seisInvestment * CONFIG.TAX_SCHEMES.SEIS.reliefRate;
            }
            
            if (taxOptions.eisEligible) {
                const eisInvestment = Math.min(
                    returns.totalInvestorReturn,
                    CONFIG.TAX_SCHEMES.EIS.maxInvestment
                );
                benefits.eisRelief = eisInvestment * CONFIG.TAX_SCHEMES.EIS.reliefRate;
            }
            
            if (taxOptions.emiScheme) {
                const cgtSaving = (CONFIG.TAX_SCHEMES.EMI.standardCgtRate - CONFIG.TAX_SCHEMES.EMI.cgtRate);
                benefits.emiSaving = returns.esopReturn * cgtSaving;
            }
            
            benefits.totalBenefits = benefits.seisRelief + benefits.eisRelief + benefits.emiSaving;
            
            return benefits;
            
        } catch (error) {
            throw new CalculationError(
                'tax_calculation',
                `Failed to calculate UK tax benefits: ${error.message}`,
                { returns: returns.toObject(), taxOptions }
            );
        }
    }
}

// Make calculator globally available
window.CapTableCalculator = CapTableCalculator;