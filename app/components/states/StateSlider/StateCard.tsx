'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { setScrollPosition } from '@/app/lib/redux/features/stateSlider/stateSliderSlice';

interface StateCardProps {
  state: {
    name: string;
    code: string;
  };
  isSelected: boolean;
  onCardClick?: () => void;
}

export function StateCard({ state, isSelected }: StateCardProps) {
  const dispatch = useDispatch();

  const handleClick = () => {
    const slider = document.querySelector('.hide-scrollbar');
    if (slider) {
      dispatch(setScrollPosition({
        stateCode: state.code.toLowerCase(),
        position: slider.scrollLeft
      }));
    }
  };

  return (
    <Link
      href={`/${state.code.toLowerCase()}`}
      onClick={handleClick}
      className={cn(
        "flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-lg overflow-hidden transition-all duration-300",
        "bg-transparent backdrop-blur-sm",
        !isSelected && "hover:bg-zinc-100/10 dark:hover:bg-white/5",
        "scroll-snap-align-start py-2"
      )}
    >
      <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
        {state.code === 'US' ? (
          <div className={cn(
            "relative w-12 h-12",
            isSelected && "after:absolute after:inset-[-4px] after:rounded-full after:bg-orange-500/40 after:animate-pulse after:blur-lg"
          )}>
            <Image
              src="/images/Seal_of_the_United_States_Congress.svg"
              alt={state.name}
              fill
              className="object-contain relative z-10"
            />
          </div>
        ) : state.code === 'DC' ? (
          <div className={cn(
            "relative w-12 h-12",
            isSelected && "after:absolute after:inset-[-4px] after:rounded-full after:bg-orange-500/40 after:animate-pulse after:blur-lg"
          )}>
            <div className={cn(
              "text-2xl font-bold relative z-10",
              isSelected
                ? "text-orange-500 dark:text-orange-400"
                : "text-zinc-900 dark:text-white"
            )}>
              DC
            </div>
          </div>
        ) : (
          <div className={cn(
            "relative w-12 h-12",
            isSelected && "after:absolute after:inset-[-4px] after:rounded-full after:bg-orange-500/40 after:animate-pulse after:blur-lg"
          )}>
            <Image
              src={`/images/states/${state.code.toLowerCase()}.svg`}
              alt={state.name}
              fill
              className={cn(
                "object-contain relative z-10",
                isSelected && "[filter:sepia(1)_saturate(10000%)_hue-rotate(310deg)_brightness(0.9)]"
              )}
            />
          </div>
        )}
      </div>
      <div className={cn(
        "text-sm font-semibold text-center px-2",
        isSelected
          ? "text-orange-500 dark:text-orange-400"
          : "text-zinc-900 dark:text-white"
      )}>
        {state.name}
      </div>
    </Link>
  );
} 