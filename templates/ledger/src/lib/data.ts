export const accounts = [
  { id: 'checking', name: 'Checking Account', bank: 'Chase', balance: 12450.83, type: 'checking', color: '#2563eb' },
  { id: 'savings', name: 'Savings Account', bank: 'Ally', balance: 34280.50, type: 'savings', color: '#16a34a' },
  { id: 'invest', name: 'Investment Portfolio', bank: 'Fidelity', balance: 87642.15, type: 'investment', color: '#9333ea' },
  { id: 'credit', name: 'Credit Card', bank: 'Amex', balance: -2340.67, type: 'credit', color: '#dc2626' },
];

export const netWorthHistory = [
  { month: 'Jul', value: 118500 },
  { month: 'Aug', value: 121200 },
  { month: 'Sep', value: 119800 },
  { month: 'Oct', value: 125400 },
  { month: 'Nov', value: 128900 },
  { month: 'Dec', value: 132032 },
];

export const transactions = [
  { id: 1, date: '2024-12-15', description: 'Whole Foods Market', category: 'Groceries', amount: -156.42, account: 'checking' },
  { id: 2, date: '2024-12-15', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, account: 'credit' },
  { id: 3, date: '2024-12-14', description: 'Salary Deposit', category: 'Income', amount: 5420.00, account: 'checking' },
  { id: 4, date: '2024-12-14', description: 'Electric Bill', category: 'Utilities', amount: -142.30, account: 'checking' },
  { id: 5, date: '2024-12-13', description: 'Amazon Purchase', category: 'Shopping', amount: -89.99, account: 'credit' },
  { id: 6, date: '2024-12-13', description: 'Coffee Shop', category: 'Food & Drink', amount: -6.50, account: 'checking' },
  { id: 7, date: '2024-12-12', description: 'Uber Ride', category: 'Transport', amount: -24.80, account: 'credit' },
  { id: 8, date: '2024-12-12', description: 'Gym Membership', category: 'Health', amount: -49.99, account: 'checking' },
  { id: 9, date: '2024-12-11', description: 'Freelance Payment', category: 'Income', amount: 1200.00, account: 'checking' },
  { id: 10, date: '2024-12-11', description: 'Restaurant Dinner', category: 'Food & Drink', amount: -78.50, account: 'credit' },
  { id: 11, date: '2024-12-10', description: 'Gas Station', category: 'Transport', amount: -52.40, account: 'checking' },
  { id: 12, date: '2024-12-10', description: 'Spotify Premium', category: 'Entertainment', amount: -10.99, account: 'credit' },
];

export const budgets = [
  { category: 'Groceries', spent: 420, budget: 500, color: '#2563eb' },
  { category: 'Entertainment', spent: 185, budget: 200, color: '#9333ea' },
  { category: 'Transport', spent: 95, budget: 150, color: '#16a34a' },
  { category: 'Utilities', spent: 142, budget: 200, color: '#d97706' },
  { category: 'Shopping', spent: 290, budget: 250, color: '#dc2626' },
];

export const goals = [
  { name: 'Emergency Fund', target: 25000, current: 18500, color: '#2563eb' },
  { name: 'Vacation Fund', target: 5000, current: 3200, color: '#16a34a' },
  { name: 'Down Payment', target: 60000, current: 22000, color: '#9333ea' },
];

export const recurring = [
  { name: 'Netflix', amount: 15.99, frequency: 'Monthly', nextDate: '2025-01-15', category: 'Entertainment' },
  { name: 'Spotify', amount: 10.99, frequency: 'Monthly', nextDate: '2025-01-12', category: 'Entertainment' },
  { name: 'Gym', amount: 49.99, frequency: 'Monthly', nextDate: '2025-01-08', category: 'Health' },
  { name: 'Internet', amount: 79.99, frequency: 'Monthly', nextDate: '2025-01-20', category: 'Utilities' },
  { name: 'Insurance', amount: 189.00, frequency: 'Quarterly', nextDate: '2025-03-01', category: 'Insurance' },
];

export const currency = '$';
