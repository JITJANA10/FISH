import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import './App.css';

function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', whatsapp: '', address: '', landmark: '', city: '', pincode: ''
  });
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [settings, setSettings] = useState({
    delivery_charge: 150,
    free_delivery_above: 2000,
    whatsapp: "1234567890"
  });

  useEffect(() => {
    const saved = localStorage.getItem('aquaria_cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    } else {
      navigate('/');
    }
    
    // Fetch Settings
    async function fetchSettings() {
      if (!supabase) return;
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    }
    fetchSettings();
  }, [navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalDelivery = subtotal >= settings.free_delivery_above ? 0 : settings.delivery_charge;
  const total = subtotal - discount + finalDelivery;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyCoupon = async () => {
    if (!supabase) {
      setCouponMessage("Database not connected.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();
        
      if (error || !data) {
        setCouponMessage("Invalid or Expired Coupon");
        setDiscount(0);
        return;
      }
      
      if (subtotal < data.minimum_order) {
        setCouponMessage(`Minimum order must be ₹${data.minimum_order}`);
        setDiscount(0);
        return;
      }

      const calculatedDiscount = data.discount_type === 'percentage' 
        ? (subtotal * data.discount_value) / 100 
        : data.discount_value;
        
      setDiscount(calculatedDiscount);
      setCouponMessage("✓ Coupon Applied!");
    } catch (err) {
      setCouponMessage("Error verifying coupon.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Database not connected. Cannot place order.");
      return;
    }

    const generatedOrderId = `AQ-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderData = {
      order_number: generatedOrderId,
      customer_name: formData.fullName,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      address: formData.address,
      landmark: formData.landmark,
      city: formData.city,
      pincode: formData.pincode,
      products: cartItems,
      subtotal: subtotal,
      discount: discount,
      delivery: finalDelivery,
      total: total,
      payment_method: 'Cash on Delivery',
      status: 'Pending'
    };

    try {
      const { error } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;
      
      setOrderId(generatedOrderId);
      setOrderSuccess(true);
      localStorage.removeItem('aquaria_cart');
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    }
  };

  if (orderSuccess) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div className="section-title reveal-heading" style={{ opacity: 1 }}>
          <h2 className="shimmer-text">Order Successfully Placed</h2>
          <p style={{ color: 'var(--color-accent-gold)', fontSize: '1.2rem', marginTop: '1rem', letterSpacing: '2px' }}>Order ID: {orderId}</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
          <button className="add-to-cart" onClick={() => navigate('/')}>Continue Shopping</button>
          <a 
            href={`https://wa.me/${settings.whatsapp}?text=Hello, I placed an order. Order ID: ${orderId}. I need help with my order.`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <button className="add-to-cart" style={{ borderColor: '#25D366', color: '#25D366' }}>Contact on WhatsApp</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', padding: '6rem 5%' }}>
      <nav className="navbar" style={{ background: 'rgba(0,0,0,0.9)' }}>
        <div className="logo shimmer-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AQUARIA</div>
      </nav>
      
      <div className="section-title reveal-heading" style={{ opacity: 1, marginBottom: '3rem' }}>
        <h2 className="shimmer-text">Checkout</h2>
        <div className="divider"></div>
      </div>

      <div style={{ display: 'flex', gap: '4rem', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap' }}>
        
        {/* Checkout Form */}
        <div style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--color-accent-gold)' }}>Delivery Details</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input required name="fullName" placeholder="Full Name *" onChange={handleInputChange} style={inputStyle} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input required name="phone" placeholder="Phone *" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
              <input name="whatsapp" placeholder="WhatsApp Number" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <textarea required name="address" placeholder="Full Address *" rows="3" onChange={handleInputChange} style={inputStyle}></textarea>
            <input name="landmark" placeholder="Landmark" onChange={handleInputChange} style={inputStyle} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input required name="city" placeholder="City *" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
              <input required name="pincode" placeholder="PIN Code *" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
            </div>
            
            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem', color: 'var(--color-accent-gold)' }}>Payment Method</h3>
            <div style={{ padding: '1.5rem', border: '1px solid var(--color-accent-gold)', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="radio" checked readOnly style={{ accentColor: 'var(--color-accent-gold)', width: '20px', height: '20px' }} />
              <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>Cash on Delivery</span>
            </div>

            <button type="submit" className="checkout-btn" style={{ marginTop: '2rem', padding: '1.5rem', fontSize: '1.2rem' }}>Place Order</button>
          </form>
        </div>

        {/* Order Summary */}
        <div style={{ flex: '1 1 350px', background: 'rgba(11, 11, 15, 0.95)', padding: '3rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--color-accent-gold)' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem', marginBottom: '2rem' }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            <span>Delivery</span>
            <span>{finalDelivery === 0 ? 'FREE' : `₹${finalDelivery}`}</span>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#25D366' }}>
              <span>Coupon Discount</span>
              <span>- ₹{discount}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.2)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-accent-gold)' }}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Have a coupon code?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                placeholder="Enter code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }} 
              />
              <button className="add-to-cart" onClick={applyCoupon} style={{ padding: '0 1.5rem' }}>Apply</button>
            </div>
            {couponMessage && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: couponMessage.includes('✓') ? '#25D366' : '#ff4d4d' }}>{couponMessage}</p>}
          </div>

        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '1rem',
  color: 'white',
  borderRadius: '4px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem'
};

export default Checkout;
