from flask import Flask, render_template, request, jsonify
import sqlite3
import requests
from datetime import datetime, timedelta
import json

app = Flask(__name__, static_folder='static', template_folder='templates')

TIINGO_API_KEY = "7b4069ced2451d00a1876a0462ca33af408e2564"

# Initialize databases
def init_databases():
    # Search history
    with sqlite3.connect('search_history.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS SearchHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    # Cache table (as per assignment requirements)
    with sqlite3.connect('stock_cache.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS CachedStockData (
                ticker TEXT PRIMARY KEY,
                company_json TEXT,
                stock_json TEXT,
                last_updated DATETIME
            )
        ''')

init_databases()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET', 'POST'])
def search():
    ticker = request.form.get('ticker') if request.method == 'POST' else request.args.get('ticker')
    
    if not ticker:
        return jsonify({"error": "Please enter a ticker symbol"}), 400
    
    ticker = ticker.upper()
    cache_status = ""
    from_cache = False
    
    try:
        # Check cache first
        with sqlite3.connect('stock_cache.db') as cache_conn:
            cache_cursor = cache_conn.cursor()
            cache_cursor.execute('''
                SELECT company_json, stock_json, last_updated 
                FROM CachedStockData 
                WHERE ticker = ?
            ''', (ticker,))
            cached = cache_cursor.fetchone()
            
            if cached and (datetime.utcnow() - datetime.fromisoformat(cached[2])) < timedelta(minutes=15):
                cache_status = "Served from cache"
                company_data = json.loads(cached[0])
                stock_data = json.loads(cached[1])
                from_cache = True
            else:
                # API calls
                company_url = f"https://api.tiingo.com/tiingo/daily/{ticker}?token={TIINGO_API_KEY}"
                stock_url = f"https://api.tiingo.com/iex/{ticker}?token={TIINGO_API_KEY}"
                
                company_res = requests.get(company_url)
                stock_res = requests.get(stock_url)
                company_res.raise_for_status()
                stock_res.raise_for_status()
                
                company_data = company_res.json()
                stock_data = stock_res.json()
                
                # Update cache
                cache_cursor.execute('''
                    INSERT OR REPLACE INTO CachedStockData 
                    VALUES (?, ?, ?, ?)
                ''', (
                    ticker,
                    json.dumps(company_data),
                    json.dumps(stock_data),
                    datetime.utcnow().isoformat()
                ))
                cache_conn.commit()
        
        # Log search history
        with sqlite3.connect('search_history.db') as history_conn:
            history_conn.execute("INSERT INTO SearchHistory (ticker) VALUES (?)", (ticker,))
        
        return jsonify({
            "company": company_data,
            "stock": stock_data,
            "cache_status": cache_status,
            "from_cache": from_cache  # Explicit flag for frontend
        })
        
    except requests.exceptions.RequestException:
        return jsonify({"error": "No record found. Enter a valid symbol."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history')
def history():
    try:
        with sqlite3.connect('search_history.db') as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ticker, timestamp 
                FROM SearchHistory 
                ORDER BY timestamp DESC 
                LIMIT 10
            """)
            history = [{"ticker": row[0], "timestamp": row[1]} for row in cursor.fetchall()]
            return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
