from flask import Flask, jsonify, request, send_file, make_response
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import io
import openpyxl
import os
from bson import ObjectId
import jwt  # Add this for JWT handling
from functools import wraps
from datetime import timedelta
from dateutil import parser as date_parser

app = Flask(__name__)
CORS(app)

# Configurations
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/smartbudget')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'supersecretkey')

# MongoDB Setup
mongo_client = MongoClient(app.config['MONGO_URI'])
db = mongo_client.get_database()

# Use a fixed test user id for all operations
TEST_USER_ID = 'testuser'

# --- JWT Auth Helper ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'msg': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
        except Exception as e:
            return jsonify({'msg': 'Token is invalid!', 'error': str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'SmartBudget backend is running!'}), 200

# User Registration (still works, but not used for auth)
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

# User Login (returns dummy token)
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = db.users.find_one({'username': username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'msg': 'Invalid username or password'}), 401
    # Generate JWT token
    token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({'access_token': token, 'username': username}), 200

# Add Income
@app.route('/api/income', methods=['POST'])
@token_required
def add_income(current_user):
    data = request.get_json()
    amount = data.get('amount')
    source = data.get('source')
    date_str = data.get('date')
    if date_str:
        try:
            date = date_parser.isoparse(date_str)
        except Exception:
            date = datetime.datetime.utcnow()
    else:
        date = datetime.datetime.utcnow()
    is_recurring = data.get('is_recurring', False)
    recurrence = data.get('recurrence', None)  # e.g., 'monthly', 'weekly', etc.
    next_occurrence_str = data.get('next_occurrence')
    next_occurrence = None
    if next_occurrence_str:
        try:
            next_occurrence = date_parser.isoparse(next_occurrence_str)
        except Exception:
            next_occurrence = None
    if not amount or not source:
        return jsonify({'msg': 'Amount and source required'}), 400
    income = {
        'user_id': current_user,
        'amount': float(amount),
        'source': source,
        'date': date,
        'is_recurring': is_recurring,
        'recurrence': recurrence,
        'next_occurrence': next_occurrence
    }
    db.income.insert_one(income)
    return jsonify({'msg': 'Income added'}), 201

# Get All Income
@app.route('/api/income', methods=['GET'])
@token_required
def get_income(current_user):
    income = list(db.income.find({'user_id': current_user}))
    for i in income:
        i['_id'] = str(i['_id'])
    return jsonify(income), 200

# Delete Income
@app.route('/api/income/<income_id>', methods=['DELETE'])
@token_required
def delete_income(current_user, income_id):
    result = db.income.delete_one({'_id': ObjectId(income_id), 'user_id': current_user})
    if result.deleted_count == 0:
        return jsonify({'msg': 'Income not found'}), 404
    return jsonify({'msg': 'Income deleted'}), 200

# Update Income
@app.route('/api/income/<income_id>', methods=['PUT'])
@token_required
def update_income(current_user, income_id):
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
    result = db.income.update_one({'_id': ObjectId(income_id), 'user_id': current_user}, {'$set': update_fields})
    if result.matched_count == 0:
        return jsonify({'msg': 'Income not found'}), 404
    return jsonify({'msg': 'Income updated'}), 200

# Export Income to Excel
@app.route('/api/income/export', methods=['GET'])
@token_required
def export_income(current_user):
    income = list(db.income.find({'user_id': current_user}))
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
@token_required
def add_expense(current_user):
    data = request.get_json()
    amount = data.get('amount')
    category = data.get('category')
    description = data.get('description', '')
    date_str = data.get('date')
    if date_str:
        try:
            date = date_parser.isoparse(date_str)
        except Exception:
            date = datetime.datetime.utcnow()
    else:
        date = datetime.datetime.utcnow()
    is_recurring = data.get('is_recurring', False)
    recurrence = data.get('recurrence', None)
    next_occurrence_str = data.get('next_occurrence')
    next_occurrence = None
    if next_occurrence_str:
        try:
            next_occurrence = date_parser.isoparse(next_occurrence_str)
        except Exception:
            next_occurrence = None
    if not amount or not category:
        return jsonify({'msg': 'Amount and category required'}), 400
    expense = {
        'user_id': current_user,
        'amount': float(amount),
        'category': category,
        'description': description,
        'date': date,
        'is_recurring': is_recurring,
        'recurrence': recurrence,
        'next_occurrence': next_occurrence
    }
    db.expenses.insert_one(expense)
    return jsonify({'msg': 'Expense added'}), 201

