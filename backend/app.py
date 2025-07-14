from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import datetime
import io
import openpyxl
import os
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# Configurations
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/smartbudget')

# JWT Setup
jwt = JWTManager(app)

# MongoDB Setup
mongo_client = MongoClient(app.config['MONGO_URI'])
db = mongo_client.get_database()

# Helper: get user id from JWT
def get_user_id():
    return get_jwt_identity()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'SmartBudget backend is running!'}), 200

# User Registration
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'msg': 'Username and password required'}), 400
    if db.users.find_one({'username': username}):
        return jsonify({'msg': 'Username already exists'}), 409
    hashed_pw = generate_password_hash(password)
    db.users.insert_one({'username': username, 'password': hashed_pw})
    return jsonify({'msg': 'User registered successfully'}), 201

# User Login
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = db.users.find_one({'username': username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'msg': 'Invalid username or password'}), 401
    access_token = create_access_token(
        identity={'_id': str(user['_id']), 'username': username},
        expires_delta=timedelta(days=1)
    )
    return jsonify({'access_token': access_token, 'username': username}), 200

# Add Income
@app.route('/api/income', methods=['POST'])
@jwt_required()
def add_income():
    data = request.get_json()
    amount = data.get('amount')
    source = data.get('source')
    date = data.get('date', datetime.datetime.utcnow().isoformat())
    if not amount or not source:
        return jsonify({'msg': 'Amount and source required'}), 400
    income = {
        'user_id': get_user_id(),
        'amount': float(amount),
        'source': source,
        'date': date
    }
    db.income.insert_one(income)
    return jsonify({'msg': 'Income added'}), 201

# Get All Income
@app.route('/api/income', methods=['GET'])
@jwt_required()
def get_income():
    user_id = get_user_id()
    income = list(db.income.find({'user_id': user_id}))
    for i in income:
        i['_id'] = str(i['_id'])
    return jsonify(income), 200

# Delete Income
@app.route('/api/income/<income_id>', methods=['DELETE'])
@jwt_required()
def delete_income(income_id):
    user_id = get_user_id()
    result = db.income.delete_one({'_id': ObjectId(income_id), 'user_id': user_id})
    if result.deleted_count == 0:
        return jsonify({'msg': 'Income not found'}), 404
    return jsonify({'msg': 'Income deleted'}), 200

# Update Income
@app.route('/api/income/<income_id>', methods=['PUT'])
@jwt_required()
def update_income(income_id):
    user_id = get_user_id()
    data = request.get_json()
    update_fields = {}
    if 'amount' in data:
        update_fields['amount'] = float(data['amount'])
    if 'source' in data:
        update_fields['source'] = data['source']
    if 'date' in data:
        update_fields['date'] = data['date']
    if not update_fields:
        return jsonify({'msg': 'No fields to update'}), 400
    result = db.income.update_one({'_id': ObjectId(income_id), 'user_id': user_id}, {'$set': update_fields})
    if result.matched_count == 0:
        return jsonify({'msg': 'Income not found'}), 404
    return jsonify({'msg': 'Income updated'}), 200

# Export Income to Excel
@app.route('/api/income/export', methods=['GET'])
@jwt_required()
def export_income():
    user_id = get_user_id()
    income = list(db.income.find({'user_id': user_id}))
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(['Source', 'Amount', 'Date'])
    for i in income:
        ws.append([i['source'], i['amount'], i['date']])
    file_stream = io.BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)
    return send_file(file_stream, as_attachment=True, download_name='income.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# Add Expense
@app.route('/api/expenses', methods=['POST'])
@jwt_required()
def add_expense():
    data = request.get_json()
    amount = data.get('amount')
    category = data.get('category')
    description = data.get('description', '')
    date = data.get('date', datetime.datetime.utcnow().isoformat())
    if not amount or not category:
        return jsonify({'msg': 'Amount and category required'}), 400
    expense = {
        'user_id': get_user_id(),
        'amount': float(amount),
        'category': category,
        'description': description,
        'date': date
    }
    db.expenses.insert_one(expense)
    return jsonify({'msg': 'Expense added'}), 201

# Get All Expenses
@app.route('/api/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    user_id = get_user_id()
    expenses = list(db.expenses.find({'user_id': user_id}))
    for e in expenses:
        e['_id'] = str(e['_id'])
    return jsonify(expenses), 200

# Delete Expense
@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user_id = get_user_id()
    result = db.expenses.delete_one({'_id': db.expenses.ObjectId(expense_id), 'user_id': user_id})
    if result.deleted_count == 0:
        return jsonify({'msg': 'Expense not found'}), 404
    return jsonify({'msg': 'Expense deleted'}), 200

# Export Expenses to Excel
@app.route('/api/expenses/export', methods=['GET'])
@jwt_required()
def export_expenses():
    user_id = get_user_id()
    expenses = list(db.expenses.find({'user_id': user_id}))
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(['Category', 'Amount', 'Description', 'Date'])
    for e in expenses:
        ws.append([e['category'], e['amount'], e.get('description', ''), e['date']])
    file_stream = io.BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)
    return send_file(file_stream, as_attachment=True, download_name='expenses.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# Recent Transactions (last 5 income and expenses)
@app.route('/api/transactions/recent', methods=['GET'])
@jwt_required()
def recent_transactions():
    user_id = get_user_id()
    recent_income = list(db.income.find({'user_id': user_id}).sort('date', -1).limit(5))
    recent_expenses = list(db.expenses.find({'user_id': user_id}).sort('date', -1).limit(5))
    for i in recent_income:
        i['_id'] = str(i['_id'])
    for e in recent_expenses:
        e['_id'] = str(e['_id'])
    return jsonify({'income': recent_income, 'expenses': recent_expenses}), 200

if __name__ == '__main__':
    app.run(debug=True) 