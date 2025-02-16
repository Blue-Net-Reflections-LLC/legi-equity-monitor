'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StateCard } from './StateCard';
import { STATES } from '@/app/constants/states';
import './styles.css';

interface StateSliderProps {
  currentStateCode?: string;
}

export function StateSlider({ currentStateCode }: StateSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Load saved scroll position
  useEffect(() => {
    const savedPosition = localStorage.getItem('stateSliderPosition');
    if (savedPosition && sliderRef.current) {
      sliderRef.current.scrollLeft = parseInt(savedPosition);
      setScrollPosition(parseInt(savedPosition));
    }
  }, []);

  // Save scroll position
  const handleScroll = () => {
    if (sliderRef.current) {
      const position = sliderRef.current.scrollLeft;
      setScrollPosition(position);
      localStorage.setItem('stateSliderPosition', position.toString());
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      // Calculate scroll amount based on container width (show approximately 4-5 new items)
      const scrollAmount = sliderRef.current.offsetWidth - 100; // Subtract some padding
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full mb-8 px-4 md:px-8">
      {/* Desktop Navigation Buttons */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto hide-scrollbar gap-4 py-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {STATES.map((state) => (
          <StateCard
            key={state.code}
            state={state}
            isSelected={currentStateCode?.toLowerCase() === state.code.toLowerCase()}
          />
        ))}
      </div>
    </div>
  );
} 