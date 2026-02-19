# Expense Tracker - MERN Stack

A full-stack expense tracking application built with MongoDB, Express.js, React, and Node.js.

## Features

- 🔐 **User Authentication** - Secure registration and login with JWT
- 💰 **Expense Management** - Add, edit, and delete expenses
- 📊 **Visual Analytics** - Beautiful charts showing spending patterns
- 🏷️ **Categories** - Organize expenses by category (Food, Transport, Entertainment, etc.)
- 🔍 **Smart Filtering** - Filter expenses by date range and category
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Glassmorphism effects and smooth animations

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Vite
- React Router for navigation
- Axios for API calls
- Chart.js for data visualization
- Modern CSS with glassmorphism

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd "web technology project"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

**Note:** If using MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start MongoDB (if running locally)
```bash
mongod
```

### Start Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## Usage

1. **Register** - Create a new account with your name, email, and password
2. **Login** - Sign in with your credentials
3. **Add Expenses** - Click "Add Expense" to create new expense entries
4. **View Statistics** - See your spending patterns with interactive charts
5. **Filter Expenses** - Use filters to view expenses by category or date range
6. **Edit/Delete** - Manage your expenses with edit and delete options

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Expenses
- `GET /api/expenses` - Get all expenses (protected)
- `GET /api/expenses/:id` - Get single expense (protected)
- `POST /api/expenses` - Create expense (protected)
- `PUT /api/expenses/:id` - Update expense (protected)
- `DELETE /api/expenses/:id` - Delete expense (protected)

## Project Structure

```
web technology project/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ExpenseForm.jsx
    │   │   ├── ExpenseList.jsx
    │   │   ├── ExpenseStats.jsx
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   ├── Auth.css
    │   │   ├── Dashboard.css
    │   │   ├── ExpenseList.css
    │   │   ├── ExpenseStats.css
    │   │   └── Navbar.css
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Features in Detail

### Expense Categories
- Food
- Transport
- Entertainment
- Shopping
- Bills
- Healthcare
- Education
- Other

### Charts & Analytics
- **Pie Chart** - Visual breakdown of expenses by category
- **Line Chart** - Spending trends over time
- **Category Breakdown** - Detailed list with percentages
- **Total Summary** - Overall expense tracking

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for secure authentication
- Protected API routes
- Input validation on both frontend and backend

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
