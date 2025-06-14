# Funding Round Modeling Tool

## Project Overview
A single-page HTML application for modeling startup funding rounds and calculating equity outcomes. The tool will simulate different funding scenarios and provide interactive visualizations of the cap table evolution.

## Core Features

### 1. Initial Setup
- **Founder Shares**: Number of shares allocated to founders upon incorporation
- **Employee Option Pool**: Aggregate employee option pool size (as percentage or number of shares)

### 2. Funding Round Input
For each funding round (Bootstrap, Seed, Series A, B, C, etc.):
- **Pre-Money Valuation**: Company valuation before new investment
- **Investment Amount**: Capital raised in the round
- **Year Invested**: Required for IRR calculations
- **Round Type**: Bootstrap, Seed, Series A, B, C, or Exit

### 3. Calculated Metrics
Auto-calculated for each round:
- **Post-Money Valuation**: Pre-money + Investment
- **Equity Allocated**: Investment / Post-money valuation
- **Shares Post Round**: Total shares after dilution
- **Option Pool Size**: Updated option pool after each round

### 4. Exit Analysis
- **Return on Exit by Stage**: ROI for each funding round
- **Internal Rate of Return (IRR)**: Time-weighted returns
- **Total Return on Investment**: Overall returns
- **ESOP Value**: Employee stock option plan value

### 5. Scenario Simulation
- Interactive sliders/inputs to modify valuations
- Real-time recalculation of all downstream effects
- Compare multiple scenarios side-by-side

## Technical Stack

### Frontend
- **HTML5**: Single-page application
- **Bootstrap 5**: Responsive UI framework
- **Vanilla JavaScript**: Core logic and interactions
- **Chart.js**: Interactive charts and visualizations
- **Local Storage**: Data persistence without backend

### Key Libraries
- Bootstrap 5.3+ for UI components
- Chart.js 4.0+ for visualizations
- No backend framework needed (static HTML file)

## Development Plan

### Phase 1: Core Structure
1. Create HTML structure with Bootstrap layout
2. Implement basic form inputs for company setup
3. Add funding round entry forms with dynamic row addition

### Phase 2: Calculation Engine
1. Implement cap table calculations
2. Add dilution logic for each funding round
3. Create exit scenario calculations
4. Build IRR calculation functions

### Phase 3: Visualizations
1. Integrate Chart.js for cap table evolution
2. Add waterfall charts for returns by stage
3. Create pie charts for ownership distribution
4. Implement scenario comparison charts

### Phase 4: Interactivity & Persistence
1. Add local storage for data persistence
2. Implement scenario simulation with real-time updates
3. Add export functionality (PDF/Excel)
4. Polish UI/UX and add tooltips/help text

## File Structure
```
captable/
├── index.html           # Main application file
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── calculations.js # Cap table calculation logic
│   ├── charts.js       # Chart.js implementations
│   └── storage.js      # Local storage utilities
└── CLAUDE.md           # This documentation
```

## Data Model

### Company Structure
```javascript
{
  founderShares: number,
  initialOptionPool: number,
  rounds: [
    {
      type: string,
      year: number,
      preMoneyValuation: number,
      investment: number,
      // Calculated fields
      postMoneyValuation: number,
      equityAllocated: number,
      sharesPostRound: number,
      optionPoolSize: number
    }
  ],
  exit: {
    year: number,
    valuation: number
  }
}
```

## Additional Feature Suggestions

### Enhanced Analytics
1. **Sensitivity Analysis**: Show how changes in key variables affect outcomes
2. **Benchmark Comparisons**: Industry standard valuation multiples
3. **Liquidation Preferences**: Model different liquidation preferences (1x, 2x, participating)
4. **Anti-Dilution Protection**: Model different anti-dilution provisions

### User Experience
1. **Template Library**: Pre-built scenarios for different industries
2. **Export Options**: PDF reports, CSV data export
3. **Sharing**: Generate shareable links for scenarios
4. **Import**: Upload existing cap table data

### Advanced Features
1. **Convertible Notes**: Model convertible debt and SAFEs
2. **Employee Equity**: Individual employee equity tracking
3. **Vesting Schedules**: Model equity vesting over time
4. **Tax Implications**: Basic tax calculations for different jurisdictions

## Confirmed Requirements

1. **Currency**: Multi-currency support with selector
2. **Advanced Terms**: Include liquidation preferences and anti-dilution with explanatory tooltips
3. **Employee Tracking**: Aggregate ESOP only
4. **Instruments**: Model SAFEs and convertible notes
5. **Export**: CSV export, print to PDF capability
6. **Templates**: SaaS, FinTech, HealthTech industry templates
7. **Revenue Integration**: Revenue input for valuation multiple calculations
8. **Tax**: UK-specific considerations (SEIS/EIS/EMI schemes)
9. **Sensitivity Analysis**: Visual sliders for real-time scenario modeling

## Success Metrics
- Accurate cap table calculations matching industry standards
- Intuitive user interface requiring minimal explanation
- Fast performance with real-time scenario updates
- Reliable data persistence across browser sessions