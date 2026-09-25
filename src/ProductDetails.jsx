import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProductDetails({ mockProducts }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = mockProducts.find(p => p.id === id || p.id.toString() === id);
  const [feedbacks, setFeedbacks] = useState([]);

  if (!product) {
    return <div style={{ padding: '100px', color: 'white', textAlign: 'center' }}>Product not found. <button onClick={() => navigate('/shop')}>Back to Shop</button></div>;
  }

  const isMock = typeof product.image === 'string' && product.image.startsWith('fish-');
  const imgClass = isMock ? product.image : null;

  const triggerFeedback = (e, text, isWishlist) => {
    const id = Date.now() + Math.random();
    const rect = e.target.getBoundingClientRect();
    const feedback = {
      id,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 20,
      isWishlist
    };
    setFeedbacks(prev => [...prev, feedback]);
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, 1500);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('aquaria_cart') || '[]');
    const existing = saved.find(i => i.id === product.id);
    if (existing) {
      localStorage.setItem('aquaria_cart', JSON.stringify(saved.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      localStorage.setItem('aquaria_cart', JSON.stringify([...saved, { ...product, quantity: 1, _imgClass: imgClass }]));
    }
    window.dispatchEvent(new Event('storage'));
    triggerFeedback(e, "✓ Added to Cart", false);
  };

  const handleBuyNow = (e) => {
    handleAddToCart(e);
    navigate('/checkout'); // Direct to checkout/cart as it's Buy Now
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('aquaria_wishlist') || '[]');
    if (!saved.find(i => i.id === product.id)) {
      localStorage.setItem('aquaria_wishlist', JSON.stringify([...saved, { ...product, _imgClass: imgClass }]));
      window.dispatchEvent(new Event('storage'));
      triggerFeedback(e, "♥ Saved to Wishlist", true);
    } else {
      triggerFeedback(e, "Already in Wishlist", true);
    }
  };

  return (
    <div className="app-container" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--color-bg-dark)' }}>
      <nav className="navbar" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="logo shimmer-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AQUARIA</div>
        <ul className="nav-links">
          <li><a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a></li>
          <li><a onClick={() => navigate('/shop')} style={{ cursor: 'pointer', color: 'var(--color-accent-gold)' }}>Shop</a></li>
          <li><a onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>Services</a></li>
        </ul>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '60px auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', padding: '0 2rem' }}>
        <div style={{ flex: '1 1 400px', background: '#111', borderRadius: '8px', overflow: 'hidden', minHeight: '400px', position: 'relative' }}>
          {imgClass ? (
             <div className={`mock-image ${imgClass}`} style={{ width: '100%', height: '100%', position: 'absolute' }}></div>
           ) : (
             <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
           )}
        </div>
        
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ color: 'var(--color-accent-gold)', fontSize: '3rem', marginBottom: '1rem' }}>{product.name}</h1>
          <div className="price-row" style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>
            <span className="price">₹{product.sale_price || product.price}</span>
            {product.sale_price && <span className="old-price" style={{ marginLeft: '1rem', textDecoration: 'line-through', color: 'gray' }}>₹{product.price}</span>}
          </div>
          
          <div style={{ marginBottom: '2rem', color: product.stock > 0 ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </div>
          
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="add-to-cart" 
                onClick={handleAddToCart} 
                disabled={product.stock === 0}
                style={{ padding: '1rem 2rem', flex: 1, minWidth: '150px', opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
              >
                Add to Cart
              </button>
              <button 
                className="checkout-btn" 
                onClick={handleBuyNow} 
                disabled={product.stock === 0}
                style={{ padding: '1rem 2rem', flex: 1, minWidth: '150px', opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
              >
                Buy Now
              </button>
              <button 
                className="filter-btn" 
                onClick={handleWishlist}
                style={{ padding: '1rem 2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              >
                ♥ Wishlist
              </button>
          </div>

          <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Description</h3>
            <p style={{ marginBottom: '2rem' }}>{product.description || "This premium aquatic product has been carefully selected to enhance your aquarium's aesthetic and health. Designed for ease of use and long-lasting beauty."}</p>
            
            <h3 style={{ color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Care & Maintenance</h3>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', listStyle: 'disc' }}>
              <li>Unpack carefully and rinse if necessary before adding to your tank.</li>
              <li>Place strategically in your setup for optimal visual impact and water flow.</li>
              <li>Ensure compatibility with your existing livestock (pH, temperature, aggression).</li>
              <li>Perform regular maintenance and water changes to keep it pristine.</li>
            </ul>

            <h3 style={{ color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Important Precautions</h3>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', listStyle: 'disc' }}>
              <li>Avoid sudden temperature changes during acclimatization.</li>
              <li>Keep out of reach of children and non-aquatic pets.</li>
            </ul>

            <h3 style={{ color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Features</h3>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'circle' }}>
              <li>Premium quality material/livestock</li>
              <li>Safe for all freshwater/saltwater environments</li>
              <li>Carefully sourced and handled</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Feedbacks */}
      {feedbacks.map(f => (
        <div 
          key={f.id} 
          className="bubble-feedback" 
          style={{ 
            left: f.x, 
            top: f.y, 
            color: f.isWishlist ? '#ff4d4d' : 'var(--color-accent-gold)',
            borderColor: f.isWishlist ? 'rgba(255, 77, 77, 0.3)' : 'rgba(230, 200, 117, 0.3)'
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
}
