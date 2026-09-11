import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import '../styles/Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Accounting Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Sales</h3>
          <p className="stat-value">${stats?.totalSales?.toFixed(2) || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Purchases</h3>
          <p className="stat-value">${stats?.totalPurchases?.toFixed(2) || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Gross Profit</h3>
          <p className="stat-value">${stats?.grossProfit?.toFixed(2) || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Expenses</h3>
          <p className="stat-value">${stats?.totalExpenses?.toFixed(2) || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Income</h3>
          <p className="stat-value">${stats?.totalIncome?.toFixed(2) || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Net Profit</h3>
          <p className={`stat-value ${stats?.netProfit >= 0 ? 'positive' : 'negative'}`}>
            ${stats?.netProfit?.toFixed(2) || 0}
          </p>
        </div>

        <div className="stat-card">
          <h3>Low Stock Products</h3>
          <p className="stat-value">{stats?.lowStockProducts || 0}</p>
        </div>
      </div>

      <nav className="dashboard-nav">
        <a href="/products">Products</a>
        <a href="/categories">Categories</a>
        <a href="/customers">Customers</a>
        <a href="/suppliers">Suppliers</a>
        <a href="/purchases">Purchases</a>
        <a href="/sales">Sales</a>
        <a href="/expenses">Expenses</a>
        <a href="/income">Income</a>
        <a href="/reports">Reports</a>
      </nav>
    </div>
  );
};
