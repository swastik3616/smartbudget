# SmartBudget Frontend

This is the React frontend for SmartBudget, a modern personal finance tracker.

## Features

- JWT authentication (login/register)
- Dashboard with summary cards, interactive charts (Chart.js), and recent transactions
- CRUD for income and expenses (add, edit, delete, export)
- Profile page and user avatar menu
- Responsive, modern UI (Material-UI)
- Excel export

## Setup

### 1. Install dependencies

```sh
cd frontend
npm install
```

### 2. Start the development server

```sh
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm start` — Start development server
- `npm run build` — Build for production
- `npm test` — Run tests

## Environment Variables

- `REACT_APP_API_URL` — Backend API base URL (default: `http://localhost:5000/api`)

## Folder Structure

- `src/pages` — Main pages (Dashboard, Income, Expenses, Profile, etc.)
- `src/components` — Reusable UI components
- `src/services` — API service functions
- `src/context` — Auth context

---

## License

MIT