# Get All Expenses
@app.route('/api/expenses', methods=['GET'])
@token_required
def get_expenses(current_user):
    expenses = list(db.expenses.find({'user_id': current_user}))
    for e in expenses:
        e['_id'] = str(e['_id'])
    return jsonify(expenses), 200

# Delete Expense
@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
@token_required
def delete_expense(current_user, expense_id):
    result = db.expenses.delete_one({'_id': ObjectId(expense_id), 'user_id': current_user})
    if result.deleted_count == 0:
        return jsonify({'msg': 'Expense not found'}), 404
    return jsonify({'msg': 'Expense deleted'}), 200

# Export Expenses to Excel
@app.route('/api/expenses/export', methods=['GET'])
@token_required
def export_expenses(current_user):
    expenses = list(db.expenses.find({'user_id': current_user}))
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
@token_required
def recent_transactions(current_user):
    recent_income = list(db.income.find({'user_id': current_user}).sort('date', -1).limit(5))
    recent_expenses = list(db.expenses.find({'user_id': current_user}).sort('date', -1).limit(5))
    for i in recent_income:
        i['_id'] = str(i['_id'])
    for e in recent_expenses:
        e['_id'] = str(e['_id'])
    return jsonify({'income': recent_income, 'expenses': recent_expenses}), 200

# Profile avatar endpoints
@app.route('/api/profile/avatar', methods=['GET'])
def get_profile_avatar():
    user = db.users.find_one({'username': 'testuser'})
    if not user:
        return jsonify({'profilePic': '', 'emoji': ''}), 200
    return jsonify({
        'profilePic': user.get('profilePic', ''),
        'emoji': user.get('emoji', '')
    }), 200

@app.route('/api/profile/avatar', methods=['POST'])
def update_profile_avatar():
    data = request.get_json()
    profilePic = data.get('profilePic', '')
    emoji = data.get('emoji', '')
    db.users.update_one(
        {'username': 'testuser'},
        {'$set': {'profilePic': profilePic, 'emoji': emoji}},
        upsert=True
    )
    return jsonify({'msg': 'Profile avatar updated'}), 200

# --- Budget Endpoints ---
@app.route('/api/budgets', methods=['GET'])
@token_required
def get_budgets(current_user):
    budgets = list(db.budgets.find({'user_id': current_user}))
    for b in budgets:
        b['_id'] = str(b['_id'])
    return jsonify(budgets), 200

@app.route('/api/budgets', methods=['POST'])
@token_required
def set_budget(current_user):
    data = request.get_json()
    category = data.get('category')
    period = data.get('period', 'monthly')  # 'monthly' or 'annual'
    amount = data.get('amount')
    if not category or not amount:
        return jsonify({'msg': 'Category and amount required'}), 400
    # Upsert budget
    db.budgets.update_one(
        {'user_id': current_user, 'category': category, 'period': period},
        {'$set': {'amount': float(amount)}},
        upsert=True
    )
    return jsonify({'msg': 'Budget set'}), 200

@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
@token_required
def delete_budget(current_user, budget_id):
    result = db.budgets.delete_one({'_id': ObjectId(budget_id), 'user_id': current_user})
    if result.deleted_count == 0:
        return jsonify({'msg': 'Budget not found'}), 404
    return jsonify({'msg': 'Budget deleted'}), 200

