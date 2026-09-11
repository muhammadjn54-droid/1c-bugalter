import React from 'react';
import api from '../api/client';
import '../styles/Products.css';

export const Products: React.FC = () => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    sku: '',
    barcode: '',
    purchase_price: 0,
    sale_price: 0,
    minimum_stock: 0,
    description: '',
  });

  React.useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { search: search || undefined },
      });
      setProducts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        purchase_price: 0,
        sale_price: 0,
        minimum_stock: 0,
        description: '',
      });
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to create product', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }
  };

  return (
    <div className="products-container">
      <header>
        <h1>Products</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </header>

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <input
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
          <input
            placeholder="Barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
          <input
            type="number"
            placeholder="Purchase Price"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Sale Price"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Minimum Stock"
            value={formData.minimum_stock}
            onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" className="btn-primary">
            Create Product
          </button>
        </form>
      )}

      <div className="search-bar">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Purchase Price</th>
              <th>Sale Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>${product.purchase_price}</td>
                <td>${product.sale_price}</td>
                <td>{product.quantity}</td>
                <td>
                  <button onClick={() => handleDelete(product.id)} className="btn-danger">
                    Delete
                  </button>
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
