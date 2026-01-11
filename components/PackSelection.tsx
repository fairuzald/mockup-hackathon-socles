import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { PACKS } from '../constants';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface PackSelectionProps {
  onSelect: (packId: string) => void;
  onBack: () => void;
}

const PackSelection: React.FC<PackSelectionProps> = ({ onSelect, onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handleNext = () => {
    if (activeIndex < PACKS.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      // Loop back to start
      setActiveIndex(0);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      setActiveIndex(PACKS.length - 1);
    }
  };

  // Touch/Mouse Handlers
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const currentX = clientX;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 100; // px to trigger swipe

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    setDragOffset(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-slide-up space-y-4 md:space-y-8 px-4 pt-4 overflow-visible">
      {/* Header */}
      <div className="w-full flex items-center justify-center relative max-w-md md:max-w-full z-10 mb-4 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute left-0 text-stone-500 hover:text-stone-900 transition-colors px-0 hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
        <h2 className="text-2xl md:text-4xl font-black text-stone-900 text-center uppercase tracking-widest">
          Pick a Vibe
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full max-w-md md:max-w-2xl lg:max-w-4xl flex items-center justify-center">
        {/* Desktop Prev Button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute left-0 z-20 h-full w-24 rounded-none justify-center text-stone-400 transition-all h-fit rounded-full aspect-square items-center hover:text-black"
          onClick={handlePrev}
        >
          <ChevronLeft className="w-10 h-10 lg:w-16 lg:h-16" />
        </Button>

        {/* Swipeable Track Area */}
        <div
          className="w-full overflow-visible touch-pan-y py-4 px-2"
          ref={containerRef}
          onTouchStart={e => handleDragStart(e.touches[0].clientX)}
          onTouchMove={e => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
          onMouseDown={e => handleDragStart(e.clientX)}
          onMouseMove={e => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <div
            className={cn(
              'flex w-full cursor-grab active:cursor-grabbing',
              !isDragging &&
                'transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)'
            )}
            style={{
              transform: `translateX(calc(-${
                activeIndex * 100
              }% + ${dragOffset}px))`,
            }}
          >
            {PACKS.map((pack, index) => (
              <div
                key={pack.id}
                className="min-w-full flex justify-center p-2 md:p-6 transition-opacity duration-300"
                style={{
                  opacity: Math.abs(index - activeIndex) > 1 ? 0 : 1, // Optimization
                }}
              >
                <div className="w-full max-w-sm md:max-w-md perspective-1000">
                  <Card
                    className={cn(
                      'w-full overflow-hidden border-4 border-stone-900 bg-white transform transition-transform duration-300',
                      // Add shadow only to the active card to pop it out
                      index === activeIndex
                        ? 'shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] scale-100'
                        : 'shadow-none scale-95 opacity-50'
                    )}
                  >
                    {/* Image Showcase - 2x2 Grid */}
                    <div className="aspect-[4/3] w-full bg-stone-100 grid grid-cols-2 grid-rows-2 gap-0.5 border-b-4 border-stone-900 pointer-events-none select-none">
                      {pack.items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="relative overflow-hidden w-full h-full bg-stone-200"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>

                    <CardContent className="p-5 md:p-8 text-center space-y-4 md:space-y-6 select-none">
                      <div className="space-y-2 md:space-y-3">
                        <div
                          className={cn(
                            'inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm',
                            pack.themeColor,
                            'text-stone-900 border border-stone-900/10'
                          )}
                        >
                          {pack.items.length} Items Included
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-stone-900 leading-none tracking-tight">
                          {pack.name}
                        </h3>
                        <p className="text-stone-500 font-medium text-sm md:text-lg leading-relaxed line-clamp-2">
                          {pack.description}
                        </p>
                      </div>

                      <Button
                        onClick={e => {
                          e.stopPropagation(); // Prevent drag triggers
                          onSelect(pack.id);
                        }}
                        className="w-full h-12 md:h-16 text-base md:text-xl font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-lg active:translate-y-1 active:shadow-sm transition-all duration-200"
                      >
                        Select Vibe{' '}
                        <Check className="w-5 h-5 md:w-6 md:h-6 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Next Button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute right-0 z-20 h-full w-24 rounded-none justify-center text-stone-400 transition-all h-fit rounded-full aspect-square items-center hover:text-black"
          onClick={handleNext}
        >
          <ChevronRight className="w-12 h-12" />
        </Button>
      </div>

      {/* Mobile Navigation Controls & Indicators */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Indicators */}
        <div className="flex gap-2">
          {PACKS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                idx === activeIndex
                  ? 'bg-stone-900 w-6'
                  : 'bg-stone-300 hover:bg-stone-400'
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Hint Text */}
        <p className="text-xs text-stone-400 font-medium uppercase tracking-widest md:hidden animate-pulse">
          Swipe to browse
        </p>
      </div>
    </div>
  );
};

export default PackSelection;
