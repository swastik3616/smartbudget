# SmartBudget Backend

This is the Flask backend API for SmartBudget.

## Features

- JWT authentication (register/login)
- CRUD for income and expenses (with categories)
- Excel export for income and expenses
- Recent transactions endpoint
- MongoDB integration

## Setup

### 1. Create a virtual environment and install dependencies

```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set environment variables

Create a `.env` file in the backend directory:

```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_secret_key
MONGO_URI=mongodb://localhost:27017/smartbudget
JWT_SECRET_KEY=your_jwt_secret
```

### 3. Run the backend server

```sh
flask run
```

The API will be available at [http://localhost:5000/api](http://localhost:5000/api).

## API Endpoints

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT
- `GET /api/income` — Get all income
- `POST /api/income` — Add income
- `PUT /api/income/<id>` — Edit income
- `DELETE /api/income/<id>` — Delete income
- `GET /api/income/export` — Export income to Excel
- (Similar endpoints for expenses)

## Folder Structure

- `app.py` — Main Flask app
- `models/` — Database models
- `routes/` — API routes
- `utils/` — Utility functions

---

## License

MIT 