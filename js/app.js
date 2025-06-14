/**
 * Main application controller for Cap Table Modeling Tool
 */

class CapTableApp {
    constructor() {
        this.company = new Company();
        this.capTableData = null;
        this.returnsData = null;
        this.fundingRoundCount = 0;
        this.charts = {
            ownership: null,
            valuation: null
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            console.log('Initializing Cap Table App...');
            
            // Initialize UI components
            this.initializeUI();
            
            // Load saved data if available
            this.loadFromStorage();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Add default funding round if none exist
            if (this.company.rounds.length === 0) {
                this.addFundingRound();
            }
            
            console.log('Cap Table App initialized successfully');
            
        } catch (error) {
            ErrorHandler.handleError(
                new UIError('initialization', `Failed to initialize application: ${error.message}`)
            );
        }
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize tooltips
        UIUtils.initializeTooltips();
        
        // Setup number formatting for main form fields
        const numberFields = ['founderShares', 'exitValuation'];
        numberFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                UIUtils.setupNumberFormatting(element);
            }
        });
        
        // Clear results panels initially
        this.clearResultsPanels();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Auto-save setup
        this.setupAutoSave();
        
        // Make functions globally available for onclick handlers
        window.loadTemplate = this.loadTemplate.bind(this);
        window.addFundingRound = this.addFundingRound.bind(this);
        window.removeFundingRound = this.removeFundingRound.bind(this);
        window.calculateCapTable = this.calculateCapTable.bind(this);
        window.exportToCSV = this.exportToCSV.bind(this);
        window.clearAll = this.clearAll.bind(this);
    }

    /**
     * Set up auto-save functionality
     */
    setupAutoSave() {
        const debouncedSave = UIUtils.debounce(() => this.saveToStorage(), CONFIG.UI.DEBOUNCE_DELAY);
        
        const autoSaveFields = [
            'currency', 'companyName', 'founderShares', 'optionPool', 
            'optionPoolTopUp', 'useRevenueMultiples', 'exitYear', 'exitValuation', 'exitMultiple'
        ];
        
        autoSaveFields.forEach(fieldId => {
            DOMUtils.addEventListenerSafe(fieldId, 'change', debouncedSave);
            DOMUtils.addEventListenerSafe(fieldId, 'input', debouncedSave);
        });
    }

    /**
     * Load template data
     */
    loadTemplate(templateName) {
        try {
            const template = CONFIG.TEMPLATES[templateName];
            if (!template) {
                throw new DataError('template', `Template '${templateName}' not found`);
            }

            // Clear existing data
            this.clearFundingRounds();
            
            // Load template data with current year adjustments
            const currentYear = DateUtils.getCurrentYear();
            
            DOMUtils.setValue('companyName', template.companyName);
            DOMUtils.setValue('founderShares', NumberUtils.formatWithCommas(template.founderShares));
            DOMUtils.setValue('optionPool', template.optionPool);
            DOMUtils.setValue('exitYear', currentYear + template.exitYearOffset);
            DOMUtils.setValue('exitValuation', NumberUtils.formatWithCommas(template.exitValuation));

            // Load funding rounds
            template.rounds.forEach(roundData => {
                this.addFundingRound();
                const roundId = this.fundingRoundCount - 1;
                
                DOMUtils.setValue(`roundType_${roundId}`, roundData.type);
                DOMUtils.setValue(`roundYear_${roundId}`, currentYear + roundData.yearOffset);
                DOMUtils.setValue(`preMoneyValuation_${roundId}`, NumberUtils.formatWithCommas(roundData.preMoneyValuation));
                DOMUtils.setValue(`investment_${roundId}`, NumberUtils.formatWithCommas(roundData.investment));
                DOMUtils.setValue(`revenue_${roundId}`, NumberUtils.formatWithCommas(roundData.revenue));
            });

            this.showAlert('Template loaded successfully!', 'success');
            
        } catch (error) {
            ErrorHandler.handleError(error, { templateName });
        }
    }

    /**
     * Add new funding round
     */
    addFundingRound() {
        try {
            const roundId = this.fundingRoundCount++;
            const currentYear = DateUtils.getCurrentYear();
            
            const roundHtml = `
                <div class="card mb-3" id="round_${roundId}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Round ${roundId + 1}</h6>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFundingRound(${roundId})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        ${this.generateRoundFormHTML(roundId, currentYear)}
                    </div>
                </div>
            `;
            
            const container = DOMUtils.getElement('fundingRounds');
            container.insertAdjacentHTML('beforeend', roundHtml);
            
            // Initialize tooltips and number formatting for the new round
            this.setupRoundInteractions(roundId);
            
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'addFundingRound' });
        }
    }

    /**
     * Generate HTML for funding round form
     */
    generateRoundFormHTML(roundId, currentYear) {
        const roundTypes = CONFIG.ROUND_TYPES.map(type => 
            `<option value="${type}">${type}</option>`
        ).join('');
        
        const liquidationPrefs = CONFIG.LIQUIDATION_PREFERENCES.map(pref => 
            `<option value="${pref.value}">${pref.label}</option>`
        ).join('');
        
        const antiDilutionOptions = CONFIG.ANTI_DILUTION_OPTIONS.map(option => 
            `<option value="${option.value}">${option.label}</option>`
        ).join('');

        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Round Type</label>
                    <select class="form-select" id="roundType_${roundId}">
                        ${roundTypes}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Year</label>
                    <input type="number" class="form-control" id="roundYear_${roundId}" value="${currentYear}" min="${CONFIG.VALIDATION.MIN_YEAR}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Pre-Money Valuation</label>
                    <input type="text" class="form-control" id="preMoneyValuation_${roundId}" value="${NumberUtils.formatWithCommas(CONFIG.DEFAULTS.ROUND.PRE_MONEY_VALUATION)}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Investment Amount</label>
                    <input type="text" class="form-control" id="investment_${roundId}" value="${NumberUtils.formatWithCommas(CONFIG.DEFAULTS.ROUND.INVESTMENT)}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">
                        Revenue (ARR)
                        <i class="bi bi-info-circle tooltip-icon" data-bs-toggle="tooltip" 
                           title="Annual Recurring Revenue at time of investment"></i>
                    </label>
                    <input type="text" class="form-control" id="revenue_${roundId}" value="0">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">
                        Liquidation Preference
                        <i class="bi bi-info-circle tooltip-icon" data-bs-toggle="tooltip" 
                           title="Minimum return investors get before other shareholders. 1x = get money back first, 2x = get 2x money back first"></i>
                    </label>
                    <select class="form-select" id="liquidationPref_${roundId}">
                        ${liquidationPrefs}
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">
                        Anti-Dilution
                        <i class="bi bi-info-circle tooltip-icon" data-bs-toggle="tooltip" 
                           title="Protection against future down rounds. Weighted Average = moderate protection, Full Ratchet = maximum protection"></i>
                    </label>
                    <select class="form-select" id="antiDilution_${roundId}">
                        ${antiDilutionOptions}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Discount Rate (%)</label>
                    <input type="number" class="form-control" id="discountRate_${roundId}" value="0" step="5" min="0" max="50">
                </div>
            </div>
        `;
    }

    /**
     * Set up interactions for a specific round
     */
    setupRoundInteractions(roundId) {
        // Initialize tooltips
        const tooltips = document.querySelectorAll(`#round_${roundId} [data-bs-toggle="tooltip"]`);
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
        
        // Setup number formatting for monetary fields
        const monetaryFields = [`preMoneyValuation_${roundId}`, `investment_${roundId}`, `revenue_${roundId}`];
        monetaryFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                UIUtils.setupNumberFormatting(element);
            }
        });
        
        // Setup auto-save for all round fields
        const roundFields = [
            `roundType_${roundId}`, `roundYear_${roundId}`, `preMoneyValuation_${roundId}`,
            `investment_${roundId}`, `revenue_${roundId}`, `liquidationPref_${roundId}`,
            `antiDilution_${roundId}`, `discountRate_${roundId}`
        ];
        
        const debouncedSave = UIUtils.debounce(() => this.saveToStorage(), CONFIG.UI.DEBOUNCE_DELAY);
        
        roundFields.forEach(fieldId => {
            DOMUtils.addEventListenerSafe(fieldId, 'change', debouncedSave);
            DOMUtils.addEventListenerSafe(fieldId, 'input', debouncedSave);
        });
    }

    /**
     * Remove funding round
     */
    removeFundingRound(roundId) {
        try {
            const roundElement = document.getElementById(`round_${roundId}`);
            if (roundElement) {
                roundElement.remove();
            }
        } catch (error) {
            ErrorHandler.handleError(error, { roundId });
        }
    }

    /**
     * Clear all funding rounds
     */
    clearFundingRounds() {
        try {
            const container = DOMUtils.getElement('fundingRounds');
            container.innerHTML = '';
            this.fundingRoundCount = 0;
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'clearFundingRounds' });
        }
    }

    /**
     * Collect input data from form
     */
    collectInputData() {
        try {
            const companyData = {
                companyName: DOMUtils.getValue('companyName'),
                currency: DOMUtils.getValue('currency'),
                founderShares: DOMUtils.getNumericValue('founderShares'),
                optionPoolPercent: DOMUtils.getNumericValue('optionPool'),
                optionPoolTopUp: DOMUtils.getCheckboxValue('optionPoolTopUp', true),
                useRevenueMultiples: DOMUtils.getCheckboxValue('useRevenueMultiples', true),
                exitYear: DOMUtils.getIntegerValue('exitYear'),
                exitValuation: DOMUtils.getNumericValue('exitValuation'),
                exitMultiple: DOMUtils.getNumericValue('exitMultiple'),
                rounds: []
            };

            // Collect funding rounds
            for (let i = 0; i < this.fundingRoundCount; i++) {
                const roundElement = document.getElementById(`round_${i}`);
                if (!roundElement) continue;

                const roundData = {
                    id: i,
                    type: DOMUtils.getValue(`roundType_${i}`),
                    year: DOMUtils.getIntegerValue(`roundYear_${i}`),
                    preMoneyValuation: DOMUtils.getNumericValue(`preMoneyValuation_${i}`),
                    investment: DOMUtils.getNumericValue(`investment_${i}`),
                    revenue: DOMUtils.getNumericValue(`revenue_${i}`),
                    liquidationPref: DOMUtils.getValue(`liquidationPref_${i}`, '1x'),
                    antiDilution: DOMUtils.getValue(`antiDilution_${i}`, 'none'),
                    discountRate: DOMUtils.getNumericValue(`discountRate_${i}`)
                };

                companyData.rounds.push(roundData);
            }

            return new Company(companyData);
            
        } catch (error) {
            throw new DataError('input_collection', `Failed to collect input data: ${error.message}`);
        }
    }

    /**
     * Main calculation function
     */
    calculateCapTable() {
        try {
            UIUtils.showLoading('calculateButton');
            
            // Collect and validate input data
            this.company = this.collectInputData();
            
            // Calculate cap table evolution
            this.capTableData = CapTableCalculator.calculateEvolution(this.company);
            
            // Calculate returns and metrics
            this.returnsData = CapTableCalculator.calculateReturns(this.capTableData, this.company);
            
            // Update UI with results
            this.updateUI();
            
            // Save to localStorage
            this.saveToStorage();
            
            this.showAlert('Cap table calculated successfully!', 'success');
            
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'calculateCapTable' });
        } finally {
            UIUtils.hideLoading('calculateButton');
        }
    }

    /**
     * Update UI with calculation results
     */
    updateUI() {
        if (!this.returnsData || !this.capTableData) {
            console.warn('No calculation data available for UI update');
            return;
        }

        try {
            this.updateKeyMetrics();
            this.updateReturnsTable();
            this.updateCharts();
            this.updateSensitivityAnalysis();
            this.updateUKTaxAnalysis();
            
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'updateUI' });
        }
    }

    /**
     * Update key metrics display
     */
    updateKeyMetrics() {
        try {
            const container = DOMUtils.getElement('keyMetrics');
            const finalStage = this.capTableData[this.capTableData.length - 1];
            const currency = this.company.getCurrencySymbol();
            
            const metrics = [
                {
                    title: 'Final Valuation',
                    value: `${currency}${NumberUtils.formatWithCommas(this.company.exitValuation)}`,
                    icon: 'graph-up'
                },
                {
                    title: 'Total Investment',
                    value: `${currency}${NumberUtils.formatWithCommas(this.returnsData.getTotalInvestment())}`,
                    icon: 'cash-stack'
                },
                {
                    title: 'Founder Ownership',
                    value: `${finalStage.founderOwnership.toFixed(1)}%`,
                    icon: 'person-check'
                },
                {
                    title: 'ESOP Pool',
                    value: `${finalStage.optionPoolOwnership.toFixed(1)}%`,
                    icon: 'people'
                }
            ];

            const metricsHTML = metrics.map(metric => `
                <div class="col-md-6 col-lg-3 mb-3">
                    <div class="card metric-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-${metric.icon} display-6 mb-2"></i>
                            <h5>${metric.value}</h5>
                            <small>${metric.title}</small>
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = metricsHTML;
            
        } catch (error) {
            console.error('Failed to update key metrics:', error);
        }
    }

    /**
     * Update returns table
     */
    updateReturnsTable() {
        try {
            const container = DOMUtils.getElement('returnsTable');
            const currency = this.company.getCurrencySymbol();
            
            let tableHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Round</th>
                                <th>Investment</th>
                                <th>Years Held</th>
                                <th>Exit Value</th>
                                <th>Multiple</th>
                                <th>IRR</th>
                                ${this.company.useRevenueMultiples ? '<th>Rev Multiple</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            this.returnsData.roundReturns.forEach(round => {
                const irrClass = round.irr >= 20 ? 'text-success' : round.irr >= 10 ? 'text-warning' : 'text-danger';
                const multipleClass = round.multipleOfMoney >= 3 ? 'text-success' : round.multipleOfMoney >= 2 ? 'text-warning' : 'text-danger';
                
                tableHTML += `
                    <tr>
                        <td><strong>${round.round}</strong><br><small class="text-muted">${round.year}</small></td>
                        <td>${currency}${NumberUtils.formatWithCommas(round.investment)}</td>
                        <td>${round.yearsHeld} years</td>
                        <td>${currency}${NumberUtils.formatWithCommas(round.exitValue)}</td>
                        <td class="${multipleClass}">${round.multipleOfMoney.toFixed(1)}x</td>
                        <td class="${irrClass}">${round.irr.toFixed(1)}%</td>
                        ${this.company.useRevenueMultiples ? `<td>${round.revenueMultiple > 0 ? round.revenueMultiple.toFixed(1) + 'x' : 'N/A'}</td>` : ''}
                    </tr>
                `;
            });
            
            // Add summary row
            const totalInvestment = this.returnsData.getTotalInvestment();
            const totalReturn = this.returnsData.totalInvestorReturn;
            const totalMultiple = totalInvestment > 0 ? totalReturn / totalInvestment : 0;
            const avgIRR = this.returnsData.getWeightedAverageIRR();
            
            tableHTML += `
                        </tbody>
                        <tfoot>
                            <tr class="table-dark">
                                <td><strong>Total</strong></td>
                                <td><strong>${currency}${NumberUtils.formatWithCommas(totalInvestment)}</strong></td>
                                <td>-</td>
                                <td><strong>${currency}${NumberUtils.formatWithCommas(totalReturn)}</strong></td>
                                <td><strong>${totalMultiple.toFixed(1)}x</strong></td>
                                <td><strong>${avgIRR.toFixed(1)}%</strong></td>
                                ${this.company.useRevenueMultiples ? '<td>-</td>' : ''}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Failed to update returns table:', error);
        }
    }

    /**
     * Update charts
     */
    updateCharts() {
        try {
            this.updateOwnershipChart();
            this.updateValuationChart();
        } catch (error) {
            console.error('Failed to update charts:', error);
        }
    }

    /**
     * Update ownership evolution chart
     */
    updateOwnershipChart() {
        const ctx = document.getElementById('ownershipChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.ownership) {
            this.charts.ownership.destroy();
        }

        const labels = this.capTableData.map(stage => stage.stage);
        const foundersData = this.capTableData.map(stage => stage.founderOwnership);
        const esopData = this.capTableData.map(stage => stage.optionPoolOwnership);
        const investorsData = this.capTableData.map(stage => stage.investorOwnership);

        this.charts.ownership = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Founders',
                        data: foundersData,
                        backgroundColor: '#007bff',
                        borderColor: '#0056b3',
                        borderWidth: 1
                    },
                    {
                        label: 'ESOP',
                        data: esopData,
                        backgroundColor: '#28a745',
                        borderColor: '#1e7e34',
                        borderWidth: 1
                    },
                    {
                        label: 'Investors',
                        data: investorsData,
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update valuation growth chart
     */
    updateValuationChart() {
        const ctx = document.getElementById('valuationChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.valuation) {
            this.charts.valuation.destroy();
        }

        const labels = this.capTableData.filter(stage => stage.postMoneyValuation > 0).map(stage => stage.stage);
        const valuationData = this.capTableData.filter(stage => stage.postMoneyValuation > 0).map(stage => stage.postMoneyValuation);
        
        // Add exit valuation
        labels.push('Exit');
        valuationData.push(this.company.exitValuation);

        this.charts.valuation = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valuation',
                    data: valuationData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return NumberUtils.formatWithCommas(value);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const currency = window.capTableApp?.company?.getCurrencySymbol() || '£';
                                return 'Valuation: ' + currency + NumberUtils.formatWithCommas(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update sensitivity analysis
     */
    updateSensitivityAnalysis() {
        try {
            const container = DOMUtils.getElement('sensitivityAnalysis');
            const currency = this.company.getCurrencySymbol();
            
            if (this.company.rounds.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">No funding rounds to analyze</p>';
                return;
            }
            
            // Use the last round for sensitivity analysis
            const lastRoundIndex = this.company.rounds.length - 1;
            const scenarios = CapTableCalculator.calculateSensitivityScenarios(this.company, lastRoundIndex);
            
            let tableHTML = `
                <p class="mb-3"><strong>Scenario Analysis for ${this.company.rounds[lastRoundIndex].type} Round</strong></p>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Scenario</th>
                                <th>Pre-Money</th>
                                <th>Founder Return</th>
                                <th>ESOP Return</th>
                                <th>Round Multiple</th>
                                <th>Round IRR</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            scenarios.forEach(scenario => {
                if (scenario.error) {
                    tableHTML += `
                        <tr class="table-danger">
                            <td>${scenario.label}</td>
                            <td colspan="5">Error: ${scenario.error}</td>
                        </tr>
                    `;
                } else {
                    const irrClass = scenario.roundIRR >= 20 ? 'text-success' : scenario.roundIRR >= 10 ? 'text-warning' : 'text-danger';
                    const multipleClass = scenario.roundMultiple >= 3 ? 'text-success' : scenario.roundMultiple >= 2 ? 'text-warning' : 'text-danger';
                    
                    tableHTML += `
                        <tr class="${scenario.class}">
                            <td><strong>${scenario.label}</strong></td>
                            <td>${currency}${NumberUtils.formatWithCommas(scenario.preMoneyValuation)}</td>
                            <td>${currency}${NumberUtils.formatWithCommas(scenario.founderReturn)}</td>
                            <td>${currency}${NumberUtils.formatWithCommas(scenario.esopReturn)}</td>
                            <td class="${multipleClass}">${scenario.roundMultiple.toFixed(1)}x</td>
                            <td class="${irrClass}">${scenario.roundIRR.toFixed(1)}%</td>
                        </tr>
                    `;
                }
            });
            
            tableHTML += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Failed to update sensitivity analysis:', error);
            const container = DOMUtils.getElement('sensitivityAnalysis');
            container.innerHTML = '<p class="text-danger">Error calculating sensitivity analysis</p>';
        }
    }

    /**
     * Update UK tax analysis
     */
    updateUKTaxAnalysis() {
        try {
            // Show UK tax card only for GBP currency
            const ukTaxCard = DOMUtils.getElement('ukTaxCard');
            if (!ukTaxCard) return;
            
            if (this.company.currency !== 'GBP') {
                ukTaxCard.style.display = 'none';
                return;
            }
            
            ukTaxCard.style.display = 'block';
            
            const container = DOMUtils.getElement('ukTaxResults');
            const taxOptions = {
                seisEligible: DOMUtils.getCheckboxValue('seisEligible', false),
                eisEligible: DOMUtils.getCheckboxValue('eisEligible', false),
                emiScheme: DOMUtils.getCheckboxValue('emiScheme', false)
            };
            
            const benefits = CapTableCalculator.calculateUKTaxBenefits(this.returnsData, taxOptions);
            const currency = this.company.getCurrencySymbol();
            
            let resultsHTML = `
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">SEIS Relief</h6>
                                <p class="card-text">${currency}${NumberUtils.formatWithCommas(benefits.seisRelief)}</p>
                                <small class="text-muted">50% relief on qualifying investments</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">EIS Relief</h6>
                                <p class="card-text">${currency}${NumberUtils.formatWithCommas(benefits.eisRelief)}</p>
                                <small class="text-muted">30% relief on qualifying investments</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">EMI CGT Saving</h6>
                                <p class="card-text">${currency}${NumberUtils.formatWithCommas(benefits.emiSaving)}</p>
                                <small class="text-muted">Reduced CGT rate (10% vs 20%)</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Benefits</h6>
                                <p class="card-text">${currency}${NumberUtils.formatWithCommas(benefits.totalBenefits)}</p>
                                <small>Combined tax advantages</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (benefits.totalBenefits === 0) {
                resultsHTML = '<p class="text-muted text-center">Select tax schemes above to see potential benefits</p>';
            }
            
            container.innerHTML = resultsHTML;
            
        } catch (error) {
            console.error('Failed to update UK tax analysis:', error);
        }
    }

    /**
     * Clear results panels
     */
    clearResultsPanels() {
        const panels = {
            'keyMetrics': '<div class="col-12"><p class="text-muted text-center">Click "Calculate" to see key metrics</p></div>',
            'returnsTable': '<p class="text-muted text-center">Click "Calculate" to see returns analysis</p>',
            'sensitivityAnalysis': '<p class="text-muted text-center">Click "Calculate" to see sensitivity analysis</p>'
        };

        Object.entries(panels).forEach(([id, content]) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = content;
            }
        });

        // Clear charts
        if (this.charts.ownership) {
            this.charts.ownership.destroy();
            this.charts.ownership = null;
        }
        if (this.charts.valuation) {
            this.charts.valuation.destroy();
            this.charts.valuation = null;
        }

        // Hide UK tax card
        DOMUtils.toggleElement('ukTaxCard', false);
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        try {
            if (!this.capTableData || !this.returnsData) {
                this.showAlert('Please calculate the cap table first', 'warning');
                return;
            }

            const csvData = [];
            const currency = this.company.getCurrencySymbol();
            
            // Header
            csvData.push(['Cap Table Analysis Export']);
            csvData.push([`Company: ${this.company.companyName || 'Unnamed Company'}`]);
            csvData.push([`Currency: ${this.company.currency}`]);
            csvData.push([`Export Date: ${new Date().toLocaleDateString()}`]);
            csvData.push([]);
            
            // Cap Table Evolution
            csvData.push(['Cap Table Evolution']);
            csvData.push(['Stage', 'Year', 'Founder %', 'ESOP %', 'Investor %', 'Total Shares', 'Valuation']);
            
            this.capTableData.forEach(stage => {
                csvData.push([
                    stage.stage,
                    stage.year,
                    stage.founderOwnership.toFixed(1) + '%',
                    stage.optionPoolOwnership.toFixed(1) + '%',
                    stage.investorOwnership.toFixed(1) + '%',
                    NumberUtils.formatWithCommas(stage.totalShares),
                    stage.postMoneyValuation > 0 ? currency + NumberUtils.formatWithCommas(stage.postMoneyValuation) : 'N/A'
                ]);
            });
            
            csvData.push([]);
            
            // Returns Analysis
            csvData.push(['Returns Analysis']);
            csvData.push(['Round', 'Year', 'Investment', 'Years Held', 'Exit Value', 'Multiple', 'IRR', 'Revenue Multiple']);
            
            this.returnsData.roundReturns.forEach(round => {
                csvData.push([
                    round.round,
                    round.year,
                    currency + NumberUtils.formatWithCommas(round.investment),
                    round.yearsHeld + ' years',
                    currency + NumberUtils.formatWithCommas(round.exitValue),
                    round.multipleOfMoney.toFixed(1) + 'x',
                    round.irr.toFixed(1) + '%',
                    round.revenueMultiple > 0 ? round.revenueMultiple.toFixed(1) + 'x' : 'N/A'
                ]);
            });
            
            // Summary
            const totalInvestment = this.returnsData.getTotalInvestment();
            const totalReturn = this.returnsData.totalInvestorReturn;
            const totalMultiple = totalInvestment > 0 ? totalReturn / totalInvestment : 0;
            const avgIRR = this.returnsData.getWeightedAverageIRR();
            
            csvData.push([]);
            csvData.push(['Summary']);
            csvData.push(['Total Investment', currency + NumberUtils.formatWithCommas(totalInvestment)]);
            csvData.push(['Total Return', currency + NumberUtils.formatWithCommas(totalReturn)]);
            csvData.push(['Overall Multiple', totalMultiple.toFixed(1) + 'x']);
            csvData.push(['Weighted Avg IRR', avgIRR.toFixed(1) + '%']);
            csvData.push(['Exit Valuation', currency + NumberUtils.formatWithCommas(this.company.exitValuation)]);
            
            // Convert to CSV string
            const csvString = csvData.map(row => 
                row.map(field => `"${field}"`).join(',')
            ).join('\n');
            
            // Download file
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `captable_analysis_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('CSV file downloaded successfully!', 'success');
            
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'exportToCSV' });
        }
    }

    /**
     * Clear all data
     */
    clearAll() {
        if (!confirm('Are you sure you want to clear all data?')) {
            return;
        }

        try {
            // Reset form to defaults
            DOMUtils.setValue('companyName', '');
            DOMUtils.setValue('founderShares', NumberUtils.formatWithCommas(CONFIG.DEFAULTS.FOUNDER_SHARES));
            DOMUtils.setValue('optionPool', CONFIG.DEFAULTS.OPTION_POOL_PERCENT);
            DOMUtils.setValue('exitYear', DateUtils.getCurrentYear() + CONFIG.DEFAULTS.EXIT_YEARS_AHEAD);
            DOMUtils.setValue('exitValuation', NumberUtils.formatWithCommas(CONFIG.DEFAULTS.EXIT_VALUATION));
            DOMUtils.setValue('exitMultiple', CONFIG.DEFAULTS.EXIT_MULTIPLE);
            DOMUtils.setValue('currency', CONFIG.DEFAULTS.CURRENCY);

            // Clear funding rounds and add default
            this.clearFundingRounds();
            this.addFundingRound();

            // Clear results
            this.clearResultsPanels();

            // Clear stored data
            this.company = new Company();
            this.capTableData = null;
            this.returnsData = null;

            // Clear storage
            StorageUtils.remove('capTableData');

            this.showAlert('All data cleared!', 'warning');
            
        } catch (error) {
            ErrorHandler.handleError(error, { action: 'clearAll' });
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage() {
        try {
            const data = this.collectInputData();
            StorageUtils.save('capTableData', {
                company: data.toObject(),
                fundingRoundCount: this.fundingRoundCount,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to save to storage:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        try {
            const saved = StorageUtils.load('capTableData');
            if (!saved || !saved.company) {
                return;
            }

            console.log('Loading saved data...');
            
            // TODO: Implement data loading from storage
            // This would populate the form fields with saved data
            
        } catch (error) {
            console.warn('Failed to load from storage:', error);
        }
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        try {
            const alertDiv = UIUtils.createAlert(message, type, true);
            const container = document.querySelector('.container-fluid');
            if (container) {
                container.insertBefore(alertDiv, container.firstChild);
                
                // Auto-dismiss after delay
                setTimeout(() => {
                    if (alertDiv && alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, CONFIG.UI.ALERT_AUTO_DISMISS);
            }
        } catch (error) {
            console.error('Failed to show alert:', error);
            // Fallback to browser alert
            alert(message);
        }
    }
}

// Global function for backwards compatibility
function showAlert(message, type) {
    if (window.capTableApp) {
        window.capTableApp.showAlert(message, type);
    } else {
        alert(message);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.capTableApp = new CapTableApp();
        console.log('Cap Table App loaded successfully');
    } catch (error) {
        console.error('Failed to initialize Cap Table App:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
});