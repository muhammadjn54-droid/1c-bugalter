import React from 'react';
import api from '../api/client';
import '../styles/Customers.css';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '', phone: '', email: '', address: '', notes: ''
  });

  React.useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/suppliers', {
        params: { search: search || undefined },
      });
      setSuppliers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to save supplier', err);
    }
  };

  const handleEdit = (supplier: any) => {
    setFormData({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error('Failed to delete supplier', err);
      }
    }
  };

  return (
    <div className="customers-container">
      <header>
        <h1>Suppliers</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', phone: '', email: '', address: '', notes: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Supplier'}
        </button>
      </header>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <button type="submit" className="btn-primary">{editingId ? 'Update Supplier' : 'Create Supplier'}</button>
        </form>
      )}

      <div className="search-bar">
        <input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.email}</td>
                <td>{supplier.address}</td>
                <td>
                  <button onClick={() => handleEdit(supplier)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(supplier.id)} className="btn-danger">Delete</button>
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