@app.route('/api/dashboard/summary', methods=['GET'])
@token_required
def dashboard_summary(current_user):
    # now = datetime.datetime.utcnow()
    # first_of_month = datetime.datetime(now.year, now.month, 1)
    # Get all expenses for this user (no date filter for debugging)
    expenses = list(db.expenses.find({
        'user_id': current_user
    }))
    # Get all income for this user (no date filter for debugging)
    income = list(db.income.find({
        'user_id': current_user
    }))
    # Get all budgets for this user (monthly only)
    budgets = list(db.budgets.find({'user_id': current_user, 'period': 'monthly'}))
    # Calculate totals
    total_income = sum(i['amount'] for i in income)
    total_expenses = sum(e['amount'] for e in expenses)
    balance = total_income - total_expenses
    # Calculate actual spending per category
    category_totals = {}
    for e in expenses:
        cat = e['category']
        category_totals[cat] = category_totals.get(cat, 0) + e['amount']
    # Prepare budget progress per category
    budget_progress = []
    alerts = []
    for b in budgets:
        cat = b['category']
        budget_amount = b['amount']
        spent = category_totals.get(cat, 0)
        over_under = spent - budget_amount
        alert = over_under > 0
        alert_msg = f"Over budget by {over_under:.2f}" if alert else ""
        if alert:
            alerts.append({
                'category': cat,
                'message': alert_msg,
                'over_by': over_under
            })
        budget_progress.append({
            'category': cat,
            'budget': budget_amount,
            'spent': spent,
            'over_under': over_under,
            'alert': alert,
            'alert_msg': alert_msg
        })
    # Also include categories with spending but no budget
    for cat, spent in category_totals.items():
        if not any(bp['category'] == cat for bp in budget_progress):
            over_under = spent
            alert = over_under > 0
            alert_msg = f"No budget set. Spent {spent:.2f}" if alert else ""
            if alert:
                alerts.append({
                    'category': cat,
                    'message': alert_msg,
                    'over_by': over_under
                })
            budget_progress.append({
                'category': cat,
                'budget': 0,
                'spent': spent,
                'over_under': over_under,
                'alert': alert,
                'alert_msg': alert_msg
            })
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': balance,
        'budget_progress': budget_progress,
        'alerts': alerts
    }), 200

@app.route('/api/expense-categories', methods=['GET'])
@token_required
def get_expense_categories(current_user):
    categories = db.expenses.distinct('category', {'user_id': current_user})
    return jsonify({'categories': categories}), 200

@app.route('/api/income/filter', methods=['GET'])
@token_required
def filter_income(current_user):
    query = {'user_id': current_user}
    source = request.args.get('source')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    is_recurring = request.args.get('is_recurring')
    recurrence = request.args.get('recurrence')
    if source:
        query['source'] = source
    if min_amount is not None:
        query['amount'] = query.get('amount', {})
        query['amount']['$gte'] = min_amount
    if max_amount is not None:
        query['amount'] = query.get('amount', {})
        query['amount']['$lte'] = max_amount
    if start_date:
        try:
            dt = date_parser.isoparse(start_date)
            query['date'] = query.get('date', {})
            query['date']['$gte'] = dt
        except Exception:
            pass
    if end_date:
        try:
            dt = date_parser.isoparse(end_date)
            query['date'] = query.get('date', {})
            query['date']['$lte'] = dt
        except Exception:
            pass
    if is_recurring is not None:
        query['is_recurring'] = is_recurring.lower() == 'true'
    if recurrence:
        query['recurrence'] = recurrence
    income = list(db.income.find(query))
    for i in income:
        i['_id'] = str(i['_id'])
    return jsonify(income), 200

@app.route('/api/expenses/filter', methods=['GET'])
@token_required
def filter_expenses(current_user):
    query = {'user_id': current_user}
    category = request.args.get('category')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    is_recurring = request.args.get('is_recurring')
    recurrence = request.args.get('recurrence')
    if category:
        query['category'] = category
    if min_amount is not None:
        query['amount'] = query.get('amount', {})
        query['amount']['$gte'] = min_amount
    if max_amount is not None:
        query['amount'] = query.get('amount', {})
        query['amount']['$lte'] = max_amount
    if start_date:
        try:
            dt = date_parser.isoparse(start_date)
            query['date'] = query.get('date', {})
            query['date']['$gte'] = dt
        except Exception:
            pass
    if end_date:
        try:
            dt = date_parser.isoparse(end_date)
            query['date'] = query.get('date', {})
            query['date']['$lte'] = dt
        except Exception:
            pass
    if is_recurring is not None:
        query['is_recurring'] = is_recurring.lower() == 'true'
    if recurrence:
        query['recurrence'] = recurrence
    expenses = list(db.expenses.find(query))
    for e in expenses:
        e['_id'] = str(e['_id'])
    return jsonify(expenses), 200


if __name__ == '__main__':
    app.run(debug=True)

