// Global helper functions
function safeInnerHTML(element, content) {
    if (element) element.innerHTML = content;
}

// Cache notice display - now takes container as parameter
function showCacheNotice(message, container = document.body) {
    const cacheNote = document.createElement('div');
    cacheNote.className = 'cache-notice';
    cacheNote.innerHTML = `
        <span class="cache-icon">✓</span>
        ${message} (${new Date().toLocaleTimeString()})
    `;
    
    container.prepend(cacheNote);
    
    // Auto-fade after 5 seconds
    setTimeout(() => {
        cacheNote.style.opacity = '0';
        setTimeout(() => cacheNote.remove(), 1000);
    }, 5000);
}

// Tab Management
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            openTab(tabName);
        });
    });
    openTab('company'); // Default tab
}

function openTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const activeTab = document.getElementById(tabName);
    if (activeTab) activeTab.style.display = 'block';
    
    // Activate clicked tab button
    const activeButton = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (activeButton) activeButton.classList.add('active');

    // Load history if needed
    if (tabName === 'history') loadSearchHistory();
}

// Data Rendering Functions
function renderCompanyData(data, tableElement) {
    if (!tableElement) return;
    
    const description = data.description 
        ? data.description.split('\n').slice(0, 5).join('<br>')
        : 'No description available';

    tableElement.innerHTML = `
        <tr><th>Company Name</th><td>${data.name || 'N/A'}</td></tr>
        <tr><th>Ticker Symbol</th><td>${data.ticker || 'N/A'}</td></tr>
        <tr><th>Exchange</th><td>${data.exchangeCode || 'N/A'}</td></tr>
        <tr><th>Start Date</th><td>${data.startDate || 'N/A'}</td></tr>
        <tr><th>Description</th><td>${description}</td></tr>
    `;
}

function renderStockData(data, tableElement) {
    if (!tableElement || !data) return;

    // Extract and format data
    const ticker = data.ticker || 'N/A';
    const tradingDay = data.timestamp ? new Date(data.timestamp).toLocaleDateString() : 'N/A';
    const prevClose = data.prevClose?.toFixed(2) || 'N/A';
    const openPrice = data.open?.toFixed(2) || 'N/A';
    const highPrice = data.high?.toFixed(2) || 'N/A';
    const lowPrice = data.low?.toFixed(2) || 'N/A';
    const lastPrice = data.last?.toFixed(2) || 'N/A';
    const volume = data.volume?.toLocaleString() || 'N/A';

    // Calculate changes
    const numericPrevClose = parseFloat(prevClose) || 0;
    const numericLast = parseFloat(lastPrice) || 0;
    const change = numericLast - numericPrevClose;
    const changePercent = numericPrevClose !== 0 ? (change / numericPrevClose * 100).toFixed(2) : '0.00';

    // Determine arrow and color
    const arrow = change >= 0 ? '↑' : '↓';
    const color = change >= 0 ? 'green' : 'red';

    tableElement.innerHTML = `
        <tr><th>Ticker Symbol</th><td>${ticker}</td></tr>
        <tr><th>Trading Day</th><td>${tradingDay}</td></tr>
        <tr><th>Previous Closing Price</th><td>$${prevClose}</td></tr>
        <tr><th>Opening Price</th><td>$${openPrice}</td></tr>
        <tr><th>High Price</th><td>$${highPrice}</td></tr>
        <tr><th>Low Price</th><td>$${lowPrice}</td></tr>
        <tr><th>Last Price</th><td>$${lastPrice}</td></tr>
        <tr><th>Change</th><td style="color: ${color}">${arrow} $${Math.abs(change).toFixed(2)}</td></tr>
        <tr><th>Change %</th><td style="color: ${color}">${arrow} ${Math.abs(changePercent)}%</td></tr>
        <tr><th>Number of Shares Traded</th><td>${volume}</td></tr>
    `;
}

// Search History Functions
async function loadSearchHistory() {
    const historyTable = document.getElementById('historyTable');
    if (!historyTable) return;

    try {
        historyTable.innerHTML = '<tr><td class="loading-message">Loading history...</td></tr>';
        const response = await fetch('/history');
        const history = await response.json();
        renderHistoryData(history);
    } catch (error) {
        console.error("History load failed:", error);
        historyTable.innerHTML = '<tr><td class="table-error-message">Error loading history</td></tr>';
    }
}

