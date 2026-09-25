import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './App.css';

function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    
    const onMouseMove = (e) => {
      const { clientX: x, clientY: y } = e;
      
      gsap.to(cursor, {
        x: x,
        y: y,
        duration: 0.15,
        ease: "power2.out"
      });

      // Subtle bubble trails occasionally
      if (Math.random() > 0.95) {
        const bubble = document.createElement('div');
        bubble.className = 'cursor-bubble';
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        document.body.appendChild(bubble);
        
        gsap.to(bubble, {
          y: y - 50 - Math.random() * 50,
          opacity: 0,
          scale: Math.random() * 1.5 + 0.5,
          duration: 1.5,
          ease: "power1.out",
          onComplete: () => bubble.remove()
        });
      }
    };
    
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return <div id="custom-cursor" ref={cursorRef} className="custom-cursor"></div>;
}

export default CustomCursor;
