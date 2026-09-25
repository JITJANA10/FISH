import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, X } from 'lucide-react';
import './Shop.css';

export default function Shop({ mockCategories, mockProducts }) {
  const navigate = useNavigate();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  // Animation Feedback Logic
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

  // Cart & Wishlist Logic
  const handleWishlist = (e, product) => {
    e.stopPropagation();
    const isMock = typeof product.image === 'string' && product.image.startsWith('fish-');
    const imgClass = isMock ? product.image : null;
    const saved = JSON.parse(localStorage.getItem('aquaria_wishlist') || '[]');
    if (!saved.find(i => i.id === product.id)) {
      localStorage.setItem('aquaria_wishlist', JSON.stringify([...saved, { ...product, _imgClass: imgClass }]));
      window.dispatchEvent(new Event('storage'));
      triggerFeedback(e, "♥ Saved to Wishlist", true);
    } else {
      triggerFeedback(e, "Already in Wishlist", true);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const isMock = typeof product.image === 'string' && product.image.startsWith('fish-');
    const imgClass = isMock ? product.image : null;
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

  const handleBuyNow = (e, product) => {
    handleAddToCart(e, product);
    navigate('/checkout');
  };

  // Filter Logic
  let filteredProducts = mockProducts.filter(p => {
    if (selectedCategory !== 'All' && p.category_id !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (inStockOnly && p.stock === 0) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;
    if (p.rating && p.rating < minRating) return false; // If ratings exist
    return true;
  });

  // Sort Logic
  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    // mock newest
    filteredProducts.sort((a, b) => b.id - a.id);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  
  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
    setMinPrice(0);
    setMaxPrice(10000);
    setMinRating(0);
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="sh-product-rating">
        <span className="sh-stars">{'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}</span>
        <span className="sh-rating-num">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const FilterSidebar = () => (
    <div className="sh-sidebar-content">
      <div className="sh-filter-section">
        <h4 className="sh-filter-title">Categories</h4>
        <ul className="sh-category-list">
          <li className={selectedCategory === 'All' ? 'active' : ''} onClick={() => setSelectedCategory('All')}>
            All Products
          </li>
          {mockCategories.map(cat => (
            <li key={cat.id} className={selectedCategory === cat.id ? 'active' : ''} onClick={() => setSelectedCategory(cat.id)}>
              {cat.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="sh-filter-section">
        <h4 className="sh-filter-title">Price Range</h4>
        <div className="sh-price-inputs">
          <input type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} placeholder="Min" />
          <span style={{ color: 'white' }}>-</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} placeholder="Max" />
        </div>
      </div>

      <div className="sh-filter-section">
        <h4 className="sh-filter-title">Availability</h4>
        <label className="sh-checkbox-label">
          <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
          <span className="sh-checkbox-custom"></span>
          In Stock Only
        </label>
      </div>

      <div className="sh-filter-section">
        <h4 className="sh-filter-title">Customer Rating</h4>
        <div className="sh-rating-filters">
          {[4, 3, 2].map(star => (
            <label key={star} className="sh-checkbox-label">
              <input type="radio" name="rating" checked={minRating === star} onChange={() => setMinRating(star)} />
              <span className="sh-checkbox-custom radio"></span>
              {'★'.repeat(star)} & above
            </label>
          ))}
        </div>
      </div>
      
      <button className="sh-clear-btn" onClick={clearFilters}>Clear All Filters</button>
    </div>
  );

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg-dark)' }}>
      {/* Global Navbar */}
      <nav className="navbar" style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="logo shimmer-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AQUARIA</div>
        <ul className="nav-links">
          <li><a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a></li>
          <li><a onClick={() => navigate('/shop')} style={{ cursor: 'pointer', color: 'var(--color-accent-gold)' }}>Shop</a></li>
          <li><a onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>Services</a></li>
        </ul>
      </nav>

      {/* Shop Layout */}
      <div className="sh-shop-wrapper">
        {/* Breadcrumb & Header */}
        <div className="sh-shop-header">
          <div className="sh-breadcrumb">Home / Shop</div>
          <h1 className="sh-shop-title">Shop Aquarium Products</h1>
          <p className="sh-shop-subtitle">Everything you need for a healthy and beautiful aquarium.</p>
        </div>

        {/* Toolbar */}
        <div className="sh-toolbar">
          <div className="sh-search-box">
            <Search className="sh-search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search for fish, food, tanks, plants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="sh-toolbar-actions">
            <span className="sh-results-count">Showing {filteredProducts.length} products</span>
            
            <button className="sh-mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
              <SlidersHorizontal size={18} /> Filter & Sort
            </button>

            <div className="sh-sort-dropdown">
              <span className="sh-sort-label">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="popularity">Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sh-main-layout">
          {/* Desktop Sidebar */}
          <aside className="sh-sidebar">
            <FilterSidebar />
          </aside>

          {/* Product Grid */}
          <main className="sh-product-area">
            {filteredProducts.length === 0 ? (
              <div className="sh-empty-state">
                <h3>No products found</h3>
                <p>Try changing your search or filters to find what you're looking for.</p>
                <button className="sh-primary-btn" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="sh-product-grid">
                {filteredProducts.map(product => {
                  const isMock = typeof product.image === 'string' && product.image.startsWith('fish-');
                  const imgClass = isMock ? product.image : null;
                  const catName = mockCategories.find(c => c.id === product.category_id)?.name || 'Product';
                  
                  return (
                    <div key={product.id} className="sh-product-card" onClick={() => navigate(`/shop/product/${product.id}`)}>
                      <div className="sh-product-image-container">
                        {product.sale_price && <span className="sh-badge sale">SALE</span>}
                        {product.badge && <span className={`sh-badge ${product.badge.toLowerCase()}`}>{product.badge}</span>}
                        
                        <button className="sh-wishlist-btn" onClick={(e) => handleWishlist(e, product)}>
                          <Heart size={18} />
                        </button>
                        
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className={`sh-product-image ${imgClass || ''}`} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iI2ZmZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'; }}
                        />
                      </div>
                      
                      <div className="sh-product-details">
                        <div className="sh-product-category">{catName}</div>
                        <h3 className="sh-product-name">{product.name}</h3>
                        
                        {renderStars(product.rating)}
                        
                        <div className="sh-product-price-row">
                          <span className="sh-price">₹{product.sale_price || product.price}</span>
                          {product.sale_price && <span className="sh-old-price">₹{product.price}</span>}
                          {product.sale_price && <span className="sh-discount-pct">{Math.round((product.price - product.sale_price)/product.price * 100)}% OFF</span>}
                        </div>
                        
                        <div className={`sh-stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {product.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                        </div>
                        
                        <div className="sh-product-actions">
                          <button 
                            className="sh-add-cart-btn" 
                            disabled={product.stock === 0}
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            {product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
                          </button>
                          {product.stock > 0 && (
                            <button 
                              className="sh-buy-now-btn" 
                              onClick={(e) => handleBuyNow(e, product)}
                            >
                              BUY NOW
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {filteredProducts.length > 0 && (
              <div className="sh-load-more">
                <button className="sh-secondary-btn">Load More</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <div className={`sh-mobile-filter-overlay ${isMobileFilterOpen ? 'active' : ''}`} onClick={() => setIsMobileFilterOpen(false)}></div>
      <div className={`sh-mobile-filter-drawer ${isMobileFilterOpen ? 'open' : ''}`}>
        <div className="sh-drawer-header">
          <h3>Filter & Sort</h3>
          <button className="sh-close-btn" onClick={() => setIsMobileFilterOpen(false)}><X size={24} /></button>
        </div>
        <div className="sh-drawer-body">
          <div className="sh-filter-section">
            <h4 className="sh-filter-title">Sort By</h4>
            <select className="sh-mobile-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="popularity">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
          <FilterSidebar />
        </div>
        <div className="sh-drawer-footer">
          <button className="sh-primary-btn" onClick={() => setIsMobileFilterOpen(false)}>Apply Filters</button>
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