function renderHistoryData(history) {
    const table = document.getElementById('historyTable');
    if (!table) return;

    if (!history?.length) {
        table.innerHTML = '<tr><td class="table-message">No search history</td></tr>';
        return;
    }

    table.innerHTML = `
        <tr><th>Ticker</th><th>Search Time</th></tr>
        ${history.map(item => `
            <tr>
                <td><a href="#" class="history-link" data-ticker="${item.ticker}">${item.ticker}</a></td>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
            </tr>
        `).join('')}
    `;

    // Add click handlers to history items
    document.querySelectorAll('.history-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const ticker = link.dataset.ticker;
            const tickerInput = document.getElementById('ticker');
            const searchForm = document.getElementById('searchForm');
            
            if (tickerInput) tickerInput.value = ticker;
            if (searchForm) {
                openTab('company');
                searchForm.dispatchEvent(new Event('submit'));
            }
        });
    });
}

// Main DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get all DOM elements with null checks
    const elements = {
        searchForm: document.getElementById('searchForm'),
        tickerInput: document.getElementById('ticker'),
        errorDisplay: document.getElementById('error'),
        companyTable: document.getElementById('companyTable'),
        stockTable: document.getElementById('stockTable'),
        historyTable: document.getElementById('historyTable'),
        clearBtn: document.getElementById('clearBtn'),
        resultsContainer: document.getElementById('results-container') || document.body
    };

    // 2. Debug: Log missing elements
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) console.warn(`Element not found: ${name}`);
    });

    // 3. Form Submission Handler
    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ticker = elements.tickerInput?.value.trim().toUpperCase() || '';
            
            // Switch to Company Outlook tab immediately when search is initiated
            openTab('company');
            
            // Clear previous errors and cache notices
            if (elements.errorDisplay) {
                elements.errorDisplay.textContent = '';
                elements.errorDisplay.style.display = 'none';
            }
            
            // Basic validation
            if (!ticker) {
                if (elements.tickerInput) elements.tickerInput.reportValidity();
                return;
            }
            
            // Show loading states
            safeInnerHTML(elements.companyTable, '<tr><td class="loading-message">Loading company data...</td></tr>');
            safeInnerHTML(elements.stockTable, '<tr><td class="loading-message">Loading stock data...</td></tr>');

            try {
                const response = await fetch(`/search?ticker=${ticker}`);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                
                const data = await response.json();
                if (data.company?.detail === "Not found.") throw new Error("Invalid ticker symbol");

                // Show cache status if served from cache
                if (data.from_cache) {
                    showCacheNotice(data.cache_status, elements.resultsContainer);
                }

                // Render data with animation for fresh data
                if (data.company) {
                    renderCompanyData(data.company, elements.companyTable);
                    if (!data.from_cache) {
                        elements.companyTable.classList.add('new-data');
                        setTimeout(() => elements.companyTable.classList.remove('new-data'), 2000);
                    }
                }
                if (data.stock?.[0]) {
                    renderStockData(data.stock[0], elements.stockTable);
                    if (!data.from_cache) {
                        elements.stockTable.classList.add('new-data');
                        setTimeout(() => elements.stockTable.classList.remove('new-data'), 2000);
                    }
                }
            } catch (error) {
                console.error("Fetch failed:", error);
                
                // Show error message in the error display div
                if (elements.errorDisplay) {
                    elements.errorDisplay.textContent = "Error: No record has been found, please enter a valid symbol.";
                    elements.errorDisplay.style.display = 'block';
                }
                
                // Show error in tables with consistent styling
                const errorHTML = '<tr><td colspan="2" class="table-error-message">Error: No record has been found, please enter a valid symbol.</td></tr>';
                safeInnerHTML(elements.companyTable, errorHTML);
                safeInnerHTML(elements.stockTable, errorHTML);
            }
        });
    }

    // 4. Clear Button Handler
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => {
            if (elements.tickerInput) elements.tickerInput.value = '';
            if (elements.errorDisplay) {
                elements.errorDisplay.textContent = '';
                elements.errorDisplay.style.display = 'none';
            }
            safeInnerHTML(elements.companyTable, '<tr><td class="table-message">Enter a ticker symbol to view company data</td></tr>');
            safeInnerHTML(elements.stockTable, '<tr><td class="table-message">Enter a ticker symbol to view stock data</td></tr>');
            document.querySelectorAll('.cache-notice').forEach(el => el.remove());
        });
    }

    // 5. Tab System Initialization
    initTabs();
});
