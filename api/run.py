# api/run.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    # API sur localhost, DB sur 192.168.0.47
    app.run(host='192.168.27.77', port=5000, debug=True)