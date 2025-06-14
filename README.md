# Cap Table Modeling Tool

A web application for modeling startup funding rounds, calculating equity dilution, and analyzing investment returns.

## 🏗️ Architecture

The application has been refactored into a modular architecture for better maintainability, testability, and scalability.

### File Structure

```
captable/
├── index.html              # Main HTML file
├── js/
│   ├── config.js           # Configuration constants
│   ├── errors.js           # Error handling and custom errors
│   ├── utils.js            # Utility functions (DOM, Number, Date, etc.)
│   ├── models.js           # Data models (Company, FundingRound, etc.)
│   ├── calculations.js     # Core calculation engine
│   └── app.js              # Main application controller
├── CLAUDE.md               # Project documentation
└── README.md               # This file
```

## 📁 Module Overview

### `config.js`
- Application configuration constants
- Default values for forms and calculations
- Validation limits and business rules
- Template data for different industries
- UI configuration (timeouts, formats, etc.)

### `errors.js`
- Custom error classes hierarchy
- Error handling utilities
- Input validation functions
- User-friendly error display

### `utils.js`
- **DOMUtils**: Safe DOM manipulation
- **NumberUtils**: Number formatting and calculations
- **DateUtils**: Date/year utilities
- **DataUtils**: Object manipulation helpers
- **UIUtils**: UI interaction helpers
- **StorageUtils**: localStorage wrapper

### `models.js`
- **FundingRound**: Individual funding round data
- **Company**: Company and cap table data
- **CapTableStage**: Cap table at specific point in time
- **ReturnsAnalysis**: Investment returns and metrics

### `calculations.js`
- **CapTableCalculator**: Core calculation engine
- Cap table evolution through funding rounds
- Dilution calculations with option pool management
- Returns analysis and IRR calculations
- Sensitivity analysis scenarios

### `app.js`
- **CapTableApp**: Main application controller
- UI initialization and event handling
- Data collection and validation
- Template loading and management
- Chart and visualization updates

## 🔧 Key Improvements

### 1. **Error Handling**
- Custom error classes for different error types
- Comprehensive input validation
- User-friendly error messages
- Graceful error recovery

### 2. **Configuration Management**
- Centralized configuration in `config.js`
- No hardcoded magic numbers
- Easy to modify business rules
- Environment-specific settings

### 3. **Modular Architecture**
- Separation of concerns
- Reusable utility functions
- Testable individual modules
- Clear dependencies

### 4. **Data Models**
- Structured data representation
- Built-in validation methods
- Type safety through methods
- Export/import capabilities

## 🚀 Features

### Core Functionality
- **Multi-currency support** (GBP, USD, EUR)
- **Dynamic funding rounds** with complex terms
- **Option pool management** (dilution vs. top-up)
- **Liquidation preferences** and anti-dilution
- **Revenue multiple tracking**
- **Real-time calculations**

### Advanced Features
- **Industry templates** (SaaS, FinTech, HealthTech)
- **Sensitivity analysis** with scenario modeling
- **Interactive charts** (ownership evolution, valuation growth)
- **UK tax calculations** (SEIS/EIS/EMI schemes)
- **CSV export** and print functionality
- **Auto-save** with localStorage persistence

### User Experience
- **Number formatting** with commas for readability
- **Responsive design** with Bootstrap 5
- **Tooltips** explaining complex financial terms
- **Form validation** with helpful error messages
- **Template quick-start** options

## 🧪 Usage

1. **Quick Start**: Choose an industry template (SaaS, FinTech, or HealthTech)
2. **Customize**: Adjust company details, funding rounds, and exit scenario
3. **Calculate**: Click "Calculate" to see detailed analysis
4. **Analyze**: Review ownership evolution, returns, and sensitivity scenarios
5. **Export**: Download results as CSV or print to PDF

## 💡 Technical Highlights

### Calculation Accuracy
- Proper dilution modeling for all stakeholders
- Complex liquidation preference handling
- IRR calculations for each funding round
- Option pool top-up vs. dilution scenarios

### Error Prevention
- Input validation at multiple levels
- Type checking and bounds validation
- Graceful handling of edge cases
- User-friendly error messaging

### Performance
- Efficient DOM manipulation
- Debounced auto-save
- Lazy chart initialization
- Optimized calculation algorithms

## 🔧 Development

### Code Quality
- **ESLint-ready**: Clean, consistent code style
- **Modular**: Easy to test and maintain
- **Documented**: JSDoc comments for complex functions
- **Configurable**: Easy to modify business rules

### Implementation Status ✅

**Completed Features:**
- ✅ Modular architecture with 6 separate modules
- ✅ Comprehensive error handling with custom error classes
- ✅ Configuration management system
- ✅ Full UI implementation with all visualization features
- ✅ Cap table calculation engine with dilution modeling
- ✅ Returns analysis with IRR calculations
- ✅ Interactive charts (ownership evolution & valuation growth)
- ✅ Sensitivity analysis with scenario modeling
- ✅ UK tax calculations (SEIS/EIS/EMI)
- ✅ CSV export functionality
- ✅ Auto-save with localStorage persistence
- ✅ Industry templates (SaaS, FinTech, HealthTech)
- ✅ Multi-currency support (GBP, USD, EUR)
- ✅ Number formatting and input validation

### Future Enhancements
- Unit test suite for calculation engine
- Additional chart types and visualizations
- More sophisticated liquidation waterfalls
- Integration with cap table APIs
- Multi-scenario comparison tools

## 📊 Example Scenarios

The tool comes with three pre-built industry templates:

### SaaS Startup
- Seed: £3M pre-money, £500K investment
- Series A: £8M pre-money, £2M investment  
- Series B: £25M pre-money, £10M investment
- Exit: £100M after 6 years

### FinTech Company
- Higher valuations reflecting fintech premiums
- Regulatory consideration in structure
- Exit: £200M after 6 years

### HealthTech Solution
- Longer development cycles
- Regulatory approval considerations
- Exit: £150M after 8 years

Each template includes realistic revenue growth and valuation multiples for the respective industries.

---

## 🤝 Contributing

The modular architecture makes it easy to contribute:

1. **Bug fixes**: Modify specific utility functions
2. **New features**: Add to appropriate modules
3. **UI improvements**: Update `app.js` and HTML
4. **Calculations**: Enhance `calculations.js`
5. **Configuration**: Modify `config.js`

All modules follow consistent patterns and include error handling, making the codebase maintainable and extensible.