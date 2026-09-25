import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from './supabase';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cartIconRef = useRef(null);
  const wishlistIconRef = useRef(null);

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('aquaria_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('aquaria_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('aquaria_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('aquaria_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const [feedbacks, setFeedbacks] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ whatsapp: '1234567890' });
  const [loading, setLoading] = useState(true);
  
  // New States for Shop Features
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productModal, setProductModal] = useState(null);

  const mockCategories = [
    { id: 'c1', name: 'AQUARIUM FISH' },
    { id: 'c2', name: 'FISH FOOD' },
    { id: 'c3', name: 'AQUARIUM / FISH TANK' },
    { id: 'c4', name: 'LIVE AQUARIUM PLANTS' }
  ];

  const mockProducts = [
    { id: 'mock-img-1', name: 'Premium Halfmoon Betta', price: 1500, stock: 10, category_id: 'c1', image: '', _imgClass: 'mock-img-1' },
    { id: 'mock-img-2', name: 'Neon Tetra (School of 10)', price: 800, stock: 20, category_id: 'c1', image: '', _imgClass: 'mock-img-2' },
    { id: 'mock-3', name: 'Premium Goldfish Flakes', price: 250, stock: 50, category_id: 'c2', image: '', _imgClass: 'mock-img-3' },
    { id: 'mock-4', name: 'Betta Color Enhancing Pellets', price: 300, stock: 40, category_id: 'c2', image: '', _imgClass: 'mock-img-1' },
    { id: 'mock-5', name: 'The Abyssal Void (Nano)', price: 4999, stock: 5, category_id: 'c3', image: '', _imgClass: 'mock-img-2' },
    { id: 'mock-img-3', name: 'Titanium Cylinder', price: 8299, stock: 8, category_id: 'c3', image: '', _imgClass: 'mock-img-3' },
    { id: 'mock-7', name: 'Anubias Nana (Potted)', price: 450, stock: 15, category_id: 'c4', image: '', _imgClass: 'mock-img-1' },
    { id: 'mock-8', name: 'Java Moss Portion', price: 200, stock: 30, category_id: 'c4', image: '', _imgClass: 'mock-img-2' },
  ];

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('active', true)
          .order('display_order');
        if (!catError && catData && catData.length > 0) setCategories(catData);

        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('active', true);
        if (!prodError && prodData && prodData.length > 0) setProducts(prodData);
        
        const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
        if (settingsData) setSettings(settingsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const displayCategories = categories.length > 0 ? categories : mockCategories;
  const displayProducts = products.length > 0 ? products : mockProducts;

  // Indian welcome languages
  const greetings = ["Welcome", "स्वागत है", "স্বাগতম", "ಸ್ವಾಗತ", "வரவேற்பு", "స్వాగతం", "സ്വാഗതം", "સ્વાગત છે", "ਸਵਾਗਤ ਹੈ", "स्वागतम"];
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const frameCount = 240;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const currentFrame = (index) => 
      `/assets/frames/frame_${(index + 1).toString().padStart(6, '0')}.jpg`;

    const images = [];
    const animationState = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    gsap.to(animationState, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none", // continuous linear playback
      duration: 8, // length of the 'video'
      repeat: -1, // loop infinitely
      onUpdate: render 
    });

    // Storytelling text animations (now decoupled from scroll, plays like a subtitle track)
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "power2.inOut" }
    });

    tl.to(".hero-story-1", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-2", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-2", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-3", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-3", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-4", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-4", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-5", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-5", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-6", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-6", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-7", { opacity: 1, y: 0, duration: 1 })
      .to(".hero-story-7", { opacity: 0, y: -20, duration: 1, delay: 2 })
      .to(".hero-story-1", { opacity: 1, y: 0, duration: 1, delay: 0 }); // Loop back

    images[0].onload = render;

    function render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const img = images[Math.round(animationState.frame)];
      if(!img || img.width === 0) return;
      
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      
      const centerShift_x = (canvas.width - img.width*ratio) / 2;
      const centerShift_y = (canvas.height - img.height*ratio) / 2;  
      
      context.drawImage(img, 0, 0, img.width, img.height,
                          centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);  
      // Removed the manual gradient mask since we are now cropping via CSS transform!
    }
    
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      render();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Reveal Animation for Headings
  useEffect(() => {
    const headings = document.querySelectorAll('.reveal-heading');
    headings.forEach(heading => {
      gsap.fromTo(heading, 
        { y: 25, opacity: 0, filter: 'blur(8px)' },
        { 
          y: 0, opacity: 1, filter: 'blur(0px)', 
          duration: 0.9, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
          }
        }
      );
    });
  }, []);

  // Custom Cursor moved to global CustomCursor.jsx
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

  const getMockProduct = (idOrImgClass) => {
    return mockProducts.find(p => p.id === idOrImgClass || p._imgClass === idOrImgClass) || { id: idOrImgClass, name: 'Premium Product', price: 1000, image: '', _imgClass: 'mock-img-1' };
  };

  const handleAddToCart = (e, product, productImgClass = null) => {
    const isMock = typeof product === 'string';
    const actualProduct = isMock ? getMockProduct(product) : product;
    const imgClass = isMock ? product : productImgClass;

    triggerFeedback(e, "✓ Added to Cart", false);
    
    // Create floating element
    const rect = e.target.closest('.product-card').querySelector('.product-image').getBoundingClientRect();
    const clone = document.createElement('div');
    if (imgClass) {
      clone.className = `floating-product ${imgClass}`;
    } else {
      clone.className = `floating-product`;
      clone.style.backgroundImage = `url(${actualProduct.image})`;
    }
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    document.body.appendChild(clone);

    const targetRect = cartIconRef.current.getBoundingClientRect();

    gsap.to(clone, {
      x: targetRect.left - rect.left,
      y: targetRect.top - rect.top,
      width: 20,
      height: 20,
      opacity: 0.5,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        clone.remove();
        
        setCartItems(prev => {
          const existing = prev.find(item => item.id === actualProduct.id);
          if (existing) {
            return prev.map(item => item.id === actualProduct.id ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { ...actualProduct, quantity: 1, _imgClass: imgClass }];
        });

        gsap.fromTo(cartIconRef.current, { scale: 1 }, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 });
      }
    });

    // Create bubbles
    for(let i=0; i<3; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'tiny-bubble';
      bubble.style.left = `${rect.left + rect.width/2 + (Math.random()*20-10)}px`;
      bubble.style.top = `${rect.top + rect.height/2 + (Math.random()*20-10)}px`;
      document.body.appendChild(bubble);
      
      gsap.to(bubble, {
        y: -100 - Math.random()*50,
        x: (Math.random()-0.5)*50,
        opacity: 0,
        duration: 1 + Math.random(),
        onComplete: () => bubble.remove()
      });
    }
  };

  const handleWishlist = (e, product, productImgClass = null) => {
    const isMock = typeof product === 'string';
    const actualProduct = isMock ? getMockProduct(product) : product;
    const imgClass = isMock ? product : productImgClass;

    triggerFeedback(e, "♥ Saved", true);
    
    const btn = e.currentTarget;
    gsap.fromTo(btn, { scale: 1 }, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1 });

    const rect = btn.getBoundingClientRect();
    const clone = document.createElement('div');
    if (imgClass) {
      clone.className = `floating-product ${imgClass} wishlist-float`;
    } else {
      clone.className = `floating-product wishlist-float`;
      clone.style.backgroundImage = `url(${actualProduct.image})`;
    }
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `40px`;
    clone.style.height = `40px`;
    clone.style.borderRadius = '50%';
    document.body.appendChild(clone);

    const targetRect = wishlistIconRef.current.getBoundingClientRect();

    // Curved path animation using different eases for x and y
    gsap.to(clone, {
      x: targetRect.left - rect.left,
      ease: "power1.inOut",
      duration: 0.8
    });
    gsap.to(clone, {
      y: targetRect.top - rect.top,
      width: 15,
      height: 15,
      opacity: 0,
      ease: "power2.in",
      duration: 0.8,
      onComplete: () => {
        clone.remove();
        
        setWishlistItems(prev => {
          if (!prev.find(item => item.id === actualProduct.id)) {
            return [...prev, { ...actualProduct, _imgClass: imgClass }];
          }
          return prev;
        });

        gsap.fromTo(wishlistIconRef.current, { scale: 1 }, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 });
      }
    });
  };

  const increaseQuantity = (id) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decreaseQuantity = (id) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const removeFromWishlist = (id) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  const moveToCart = (product) => {
    removeFromWishlist(product.id);
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <div className="app-container">
      {feedbacks.map(f => (
        <div key={f.id} className="bubble-feedback" style={{ left: f.x, top: f.y }}>
          {f.text}
        </div>
      ))}
      <nav className="navbar">
        <div className="logo reveal-heading shimmer-text">AQUARIA</div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#collections">Collections</a></li>
          <li><a onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>Services</a></li>
          <li className="nav-icon" ref={wishlistIconRef} onClick={() => setIsWishlistOpen(true)}>
            <span>♥</span>
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </li>
          <li className="nav-icon" ref={cartIconRef} onClick={() => setIsCartOpen(true)}>
            <span>🛒</span>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </li>
        </ul>
      </nav>
      
      <div ref={containerRef} className="hero-container" id="home">
        <div className="hero-text" style={{ pointerEvents: 'auto', zIndex: 50 }}>
          <div className="greeting-container reveal-heading">
            <span key={greetingIndex} className="animated-greeting shimmer-text">{greetings[greetingIndex]}</span>
          </div>
          
          <h1 className="reveal-heading shimmer-text">Discover the Deep</h1>
          
          {/* Scroll-based storytelling text */}
          <div className="hero-scroll-text" style={{ marginTop: '1rem', minHeight: '60px', position: 'relative' }}>
            <p className="hero-story-1" style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 1, position: 'absolute', width: '100%', left: 0 }}>Welcome to Aquaria - Premium Aquatic Lifestyle</p>
            <p className="hero-story-2" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Curated Aquarium Products for Your Space</p>
            <p className="hero-story-3" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Exclusive Exotic Betta Fish & Supplies</p>
            <p className="hero-story-4" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Professional Maintenance & Aquascaping Services</p>
            <p className="hero-story-5" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Uncompromising Quality in Every Product</p>
            <p className="hero-story-6" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Expert Advice on Care and Maintenance</p>
            <p className="hero-story-7" style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0, position: 'absolute', width: '100%', left: 0, transform: 'translateY(20px)' }}>Experience the Difference with Us</p>
          </div>
          
          <div className="hero-buttons reveal-heading" style={{ marginTop: '2rem', zIndex: 60, position: 'relative' }}>
            <button onClick={() => navigate('/shop')} className="checkout-btn" style={{ padding: '1rem 2rem', width: 'auto', pointerEvents: 'auto', marginRight: '1rem', zIndex: 60, position: 'relative' }}>Shop Now</button>
            <button onClick={() => navigate('/book-service')} className="add-to-cart" style={{ padding: '1rem 2rem', width: 'auto', pointerEvents: 'auto', zIndex: 60, position: 'relative' }}>Book a Service</button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hero-canvas"></canvas>
        
        <div className="scroll-indicator">
          <p>Scroll to explore</p>
          <div className="mouse"></div>
        </div>
      </div>
      
      <section className="content-section" id="collections">
        <div className="section-title reveal-heading">
          <h2 className="shimmer-text">Why Choose Aquaria</h2>
          <div className="divider"></div>
        </div>
        <div className="content-grid">
          <div className="content-card">
            <h3>Exquisite Design</h3>
            <p>Our aquariums are crafted with the finest materials and attention to detail, creating a stunning centerpiece for any room.</p>
          </div>
          <div className="content-card">
            <h3>Advanced Technology</h3>
            <p>State-of-the-art filtration and lighting systems ensure a healthy environment for your aquatic life with minimal maintenance.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="content-section" id="contact" style={{ background: 'var(--color-bg-dark)', padding: '6rem 5%' }}>
        <div className="section-title reveal-heading">
          <h2 className="shimmer-text">Contact Us</h2>
          <div className="divider"></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--color-accent-gold)', marginBottom: '1.5rem' }}>Get in Touch</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>We would love to hear from you. Whether you have a question about our premium aquariums or need support with a recent order, our team is ready to answer all your questions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-muted)' }}>
              <p><strong>📞 Phone:</strong> +{settings.whatsapp}</p>
              <p><strong>✉️ Email:</strong> contact@aquaria.com</p>
              <p><strong>💬 WhatsApp:</strong> +{settings.whatsapp}</p>
              <p><strong>📍 Address:</strong> 123 Aquatic Plaza, Marine Drive, Mumbai</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <a href="#" style={{ color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '4px' }}>Instagram</a>
              <a href="#" style={{ color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '4px' }}>Facebook</a>
              <a href="#" style={{ color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '4px' }}>YouTube</a>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input required placeholder="Your Name" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', color: 'white', borderRadius: '4px', outline: 'none' }} />
              <input required type="email" placeholder="Email Address" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', color: 'white', borderRadius: '4px', outline: 'none' }} />
              <input placeholder="Phone Number" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', color: 'white', borderRadius: '4px', outline: 'none' }} />
              <textarea required placeholder="Your Message" rows="4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', color: 'white', borderRadius: '4px', outline: 'none', resize: 'vertical' }}></textarea>
              <button type="submit" className="checkout-btn" style={{ marginTop: '1rem' }}>Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 Aquaria Luxury Shop. All rights reserved. | <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer', opacity: 0.5 }}>Admin Login</span></p>
      </footer>

      {/* Floating WhatsApp Button to cover watermark */}
      <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="whatsapp-float" title="Chat with us on WhatsApp">
        <svg viewBox="0 0 32 32" className="whatsapp-icon">
          <path fill="#25D366" d="M16.05 32h-.05c-2.65 0-5.23-.71-7.53-2.06L0 32l2.12-8.25C.71 21.43 0 18.79 0 16.05 0 7.2 7.2 0 16.05 0 24.89 0 32 7.2 32 16.05 32 24.89 24.89 32 16.05 32zM8.5 27.27l.48.28c2.14 1.27 4.59 1.94 7.07 1.94 7.45 0 13.52-6.07 13.52-13.52S23.5 2.45 16.05 2.45 2.53 8.52 2.53 15.97c0 2.56.69 5.05 2.01 7.24l.31.51-1.25 4.88 5-1.33z"/>
          <path fill="#FFF" d="M23.46 18.52c-.41-.21-2.42-1.2-2.79-1.34-.38-.14-.65-.21-.92.21-.28.41-1.06 1.34-1.3 1.62-.24.28-.48.31-.89.1-1.92-.95-3.37-2.18-4.66-4.43-.33-.58.17-.55.97-2.16.14-.28.07-.52-.03-.73-.1-.21-.92-2.23-1.27-3.05-.33-.8-.67-.69-.92-.71-.24-.01-.52-.01-.79-.01s-.72.1-1.1.52c-.38.41-1.44 1.41-1.44 3.44s1.47 3.99 1.68 4.27c.21.28 2.91 4.44 7.05 6.23 1.98.86 2.87.97 4.02.82 1.32-.17 2.42-.99 2.76-1.95.34-.96.34-1.78.24-1.95-.08-.19-.36-.29-.77-.5z"/>
        </svg>
      </a>
      {/* Cart Sidebar */}
      <div className={`overlay-backdrop ${isCartOpen ? 'active' : ''}`} onClick={() => setIsCartOpen(false)}></div>
      <div className={`sidebar cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Your Cart</h3>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>×</button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="sidebar-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className={`cart-item-img ${item._imgClass || ''}`} style={!item._imgClass ? { backgroundImage: `url(${item.image})` } : {}}></div>
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{item.name}</h4>
                    <div className="cart-item-price">₹{item.price}</div>
                    <div className="cart-qty-controls">
                      <button className="qty-btn" onClick={() => decreaseQuantity(item.id)}>-</button>
                      <span>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => increaseQuantity(item.id)}>+</button>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sidebar-footer">
              <div className="cart-total">
                <span>Subtotal:</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <button className="checkout-btn" onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>Checkout</button>
              <button className="remove-btn" onClick={clearCart} style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}>Clear Cart</button>
            </div>
          </>
        )}
      </div>

      {/* Wishlist Sidebar */}
      <div className={`overlay-backdrop ${isWishlistOpen ? 'active' : ''}`} onClick={() => setIsWishlistOpen(false)}></div>
      <div className={`sidebar wishlist-sidebar ${isWishlistOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Wishlist</h3>
          <button className="close-btn" onClick={() => setIsWishlistOpen(false)}>×</button>
        </div>
        
        {wishlistItems.length === 0 ? (
          <div className="empty-state">
            <p>Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="sidebar-items">
            {wishlistItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className={`cart-item-img ${item._imgClass || ''}`} style={!item._imgClass ? { backgroundImage: `url(${item.image})` } : {}}></div>
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <div className="cart-item-price">₹{item.price}</div>
                  <div className="cart-qty-controls">
                    <button className="move-to-cart-btn" onClick={() => moveToCart(item)} style={{ padding: '0.5rem', fontSize: '0.8rem', width: 'auto' }}>Add to Cart</button>
                    <button className="remove-btn" onClick={() => removeFromWishlist(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Details Modal */}
      {productModal && (
        <div className="admin-modal-backdrop" onClick={() => setProductModal(null)} style={{ zIndex: 10000 }}>
          <div className="admin-modal" style={{ maxWidth: '800px', flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ flex: '1 1 300px', background: '#111', minHeight: '300px', position: 'relative' }}>
               {typeof productModal.image === 'string' && productModal.image.startsWith('fish-') ? (
                  <div className={`mock-image ${productModal.image}`} style={{ width: '100%', height: '100%', position: 'absolute' }}></div>
                ) : (
                  <img src={productModal.image} alt={productModal.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
                )}
            </div>
            <div style={{ flex: '1 1 350px', padding: '2.5rem', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h2 style={{ color: 'var(--color-accent-gold)', fontSize: '2rem', margin: 0 }}>{productModal.name}</h2>
                <button onClick={() => setProductModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', padding: '0 0.5rem' }}>✕</button>
              </div>
              
              <div className="price-row" style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                <span className="price">₹{productModal.sale_price || productModal.price}</span>
                {productModal.sale_price && <span className="old-price">₹{productModal.price}</span>}
              </div>
              
              <div style={{ flex: 1, marginBottom: '2rem' }}>
                <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Description</h4>
                <p style={{ lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{productModal.description || "This premium aquatic product has been carefully selected to enhance your aquarium's aesthetic and health. Designed for ease of use and long-lasting beauty."}</p>
                
                <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>How to Use / Details</h4>
                <p style={{ lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                  1. Unpack carefully and rinse if necessary.<br/>
                  2. Place strategically in your setup for optimal visual impact.<br/>
                  3. Ensure compatibility with your existing livestock.<br/>
                  4. Perform regular maintenance to keep it pristine.
                </p>
              </div>

              <button 
                className="checkout-btn" 
                onClick={(e) => { 
                  if(productModal.stock > 0) {
                    handleAddToCart(e, productModal, typeof productModal.image === 'string' && productModal.image.startsWith('fish-') ? productModal.image : null); 
                    setProductModal(null); 
                  }
                }} 
                disabled={productModal.stock === 0}
                style={{ width: '100%', padding: '1rem', opacity: productModal.stock === 0 ? 0.5 : 1, cursor: productModal.stock === 0 ? 'not-allowed' : 'pointer' }}
              >
                {productModal.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
