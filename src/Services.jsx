import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Sun, Moon } from 'lucide-react';
import './App.css';
import './Shop.css';

function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('aquaria_theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('aquaria_theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('aquaria_theme', 'dark');
    }
  }, [isLightMode]);

  
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', whatsapp: '', preferredDate: '', preferredTime: '', area: '', pincode: '', budget: '', aquariumSize: '', hasAquarium: 'NO', message: ''
  });
  const [settings, setSettings] = useState({ whatsapp: '1234567890' });
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');

  // Fallback mock services if DB empty
  const mockServices = [
    { id: 1, name: 'Custom Aquarium Design', description: 'Bespoke designs tailored to your unique space and style.', price: 'From ₹5000', badge: 'Popular', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Planted Aquarium Setup', description: 'Lush, vibrant aquatic ecosystems with live plants.', price: 'From ₹3000', badge: 'Custom', image: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0462?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Aquarium Maintenance', description: 'Professional cleaning and care to keep your tank pristine.', price: '₹1500 / visit', badge: 'Essential', image: 'https://images.unsplash.com/photo-1520302621453-61a7a242c7aa?auto=format&fit=crop&w=800&q=80' }
  ];

  useEffect(() => {
    async function fetchServices() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('services').select('*').eq('active', true);
        if (!error && data) setServices(data);
        
        const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
        if (settingsData) setSettings(settingsData);
      } catch (err) {
        console.error("Error fetching services", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openBooking = (service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Database not connected.");
      return;
    }
    
    const generatedReqId = `SRV-${Math.floor(10000 + Math.random() * 90000)}`;
    const reqData = {
      request_number: generatedReqId,
      service_id: selectedService.id,
      customer_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      preferred_date: formData.preferredDate,
      preferred_time: formData.preferredTime,
      area: formData.area,
      pincode: formData.pincode,
      budget: formData.budget,
      aquarium_size: formData.aquariumSize,
      has_existing_aquarium: formData.hasAquarium === 'YES',
      message: formData.message,
      status: 'New'
    };

    try {
      const { error } = await supabase.from('service_requests').insert([reqData]);
      if (error) throw error;
      
      setRequestId(generatedReqId);
      setRequestSuccess(true);
      setIsBookingOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    }
  };

  const displayServices = services.length > 0 ? services : mockServices;

  if (requestSuccess) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div className="section-title reveal-heading" style={{ opacity: 1 }}>
          <h2 className="shimmer-text">Request Submitted</h2>
          <p style={{ color: 'var(--color-accent-gold)', fontSize: '1.2rem', marginTop: '1rem', letterSpacing: '2px' }}>Request ID: {requestId}</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
          <button className="add-to-cart" onClick={() => navigate('/')}>Return Home</button>
          <a 
            href={`https://wa.me/${settings.whatsapp}?text=Hello, I submitted an aquarium service request. Request ID: ${requestId}. Service: ${selectedService.name}. Name: ${formData.fullName}. Area: ${formData.area}. I would like to discuss my aquarium requirements.`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <button className="add-to-cart" style={{ borderColor: '#25D366', color: '#25D366' }}>Continue on WhatsApp</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }}>
      <nav className="navbar" style={{ background: 'var(--color-bg-dark)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="logo shimmer-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AQUARIA</div>
        
        <button 
          onClick={() => setIsLightMode(!isLightMode)} 
          style={{ background: 'transparent', border: '1px solid var(--color-accent-gold)', color: 'var(--color-accent-gold)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </nav>
      
      <div style={{ padding: '8rem 5%' }}>
        <div className="section-title reveal-heading" style={{ opacity: 1 }}>
          <h2 className="shimmer-text">Premium Services</h2>
          <div className="divider"></div>
        </div>

        <div className="sh-product-grid" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {displayServices.map(service => {
            const isMock = typeof service.image === 'string' && service.image.startsWith('fish-');
            const imgClass = isMock ? service.image : null;
            return (
              <div key={service.id} className="sh-product-card" onClick={() => openBooking(service)}>
                <div className="sh-product-image-container">
                  {service.badge && <span className="sh-badge" style={{ background: 'var(--color-accent-gold)', color: 'black' }}>{service.badge}</span>}
                  
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className={`sh-product-image ${imgClass || ''}`} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iI2ZmZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'; }}
                  />
                </div>
                
                <div className="sh-product-details">
                  <div className="sh-product-category">Professional Service</div>
                  <h3 className="sh-product-name">{service.name}</h3>
                  
                  <div className="sh-product-price-row" style={{ marginTop: '0', marginBottom: '0.5rem' }}>
                    <span className="sh-price">{service.price || 'Contact for price'}</span>
                  </div>
                  
                  <p style={{ flex: 1, marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{service.description}</p>
                  
                  <div className="sh-product-actions">
                    <button className="sh-add-cart-btn" onClick={(e) => { e.stopPropagation(); openBooking(service); }}>
                      BOOK SERVICE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Overlay */}
      <div className={`overlay-backdrop ${isBookingOpen ? 'active' : ''}`} onClick={() => setIsBookingOpen(false)}></div>
      <div className={`sidebar ${isBookingOpen ? 'open' : ''}`} style={{ width: '100%', maxWidth: '500px', right: isBookingOpen ? '0' : '-500px' }}>
        <div className="sidebar-header">
          <h3>Request Service</h3>
          <button className="close-btn" onClick={() => setIsBookingOpen(false)}>×</button>
        </div>
        
        <div className="sidebar-items" style={{ paddingRight: '10px' }}>
          {selectedService && <p style={{ color: 'var(--color-accent-gold)', marginBottom: '1.5rem' }}>Service: {selectedService.name}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input required name="fullName" placeholder="Full Name *" onChange={handleInputChange} style={inputStyle} />
            <input required name="email" type="email" placeholder="Email Address *" onChange={handleInputChange} style={inputStyle} />
            <input required name="phone" placeholder="Phone *" onChange={handleInputChange} style={inputStyle} />
            <input name="whatsapp" placeholder="WhatsApp Number" onChange={handleInputChange} style={inputStyle} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input name="preferredDate" type="date" placeholder="Preferred Date" onChange={handleInputChange} style={{ ...inputStyle, colorScheme: 'dark', flex: 1 }} />
              <select name="preferredTime" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Select Time Slot</option>
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input required name="area" placeholder="Area / Location *" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
              <input name="pincode" placeholder="PIN Code" onChange={handleInputChange} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <input name="budget" placeholder="Budget Range" onChange={handleInputChange} style={inputStyle} />
            <input name="aquariumSize" placeholder="Aquarium Size" onChange={handleInputChange} style={inputStyle} />
            
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Do you already have an aquarium?</label>
              <select name="hasAquarium" onChange={handleInputChange} style={{ ...inputStyle, width: '100%', marginTop: '0.5rem' }}>
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>
            
            <textarea name="message" placeholder="Requirements / Message" rows="4" onChange={handleInputChange} style={{ ...inputStyle, resize: 'vertical' }}></textarea>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
              Your preferred date is a request. The owner will contact you to confirm availability, price and timing.
            </p>
            
            <button type="submit" className="checkout-btn" style={{ marginTop: '1rem' }}>Submit Request</button>
          </form>
        </div>
      </div>
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
  fontSize: '0.95rem'
};

export default Services;
