from pymongo import MongoClient
from dateutil import parser as date_parser

client = MongoClient('mongodb://localhost:27017/smartbudget')
db = client.get_database()

# Fix income collection
total_income_fixed = 0
for doc in db.income.find():
    if isinstance(doc['date'], str):
        try:
            dt = date_parser.isoparse(doc['date'])
            db.income.update_one({'_id': doc['_id']}, {'$set': {'date': dt}})
            total_income_fixed += 1
        except Exception:
            print(f"Could not parse date for income _id={doc['_id']}: {doc['date']}")

# Fix expenses collection
total_expenses_fixed = 0
for doc in db.expenses.find():
    if isinstance(doc['date'], str):
        try:
            dt = date_parser.isoparse(doc['date'])
            db.expenses.update_one({'_id': doc['_id']}, {'$set': {'date': dt}})
            total_expenses_fixed += 1
        except Exception:
            print(f"Could not parse date for expense _id={doc['_id']}: {doc['date']}")

print(f'Migration complete! Fixed {total_income_fixed} income and {total_expenses_fixed} expense records.') 