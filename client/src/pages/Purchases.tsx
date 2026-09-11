import React from 'react';
import api from '../api/client';
import '../styles/Customers.css';

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    supplier_id: '',
    document_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    discount: 0,
    tax: 0,
    notes: '',
  });
  const [items, setItems] = React.useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  React.useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchases');
      setPurchases(response.data.data);
    } catch (err) {
      console.error('Failed to fetch purchases', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchases', { ...formData, items });
      setFormData({ supplier_id: '', document_number: '', purchase_date: new Date().toISOString().split('T')[0], discount: 0, tax: 0, notes: '' });
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      setShowForm(false);
      fetchPurchases();
    } catch (err) {
      console.error('Failed to create purchase', err);
    }
  };

  return (
    <div className="customers-container">
      <header>
        <h1>Purchases</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'New Purchase'}
        </button>
      </header>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} required>
            <option value="">Select Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Document Number" value={formData.document_number} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} />
          <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} required />
          <input type="number" placeholder="Discount" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })} />
          <input type="number" placeholder="Tax" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) })} />
          <input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

          <div className="items-section">
            <h3>Items</h3>
            {items.map((item, index) => (
              <div key={index} className="item-row">
                <select value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required>
                  <option value="">Select Product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" />
                <input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} step="0.01" />
                {items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="btn-danger">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addItem} className="btn-edit">Add Item</button>
          </div>

          <button type="submit" className="btn-primary">Create Purchase</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Document #</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                <td>{purchase.document_number}</td>
                <td>{purchase.supplier_name}</td>
                <td>${purchase.total_amount}</td>
                <td>{purchase.status}</td>
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
