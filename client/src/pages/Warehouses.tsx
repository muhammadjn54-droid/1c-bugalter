import React from 'react';
import api from '../api/client';
import '../styles/Categories.css';

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ name: '', location: '' });

  React.useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/warehouses/${editingId}`, formData);
      } else {
        await api.post('/warehouses', formData);
      }
      setFormData({ name: '', location: '' });
      setShowForm(false);
      setEditingId(null);
      fetchWarehouses();
    } catch (err) {
      console.error('Failed to save warehouse', err);
    }
  };

  const handleEdit = (warehouse: any) => {
    setFormData({ name: warehouse.name, location: warehouse.location || '' });
    setEditingId(warehouse.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await api.delete(`/warehouses/${id}`);
        fetchWarehouses();
      } catch (err) {
        console.error('Failed to delete warehouse', err);
      }
    }
  };

  return (
    <div className="categories-container">
      <header>
        <h1>Warehouses</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', location: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Warehouse'}
        </button>
      </header>

      {showForm && (
        <form className="category-form" onSubmit={handleSubmit}>
          <input
            placeholder="Warehouse Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <button type="submit" className="btn-primary">
            {editingId ? 'Update Warehouse' : 'Create Warehouse'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id}>
                <td>{warehouse.name}</td>
                <td>{warehouse.location}</td>
                <td>
                  <button onClick={() => handleEdit(warehouse)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(warehouse.id)} className="btn-danger">Delete</button>
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
