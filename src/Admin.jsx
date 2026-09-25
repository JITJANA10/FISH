import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Package, ShoppingCart, Users, Settings, Tag, MessageSquare, Image as ImageIcon, Plus, Edit2, Trash2, X } from 'lucide-react';
import './App.css';

function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState({ delivery_charge: 150, free_delivery_above: 2000, cod_enabled: true, whatsapp: '1234567890' });
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0 });

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', category_id: '', description: '', price: '', sale_price: '', stock: '', image: '', featured: false, active: true
  });

  // Category Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '', display_order: 0, active: true
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProductsAndCategories();
      fetchOrdersAndRequests();
    }
  }, [session]);

  const fetchProductsAndCategories = async () => {
    if(!supabase) return;
    
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategories(catData);

    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodData) {
      setProducts(prodData);
      
      const lowStock = prodData.filter(p => p.stock > 0 && p.stock <= 3).length;
      const outOfStock = prodData.filter(p => p.stock === 0).length;
      setStats({
        totalProducts: prodData.length,
        lowStock,
        outOfStock
      });
    }
  };

  const fetchOrdersAndRequests = async () => {
    if(!supabase) return;
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orderData) setOrders(orderData);

    const { data: reqData } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
    if (reqData) setRequests(reqData);

    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
    if (settingsData) setSettings(settingsData);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // Mock Login Credentials
    if (email === '9999999999' && password === 'ABCXYZ') {
      setSession({ user: { id: 'mock-admin', email: '9999999999' } });
      return;
    }

    if (!supabase) return setAuthError('Supabase not connected');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    if(supabase) await supabase.auth.signOut();
  };

  // --- Product Management Logic ---
  
  const handleProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      setProductForm(prev => ({ ...prev, image: data.publicUrl }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        category_id: productForm.category_id || null,
        description: productForm.description,
        price: parseFloat(productForm.price),
        sale_price: productForm.sale_price ? parseFloat(productForm.sale_price) : null,
        stock: parseInt(productForm.stock),
        image: productForm.image,
        featured: productForm.featured,
        active: productForm.active
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      setIsProductModalOpen(false);
      fetchProductsAndCategories();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', category_id: '', description: '', price: '', sale_price: '', stock: '', image: '', featured: false, active: true });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || '',
      stock: product.stock,
      image: product.image || '',
      featured: product.featured,
      active: product.active
    });
    setIsProductModalOpen(true);
  };

  const deleteProduct = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProductsAndCategories();
    }
  };

  // --- Category Management Logic ---

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: categoryForm.name,
        display_order: parseInt(categoryForm.display_order),
        active: categoryForm.active
      };

      if (editingCategory) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }

      setIsCategoryModalOpen(false);
      fetchProductsAndCategories();
    } catch (error) {
      alert('Error saving category: ' + error.message);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', display_order: categories.length + 1, active: true });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      display_order: category.display_order || 0,
      active: category.active
    });
    setIsCategoryModalOpen(true);
  };

  const deleteCategory = async (id) => {
    if(window.confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) {
      await supabase.from('categories').delete().eq('id', id);
      fetchProductsAndCategories();
    }
  };

  // --- Orders & Services Logic ---

  const updateOrderStatus = async (id, newStatus) => {
    if(!supabase) return;
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    fetchOrdersAndRequests();
  };

  const updateRequestStatus = async (id, newStatus) => {
    if(!supabase) return;
    await supabase.from('service_requests').update({ status: newStatus }).eq('id', id);
    fetchOrdersAndRequests();
  };

  // --- Settings Logic ---
  
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if(!supabase) return;
    try {
      const { error } = await supabase.from('settings').upsert({ id: 1, ...settings });
      if (error) throw error;
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Error saving settings: " + err.message);
    }
  };

  // --- Render logic ---

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Admin...</div>;

  if (!session) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} className="admin-login-card">
          <h2 className="shimmer-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Aquaria Admin</h2>
          {authError && <div style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>{authError}</div>}
          <input required type="text" placeholder="Phone No or Email Address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginTop: '1rem' }} />
          <button type="submit" className="checkout-btn" style={{ marginTop: '1.5rem' }}>Secure Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand shimmer-text">AQUARIA</div>
        <nav className="admin-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <Users size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>
            <Package size={18} /> Products
          </button>
          <button onClick={() => setActiveTab('categories')} className={activeTab === 'categories' ? 'active' : ''}>
            <Tag size={18} /> Categories
          </button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>
            <ShoppingCart size={18} /> Orders
          </button>
          <button onClick={() => setActiveTab('services')} className={activeTab === 'services' ? 'active' : ''}>
            <MessageSquare size={18} /> Services
          </button>
          <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
            <Settings size={18} /> Settings
          </button>
        </nav>
        <button onClick={handleLogout} className="admin-logout">Logout</button>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="admin-fade-in">
            <h2 style={{ marginBottom: '2rem', color: 'var(--color-accent-gold)' }}>Overview</h2>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Products</h3>
                <div className="stat-value">{stats.totalProducts}</div>
              </div>
              <div className="admin-stat-card warning">
                <h3>Low Stock</h3>
                <div className="stat-value">{stats.lowStock}</div>
              </div>
              <div className="admin-stat-card danger">
                <h3>Out of Stock</h3>
                <div className="stat-value">{stats.outOfStock}</div>
              </div>
            </div>
            <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: 'var(--color-text-muted)' }}>Welcome to the new Admin Panel!</h3>
              <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)' }}>Navigate using the sidebar menu. Currently implementing Phase A (Dashboard & Product Management).</p>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="admin-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-accent-gold)' }}>Product Management</h2>
              <button className="add-to-cart" onClick={openAddProduct} style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Product
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundImage: `url(${product.image || 'https://via.placeholder.com/40'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      </td>
                      <td style={{ fontWeight: '500' }}>{product.name}</td>
                      <td>₹{product.price} {product.sale_price && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through', marginLeft: '5px' }}>₹{product.regular_price}</span>}</td>
                      <td>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem',
                          background: product.stock === 0 ? 'rgba(255,0,0,0.2)' : product.stock <= 3 ? 'rgba(255,165,0,0.2)' : 'rgba(37,211,102,0.2)',
                          color: product.stock === 0 ? '#ff4d4d' : product.stock <= 3 ? 'orange' : '#25D366'
                        }}>
                          {product.stock} in stock
                        </span>
                      </td>
                      <td>{product.active ? 'Active' : 'Hidden'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => openEditProduct(product)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => deleteProduct(product.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No products found. Add your first product!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="admin-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-accent-gold)' }}>Category Management</h2>
              <button className="add-to-cart" onClick={openAddCategory} style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Category
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Display Order</th>
                    <th>Category Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.display_order}</td>
                      <td style={{ fontWeight: '500' }}>{cat.name}</td>
                      <td>{cat.active ? 'Active' : 'Hidden'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => openEditCategory(cat)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => deleteCategory(cat.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No categories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="admin-fade-in">
            <h2 style={{ color: 'var(--color-accent-gold)', marginBottom: '2rem' }}>Order Management</h2>
            {orders.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No orders found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ color: 'var(--color-accent-gold)', fontSize: '1.1rem' }}>{order.order_number}</strong>
                        <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{ ...inputStyle, width: 'auto', marginTop: 0, padding: '0.4rem 1rem' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Customer Details</p>
                        <p style={{ marginTop: '0.5rem' }}><strong>{order.customer_name}</strong></p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>📞 {order.phone}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>📍 {order.address}, {order.city} - {order.pincode}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Order Summary</p>
                        <p style={{ marginTop: '0.5rem' }}><strong>Payment:</strong> {order.payment_method}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}><strong>Items:</strong> {order.products?.length || 0}</p>
                        <p style={{ fontSize: '1.1rem', marginTop: '0.5rem', color: 'var(--color-accent-gold)' }}><strong>Total: ₹{order.total}</strong></p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                        <a 
                          href={`https://wa.me/${order.whatsapp || order.phone}?text=Hello ${order.customer_name}, regarding your aquarium order ${order.order_number}...`} 
                          target="_blank" rel="noopener noreferrer" 
                          className="add-to-cart" 
                          style={{ textDecoration: 'none', textAlign: 'center', borderColor: '#25D366', color: '#25D366', padding: '0.6rem' }}
                        >
                          WhatsApp Customer
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="admin-fade-in">
            <h2 style={{ color: 'var(--color-accent-gold)', marginBottom: '2rem' }}>Service Requests</h2>
            {requests.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No requests found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {requests.map(req => (
                  <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ color: 'var(--color-accent-gold)', fontSize: '1.1rem' }}>{req.request_number}</strong>
                        <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <select 
                        value={req.status} 
                        onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                        style={{ ...inputStyle, width: 'auto', marginTop: 0, padding: '0.4rem 1rem' }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Client Details</p>
                        <p style={{ marginTop: '0.5rem' }}><strong>{req.customer_name}</strong></p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>📞 {req.phone}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>📍 {req.area}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Request Details</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}><strong>Date:</strong> {req.preferred_date || 'N/A'}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}><strong>Budget:</strong> {req.budget || 'N/A'}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}><strong>Has Tank:</strong> {req.has_existing_aquarium ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Message</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>"{req.message || 'No message provided.'}"</p>
                        <a 
                          href={`https://wa.me/${req.whatsapp || req.phone}?text=Hello ${req.customer_name}, regarding your service request ${req.request_number}...`} 
                          target="_blank" rel="noopener noreferrer" 
                          className="add-to-cart" 
                          style={{ textDecoration: 'none', textAlign: 'center', borderColor: '#25D366', color: '#25D366', padding: '0.6rem', marginTop: '1rem', display: 'block' }}
                        >
                          WhatsApp Client
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="admin-fade-in">
            <h2 style={{ color: 'var(--color-accent-gold)', marginBottom: '2rem' }}>Business Settings</h2>
            <form onSubmit={saveSettings} style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '800px' }}>
              
              <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Delivery & Checkout</h3>
              <div className="form-group-row" style={{ marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Standard Delivery Charge (₹)</label>
                  <input type="number" name="delivery_charge" value={settings.delivery_charge} onChange={handleSettingsChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Free Delivery Above (₹)</label>
                  <input type="number" name="free_delivery_above" value={settings.free_delivery_above} onChange={handleSettingsChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="cod_enabled" checked={settings.cod_enabled} onChange={handleSettingsChange} />
                  Enable Cash on Delivery (COD)
                </label>
              </div>

              <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Contact Information</h3>
              <div className="form-group-row">
                <div style={{ flex: 1 }}>
                  <label>Business WhatsApp Number</label>
                  <input name="whatsapp" value={settings.whatsapp} onChange={handleSettingsChange} placeholder="e.g., 919876543210" style={inputStyle} />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.5rem' }}>Include country code without '+' (e.g., 91 for India).</small>
                </div>
              </div>

              <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="checkout-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }}>Save Settings</button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* PRODUCT ADD/EDIT MODAL */}
      {isProductModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={saveProduct} className="admin-modal-body">
              
              <div className="form-group-row">
                <div style={{ flex: 1 }}>
                  <label>Product Name *</label>
                  <input required name="name" value={productForm.name} onChange={handleProductInputChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Category</label>
                  <select name="category_id" value={productForm.category_id} onChange={handleProductInputChange} style={inputStyle}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div style={{ flex: 1 }}>
                  <label>Regular Price (₹) *</label>
                  <input required type="number" name="price" value={productForm.price} onChange={handleProductInputChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Sale Price (₹)</label>
                  <input type="number" name="sale_price" value={productForm.sale_price} onChange={handleProductInputChange} style={inputStyle} placeholder="Optional" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Stock Quantity *</label>
                  <input required type="number" name="stock" value={productForm.stock} onChange={handleProductInputChange} style={inputStyle} />
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea name="description" rows="3" value={productForm.description} onChange={handleProductInputChange} style={{ ...inputStyle, resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Product Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <label className="upload-btn">
                      <ImageIcon size={18} /> {uploading ? 'Uploading...' : 'Choose Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                    {productForm.image && <span style={{ fontSize: '0.8rem', color: '#25D366' }}>Image uploaded!</span>}
                  </div>
                </div>
                {productForm.image && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '4px', backgroundImage: `url(${productForm.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="active" checked={productForm.active} onChange={handleProductInputChange} />
                  Active (Visible in shop)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="featured" checked={productForm.featured} onChange={handleProductInputChange} />
                  Featured Collection
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="add-to-cart" style={{ background: 'transparent' }} onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="checkout-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} disabled={uploading}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {isCategoryModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={saveCategory} className="admin-modal-body">
              
              <div>
                <label>Category Name *</label>
                <input required name="name" value={categoryForm.name} onChange={handleCategoryInputChange} style={inputStyle} />
              </div>

              <div>
                <label>Display Order (Lower number = appears first)</label>
                <input required type="number" name="display_order" value={categoryForm.display_order} onChange={handleCategoryInputChange} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="active" checked={categoryForm.active} onChange={handleCategoryInputChange} />
                  Active (Visible in shop)
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="add-to-cart" style={{ background: 'transparent' }} onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="checkout-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '0.8rem 1rem',
  color: 'white',
  borderRadius: '4px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  width: '100%',
  marginTop: '0.5rem'
};

export default Admin;
