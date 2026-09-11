import React from 'react';
import api from '../api/client';
import '../styles/Reports.css';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('profit');
  const [profitData, setProfitData] = React.useState<any>(null);
  const [inventoryData, setInventoryData] = React.useState<any>(null);
  const [stockMovements, setStockMovements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState({ from_date: '', to_date: '' });

  React.useEffect(() => {
    if (activeTab === 'profit') fetchProfit();
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'movements') fetchMovements();
  }, [activeTab]);

  const fetchProfit = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter.from_date) params.from_date = dateFilter.from_date;
      if (dateFilter.to_date) params.to_date = dateFilter.to_date;
      const response = await api.get('/reports/profit', { params });
      setProfitData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch profit report', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/inventory');
      setInventoryData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch inventory report', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/stock-movements');
      setStockMovements(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container">
      <header>
        <h1>Reports</h1>
      </header>

      <div className="report-tabs">
        <button className={activeTab === 'profit' ? 'active' : ''} onClick={() => setActiveTab('profit')}>Profit Report</button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>Inventory Report</button>
        <button className={activeTab === 'movements' ? 'active' : ''} onClick={() => setActiveTab('movements')}>Stock Movements</button>
      </div>

      {activeTab === 'profit' && (
        <div className="report-section">
          <div className="date-filter">
            <input type="date" value={dateFilter.from_date} onChange={(e) => setDateFilter({ ...dateFilter, from_date: e.target.value })} />
            <input type="date" value={dateFilter.to_date} onChange={(e) => setDateFilter({ ...dateFilter, to_date: e.target.value })} />
            <button onClick={fetchProfit} className="btn-primary">Filter</button>
          </div>
          {loading ? <p>Loading...</p> : profitData && (
            <div className="profit-cards">
              <div className="report-card"><h3>Revenue</h3><p>${profitData.revenue?.toFixed(2)}</p></div>
              <div className="report-card"><h3>Cost of Goods</h3><p>${profitData.costOfGoods?.toFixed(2)}</p></div>
              <div className="report-card"><h3>Gross Profit</h3><p className={profitData.grossProfit >= 0 ? 'positive' : 'negative'}>${profitData.grossProfit?.toFixed(2)}</p></div>
              <div className="report-card"><h3>Expenses</h3><p>${profitData.expenses?.toFixed(2)}</p></div>
              <div className="report-card"><h3>Income</h3><p>${profitData.income?.toFixed(2)}</p></div>
              <div className="report-card"><h3>Net Profit</h3><p className={profitData.netProfit >= 0 ? 'positive' : 'negative'}>${profitData.netProfit?.toFixed(2)}</p></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="report-section">
          {loading ? <p>Loading...</p> : inventoryData && (
            <>
              <div className="inventory-summary">
                <div className="report-card"><h3>Total Products</h3><p>{inventoryData.totalProducts}</p></div>
                <div className="report-card"><h3>Inventory Value</h3><p>${inventoryData.totalInventoryValue?.toFixed(2)}</p></div>
              </div>
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Warehouse</th>
                    <th>Qty</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.products?.map((p: any) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.category_name}</td>
                      <td>{p.warehouse_name}</td>
                      <td>{p.quantity}</td>
                      <td>${p.inventory_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="report-section">
          {loading ? <p>Loading...</p> : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Previous</th>
                  <th>New</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.movement_date).toLocaleDateString()}</td>
                    <td>{m.product_name}</td>
                    <td>{m.movement_type}</td>
                    <td className={m.quantity_change >= 0 ? 'positive' : 'negative'}>{m.quantity_change}</td>
                    <td>{m.previous_quantity}</td>
                    <td>{m.new_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <nav>
        <a href="/dashboard">Back to Dashboard</a>
      </nav>
    </div>
  );
};
