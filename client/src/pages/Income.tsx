import React from 'react';
import api from '../api/client';
import '../styles/Customers.css';

export const Income: React.FC = () => {
  const [incomeList, setIncomeList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    category: '',
    amount: 0,
    income_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  React.useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const response = await api.get('/income');
      setIncomeList(response.data.data);
    } catch (err) {
      console.error('Failed to fetch income', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/income', formData);
      setFormData({ category: '', amount: 0, income_date: new Date().toISOString().split('T')[0], description: '' });
      setShowForm(false);
      fetchIncome();
    } catch (err) {
      console.error('Failed to create income', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      try {
        await api.delete(`/income/${id}`);
        fetchIncome();
      } catch (err) {
        console.error('Failed to delete income', err);
      }
    }
  };

  return (
    <div className="customers-container">
      <header>
        <h1>Income</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Income'}
        </button>
      </header>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
          <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required step="0.01" />
          <input type="date" value={formData.income_date} onChange={(e) => setFormData({ ...formData, income_date: e.target.value })} required />
          <input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <button type="submit" className="btn-primary">Create Income</button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomeList.map((income) => (
              <tr key={income.id}>
                <td>{new Date(income.income_date).toLocaleDateString()}</td>
                <td>{income.category}</td>
                <td>${income.amount}</td>
                <td>{income.description}</td>
                <td>
                  <button onClick={() => handleDelete(income.id)} className="btn-danger">Delete</button>
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
