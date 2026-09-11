import React from 'react';
import api from '../api/client';
import '../styles/Customers.css';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '', phone: '', email: '', address: '', notes: ''
  });

  React.useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: { search: search || undefined },
      });
      setCustomers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to save customer', err);
    }
  };

  const handleEdit = (customer: any) => {
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        console.error('Failed to delete customer', err);
      }
    }
  };

  return (
    <div className="customers-container">
      <header>
        <h1>Customers</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', phone: '', email: '', address: '', notes: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </header>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <button type="submit" className="btn-primary">{editingId ? 'Update Customer' : 'Create Customer'}</button>
        </form>
      )}

      <div className="search-bar">
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>
                  <button onClick={() => handleEdit(customer)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(customer.id)} className="btn-danger">Delete</button>
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
