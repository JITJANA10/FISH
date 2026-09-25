import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Checkout from './Checkout.jsx'
import Services from './Services.jsx'
import Admin from './Admin.jsx'
import CustomCursor from './CustomCursor.jsx'
import BettaFish from './BettaFish.jsx'
import Shop from './Shop.jsx'
import ProductDetails from './ProductDetails.jsx'

const MOCK_PRODUCTS = [
  { id: 1, name: 'Premium Guppy Pair', category_id: 'c1', price: 299, image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80', stock: 10, description: 'Beautiful premium guppies with vibrant colors.' },
  { id: 2, name: 'Tetra Min Flakes', category_id: 'c2', price: 450, sale_price: 399, image: 'https://images.unsplash.com/photo-1520302621453-61a7a242c7aa?auto=format&fit=crop&w=800&q=80', stock: 25, description: 'High quality flakes for tropical fish.' },
  { id: 3, name: 'Glass Tank 2ft', category_id: 'c3', price: 2500, image: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0462?auto=format&fit=crop&w=800&q=80', stock: 5, description: 'Crystal clear rimless glass tank for aquascaping.' },
  { id: 4, name: 'Anubias Nana', category_id: 'c4', price: 350, image: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=800&q=80', stock: 15, description: 'Hardy live plant, perfect for beginners.' },
  { id: 5, name: 'Neon Tetra School', category_id: 'c1', price: 599, image: 'https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?auto=format&fit=crop&w=800&q=80', stock: 0, description: 'School of 10 beautiful neon tetras.' }
];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CustomCursor />
    <BettaFish />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/services" element={<Services />} />
        <Route path="/book-service" element={<Services />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/shop" element={<Shop 
          cartCount={0} 
          wishlistCount={0} 
          settings={{ whatsapp: '1234567890' }} 
          mockCategories={[
            { id: 'c1', name: 'AQUARIUM FISH' },
            { id: 'c2', name: 'FISH FOOD' },
            { id: 'c3', name: 'AQUARIUM / FISH TANK' },
            { id: 'c4', name: 'LIVE AQUARIUM PLANTS' }
          ]} 
          mockProducts={MOCK_PRODUCTS} 
        />} />
        <Route path="/shop/product/:id" element={<ProductDetails mockProducts={MOCK_PRODUCTS} />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
