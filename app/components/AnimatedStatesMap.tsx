'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { STATES } from '../constants/states';
import styles from './AnimatedStatesMap.module.css';

// Dynamically import the InteractiveMap component with no SSR
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
});

// Expanded vivid color palette (avoiding red, blue, purple)
const THEME_COLORS = [
  // Vibrant Greens
  '#22c55e', // green-500
  '#16a34a', // green-600
  '#15803d', // green-700
  
  // Bright Emeralds
  '#10b981', // emerald-500
  '#059669', // emerald-600
  '#047857', // emerald-700
  
  // Vivid Teals
  '#14b8a6', // teal-500
  '#0d9488', // teal-600
  '#0f766e', // teal-700
  
  // Bright Limes
  '#84cc16', // lime-500
  '#65a30d', // lime-600
  '#4d7c0f', // lime-700
  
  // Warm Oranges
  '#f97316', // orange-500
  '#ea580c', // orange-600
  '#c2410c', // orange-700
  
  // Rich Ambers
  '#f59e0b', // amber-500
  '#d97706', // amber-600
  '#b45309', // amber-700
  
  // Bright Yellows
  '#eab308', // yellow-500
  '#ca8a04', // yellow-600
  '#a16207', // yellow-700
  
  // Modern Neutrals
  '#78716c', // stone-500
  '#57534e', // stone-600
  '#44403c', // stone-700
  
  // Cyan Accents
  '#06b6d4', // cyan-500
  '#0891b2', // cyan-600
  '#0e7490', // cyan-700
];

export default function AnimatedStatesMap() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mapElement: HTMLElement | null = null;

    const getRandomColor = () => {
      const color = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
      return color;
    };

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
        (path as HTMLElement).style.removeProperty('--highlight-color');
      });

      // Add animation to selected state with random color
      const statePath = mapElement.querySelector(`#${randomState.code}`);
      if (statePath) {
        (statePath as HTMLElement).style.setProperty('--highlight-color', getRandomColor());
        statePath.classList.add(styles.animate);
      }
    };

    const stopAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear any existing animations and colors
      if (mapElement) {
        mapElement.querySelectorAll('path').forEach((path: Element) => {
          path.classList.remove(styles.animate);
          (path as HTMLElement).style.removeProperty('--highlight-color');
        });
      }
    };

    const startAnimation = () => {
      if (!mapElement) return;
      stopAnimation(); // Clear any existing animations first
      animateStates();
      intervalRef.current = setInterval(animateStates, 425); // Keep each color visible for 425ms
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