import React from 'react';
import api from '../api/client';
import '../styles/Categories.css';

export const Categories: React.FC = () => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ name: '', description: '' });

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
    }
  };

  const handleEdit = (category: any) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        console.error('Failed to delete category', err);
      }
    }
  };

  return (
    <div className="categories-container">
      <header>
        <h1>Categories</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', description: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </header>

      {showForm && (
        <form className="category-form" onSubmit={handleSubmit}>
          <input
            placeholder="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" className="btn-primary">
            {editingId ? 'Update Category' : 'Create Category'}
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
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>
                  <button onClick={() => handleEdit(category)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="btn-danger">Delete</button>
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
