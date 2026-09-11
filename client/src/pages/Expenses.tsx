import React from 'react';
import api from '../api/client';
import '../styles/Customers.css';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    category: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: '',
  });

  React.useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.data);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setFormData({ category: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], description: '', payment_method: '' });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to create expense', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (err) {
        console.error('Failed to delete expense', err);
      }
    }
  };

  return (
    <div className="customers-container">
      <header>
        <h1>Expenses</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </header>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
          <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required step="0.01" />
          <input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required />
          <input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <input placeholder="Payment Method" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} />
          <button type="submit" className="btn-primary">Create Expense</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                <td>{expense.category}</td>
                <td>${expense.amount}</td>
                <td>{expense.description}</td>
                <td>{expense.payment_method}</td>
                <td>
                  <button onClick={() => handleDelete(expense.id)} className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <nav>
        <a href="/dashboard">Back to Dashboard</a>
      </nav>
    </div>
  );
};
