import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

export default function BettaFish() {
  const fishRef = useRef(null);
  const [foods, setFoods] = useState([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const fishPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e) => {
      // Don't drop food if clicking on interactive UI elements
      if (e.target.closest('button, a, input, select, textarea, .admin-sidebar, .admin-modal, .sidebar, .product-card')) return;
      const newFood = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setFoods(prev => [...prev, newFood]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let animationId;
    
    const updateFish = () => {
      if (!fishRef.current) return;

      setFoods(currentFoods => {
        let targetX = mouseRef.current.x;
        let targetY = mouseRef.current.y;
        let speed = 0.015; // Slow ambient following

        if (currentFoods.length > 0) {
          targetX = currentFoods[0].x;
          targetY = currentFoods[0].y;
          speed = 0.06; // Fast swimming for food
          
          const dist = Math.hypot(targetX - fishPosRef.current.x, targetY - fishPosRef.current.y);
          if (dist < 20) {
            // Eat the food
            return currentFoods.slice(1);
          }
        }

        // Move fish position smoothly
        const dx = targetX - fishPosRef.current.x;
        const dy = targetY - fishPosRef.current.y;
        fishPosRef.current.x += dx * speed;
        fishPosRef.current.y += dy * speed;
        
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Prevent swimming upside-down
        let scaleY = 1;
        if (Math.abs(angle) > 90) {
          scaleY = -1;
        }

        gsap.set(fishRef.current, {
          x: fishPosRef.current.x - 40, // offset half width
          y: fishPosRef.current.y - 25, // offset half height
          rotation: angle,
          scaleY: scaleY
        });

        return currentFoods;
      });

      animationId = requestAnimationFrame(updateFish);
    };

    animationId = requestAnimationFrame(updateFish);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <div 
        ref={fishRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '80px', height: '50px',
          zIndex: 9998,
          pointerEvents: 'none',
          transformOrigin: 'center center'
        }}
      >
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }}>
          {/* Flowing Tail (Left side) */}
          <path d="M25,25 Q5,5 0,20 Q10,25 0,30 Q5,45 25,25 Z" fill="#ff4d4d" opacity="0.8" />
          {/* Top Fin */}
          <path d="M40,18 Q50,0 65,20 Z" fill="#ff4d4d" opacity="0.7" />
          {/* Bottom Fin */}
          <path d="M40,32 Q50,50 65,30 Z" fill="#ff4d4d" opacity="0.7" />
          {/* Betta Fish Body (Nose at right) */}
          <path d="M20,25 Q50,12 75,25 Q50,38 20,25 Z" fill="#d4af37" />
          {/* Eye */}
          <circle cx="65" cy="22" r="2.5" fill="#000" />
        </svg>
      </div>

      {foods.map(food => (
        <div 
          key={food.id}
          style={{
            position: 'fixed',
            top: food.y, left: food.x,
            width: '8px', height: '8px',
            backgroundColor: '#d4af37',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9997,
            pointerEvents: 'none',
            boxShadow: '0 0 8px rgba(212,175,55,0.8)'
          }}
        />
      ))}
    </>
  );
}
