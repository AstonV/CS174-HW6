
# Stock Search Application

 A Flask-based web application that retrieves and displays real-time stock market data using the Tiingo API. It features search history tracking and caching functionality.

Live Deployment: [http://35.171.27.228:8000/](http://35.171.27.228:8000/)

## Features

- Real-Time Stock Data: Retrieve company outlook and stock summaries.
- Search History: Track the last 10 searches using SQLite.
- Intelligent Caching: Store API responses for 15 minutes to improve performance.
- Responsive Design: Compatible with desktop and mobile devices.
- User-Friendly Interface: Organized results with clear error messages.

## Technical Stack

- Backend: Python Flask
- Frontend: HTML5, CSS3, JavaScript (Fetch API)
- Database: SQLite (search_history.db, stock_cache.db)
- API: Tiingo Stock Market Data
- Hosting: AWS EC2 (Amazon Linux 2023)

## Installation (Development Setup)

1. Clone the repository:
```bash
git clone 
cd stock-app
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install the dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
echo "TIINGO_API_KEY=api_key_here" > .env
```
(Replace `api_key_here` with actual Tiingo API Key.)

5. Run the application:
```bash
python app.py
```

## File Structure

```
stock-app/
├── app.py                # Flask application
├── requirements.txt      # Python dependencies
├── search_history.db     # Database for search history
├── stock_cache.db        # Database for caching stock data
├── static/
│   ├── script.js         # JavaScript for frontend logic
│   └── style.css         # CSS styles
└── templates/
    └── index.html        # Main HTML template
```

## API Endpoints

- `GET /` : Main application interface.
- `GET /search?ticker=<symbol>` : Retrieve stock data for a given ticker symbol.
- `GET /history` : Retrieve the last 10 search queries in JSON format.


