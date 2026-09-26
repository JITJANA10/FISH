import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

export default function BettaFish() {
  const fishRef = useRef(null);
  const [foods, setFoods] = useState([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const fishPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const foodsRef = useRef([]); // Use ref for food tracking in loop
  
  // Use state to force mobile re-check on resize, but initially just check innerWidth
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) return; // Don't run animation on mobile

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e) => {
      if (e.target.closest('button, a, input, select, textarea, .admin-sidebar, .admin-modal, .sidebar, .product-card')) return;
      const newFood = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setFoods(prev => {
        const next = [...prev, newFood];
        foodsRef.current = next; // Sync to ref
        return next;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let animationId;

    const updateFish = () => {
      if (!fishRef.current) return;

      let targetX = mouseRef.current.x;
      let targetY = mouseRef.current.y;
      let speed = 0.015;

      if (foodsRef.current.length > 0) {
        targetX = foodsRef.current[0].x;
        targetY = foodsRef.current[0].y;
        speed = 0.06;
        
        const dist = Math.hypot(targetX - fishPosRef.current.x, targetY - fishPosRef.current.y);
        if (dist < 20) {
          // Eat the food
          setFoods(prev => {
            const next = prev.slice(1);
            foodsRef.current = next;
            return next;
          });
        }
      }

      const dx = targetX - fishPosRef.current.x;
      const dy = targetY - fishPosRef.current.y;
      fishPosRef.current.x += dx * speed;
      fishPosRef.current.y += dy * speed;
      
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      let scaleY = 1;
      if (Math.abs(angle) > 90) scaleY = -1;

      // Update position directly via GSAP without triggering React renders
      gsap.set(fishRef.current, {
        x: fishPosRef.current.x - 40,
        y: fishPosRef.current.y - 25,
        rotation: angle,
        scaleY: scaleY
      });

      animationId = requestAnimationFrame(updateFish);
    };

    animationId = requestAnimationFrame(updateFish);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
    };
  }, [isMobile]);

  if (isMobile) return null; // Remove fish on mobile completely

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
          <path d="M25,25 Q5,5 0,20 Q10,25 0,30 Q5,45 25,25 Z" fill="#ff4d4d" opacity="0.8" />
          <path d="M40,18 Q50,0 65,20 Z" fill="#ff4d4d" opacity="0.7" />
          <path d="M40,32 Q50,50 65,30 Z" fill="#ff4d4d" opacity="0.7" />
          <path d="M20,25 Q50,12 75,25 Q50,38 20,25 Z" fill="#d4af37" />
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
