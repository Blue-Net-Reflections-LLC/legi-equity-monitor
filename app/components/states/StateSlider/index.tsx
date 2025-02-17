'use client';

import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StateCard } from './StateCard';
import { STATES } from '@/app/constants/states';
import { useDispatch, useSelector } from 'react-redux';
import { setScrollPosition, setCurrentPosition } from '@/app/lib/redux/features/stateSlider/stateSliderSlice';
import type { RootState } from '@/app/lib/redux/store';
import './styles.css';

interface StateSliderProps {
  currentStateCode?: string;
}

export function StateSlider({ currentStateCode }: StateSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { stateScrollPositions, currentPosition } = useSelector((state: RootState) => state.stateSlider);

  // Move US to the beginning of the list
  const usState = STATES.find(s => s.code === 'US');
  const otherStates = STATES.filter(s => s.code !== 'US');
  const displayStates = usState ? [usState, ...otherStates] : otherStates;

  // Initial scroll position
  useEffect(() => {
    if (sliderRef.current && currentStateCode) {
      const stateCode = currentStateCode.toLowerCase();
      const savedPosition = stateScrollPositions[stateCode];
      
      if (savedPosition !== undefined) {
        // Use saved position for this state
        sliderRef.current.scrollTo({ left: savedPosition, behavior: 'instant' });
      } else {
        // Center the selected state
        const selectedCard = sliderRef.current.querySelector(`[href="/${stateCode}"]`) as HTMLElement;
        if (selectedCard) {
          const scrollLeft = selectedCard.offsetLeft - (sliderRef.current.offsetWidth / 2) + (selectedCard.offsetWidth / 2);
          sliderRef.current.scrollTo({ left: scrollLeft, behavior: 'instant' });
          dispatch(setScrollPosition({ stateCode, position: scrollLeft }));
        }
      }
    }
  }, [currentStateCode]);

  // Handle scroll
  const handleScroll = () => {
    if (sliderRef.current) {
      dispatch(setCurrentPosition(sliderRef.current.scrollLeft));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth - 100;
      const newPosition = direction === 'left' 
        ? currentPosition - scrollAmount 
        : currentPosition + scrollAmount;
      
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
        <ChevronLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
      </button>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto hide-scrollbar gap-4 py-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {displayStates.map((state, index) => (
          <StateCard
            key={`${state.code}-${index}`}
            state={state}
            isSelected={currentStateCode?.toLowerCase() === state.code.toLowerCase()}
          />
        ))}
      </div>
    </div>
  );
} 