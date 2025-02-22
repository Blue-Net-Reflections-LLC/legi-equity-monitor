'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { STATES } from '../constants/states';
import styles from './AnimatedStatesMap.module.css';

// Dynamically import the InteractiveMap component with no SSR
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
});

export default function AnimatedStatesMap() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mapElement: HTMLElement | null = null;

    const animateStates = () => {
      if (!mapElement) return;

      // Get one random state
      let randomState;
      do {
        randomState = STATES[Math.floor(Math.random() * STATES.length)];
      } while (randomState.code === 'US' || randomState.code === 'DC');

      // Remove previous animations
      mapElement.querySelectorAll('path').forEach((path: Element) => {
        path.classList.remove(styles.animate);
      });

      // Add animation to selected state
      const statePath = mapElement.querySelector(`#${randomState.code}`);
      if (statePath) {
        statePath.classList.add(styles.animate);
      }
    };

    const stopAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear any existing animations
      if (mapElement) {
        mapElement.querySelectorAll('path').forEach((path: Element) => {
          path.classList.remove(styles.animate);
        });
      }
    };

    const startAnimation = () => {
      if (!mapElement) return;
      stopAnimation(); // Clear any existing animations first
      animateStates();
      intervalRef.current = setInterval(animateStates, 300);
    };

    const handleMouseEnter = () => {
      stopAnimation();
    };

    const handleMouseLeave = () => {
      startAnimation();
    };

    // Wait for the map to be loaded
    const checkMapLoaded = setInterval(() => {
      mapElement = document.getElementById('us-map');
      if (mapElement) {
        clearInterval(checkMapLoaded);
        
        // Add hover event listeners
        mapElement.addEventListener('mouseenter', handleMouseEnter);
        mapElement.addEventListener('mouseleave', handleMouseLeave);
        
        // Start initial animation
        startAnimation();
      }
    }, 100);

    return () => {
      clearInterval(checkMapLoaded);
      stopAnimation();
      if (mapElement) {
        mapElement.removeEventListener('mouseenter', handleMouseEnter);
        mapElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <InteractiveMap />
    </div>
  );
} 