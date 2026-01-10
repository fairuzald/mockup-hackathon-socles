import React, { useState, useEffect, useRef } from 'react';
import { GameState, Pack, AttachedItem, PackItem, Tier } from '../types';
import { mulberry32, getRandomInt, getRandomItem, cn } from '../lib/utils';
import { TIERS_CONFIG, MAX_TURNS } from '../constants';
import { Button } from './ui/button';
import { Card } from './ui/card';
import TierBoard from './TierBoard';
import { Check, Hand, HelpCircle, ArrowRight, Gavel } from 'lucide-react';

interface GameLoopProps {
  gameState: GameState;
  pack: Pack;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onGameEnd: (finalComposition: AttachedItem[]) => void;
}

const GameLoop: React.FC<GameLoopProps> = ({ gameState, pack, setGameState, onGameEnd }) => {
  const [currentCard, setCurrentCard] = useState<PackItem | null>(null);
  const [leaderIndex, setLeaderIndex] = useState(0);
  
  const [showSplash, setShowSplash] = useState(true);
  const [tentativeTier, setTentativeTier] = useState<Tier | null>(null);

  // Improved Drag State: Tracks absolute position and offset
  const [dragState, setDragState] = useState({ 
    isDragging: false,
    x: 0, 
    y: 0, 
    originX: 0, // Mouse offset relative to card top-left
    originY: 0,
    width: 0    // Capture width to prevent resizing during drag
  });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const rng = useRef(mulberry32(gameState.seed + gameState.currentTurnIndex));

  // Determine Turn Data
  useEffect(() => {
    if (gameState.currentTurnIndex >= MAX_TURNS) {
      onGameEnd(gameState.composition);
      return;
    }

    const newRng = mulberry32(gameState.seed + gameState.currentTurnIndex);
    const leaderIdx = getRandomInt(0, gameState.players.length - 1, newRng);
    setLeaderIndex(leaderIdx);

    const card = getRandomItem(pack.items, newRng);
    setCurrentCard(card);
    
    setTentativeTier(null);
    setShowSplash(true);
    setDragState(prev => ({ ...prev, isDragging: false }));

    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);

  }, [gameState.currentTurnIndex, gameState.seed, gameState.players.length, pack.items, onGameEnd, gameState.composition]);

  const leader = gameState.players[leaderIndex];

  // Helper to handle drops
  const handleTentativeDrop = (targetTier: Tier) => {
    setTentativeTier(targetTier);
  };

  // Global Drag Event Listeners
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleGlobalMove = (e: PointerEvent) => {
      e.preventDefault();
      setDragState(prev => ({
        ...prev,
        x: e.clientX - prev.originX,
        y: e.clientY - prev.originY
      }));
    };

    const handleGlobalUp = (e: PointerEvent) => {
      e.preventDefault();
      setDragState(prev => ({ ...prev, isDragging: false }));

      // Hit Test
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const droppedTierElement = elements.find(el => el.getAttribute('data-tier-id'));
      
      if (droppedTierElement) {
        const tierId = droppedTierElement.getAttribute('data-tier-id') as Tier;
        if (tierId) {
          handleTentativeDrop(tierId);
        }
      } else {
          // If dropped in invalid space, reset to hand (or keep tentative if it was already there? No, reset to hand is safer UX)
          setTentativeTier(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [dragState.isDragging]); // Dependencies: Runs effect when drag starts

  const handleConfirmPlacement = () => {
    if (!currentCard || !tentativeTier) return;

    const attachment: AttachedItem = {
      ...currentCard,
      attachedBy: leader.id,
      tier: tentativeTier,
      rotation: (Math.random() - 0.5) * 10,
    };

    setGameState(prev => ({
      ...prev,
      composition: [...prev.composition, attachment],
      currentTurnIndex: prev.currentTurnIndex + 1
    }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    setDragState({
        isDragging: true,
        x: rect.left,
        y: rect.top,
        originX: e.clientX - rect.left,
        originY: e.clientY - rect.top,
        width: rect.width
    });
  };

  const handlePickupTentative = (e: React.PointerEvent) => {
      e.preventDefault();
      setTentativeTier(null); 
      
      // Spawn dimensions (approximate matches the card UI)
      const width = 300; 
      const height = 160;
      
      setDragState({ 
          isDragging: true,
          x: e.clientX - (width / 2), 
          y: e.clientY - (height / 2),
          originX: width / 2,
          originY: height / 2,
          width: width
      });
  };

  if (showSplash) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-pop-in pb-8 relative items-center justify-center min-h-[60vh] px-4">
         <div className="text-center mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
            <h2 className="text-xl text-stone-500 font-bold uppercase tracking-widest">
                Turn {gameState.currentTurnIndex + 1} / {MAX_TURNS}
            </h2>
         </div>
         <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full">
            <div className="flex flex-col items-center space-y-4 animate-pop-in" style={{animationDelay: '0.2s'}}>
                <div className="relative group">
                    <div className="bg-stone-900 text-white w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 border-stone-200 z-10 relative transition-transform duration-500 group-hover:scale-105">
                        <span className="text-4xl font-black">{leader?.name.substring(0,2).toUpperCase()}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm transform rotate-12 flex items-center gap-1 animate-bounce-slow">
                        <Gavel className="w-3 h-3" />
                        JUDGE
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-stone-900">{leader?.name}</h3>
                    <p className="text-stone-500 font-medium">is ranking...</p>
                </div>
            </div>
            <div className="text-stone-300 transform md:rotate-0 rotate-90 animate-pulse-fast">
                <ArrowRight className="w-8 h-8" />
            </div>
            {currentCard && (
                <div className="flex flex-col items-center space-y-4 animate-pop-in" style={{animationDelay: '0.4s'}}>
                    <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-xl border-4 border-stone-900 transform -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                        <div className="w-full h-full rounded-lg overflow-hidden bg-stone-100 relative">
                            <img 
                                src={currentCard.imageUrl} 
                                alt={currentCard.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-stone-900 max-w-[200px] leading-tight">{currentCard.name}</h3>
                        <p className="text-xs text-stone-400 font-bold uppercase mt-1">{currentCard.type}</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8 relative touch-none select-none">
      <div className="flex-1 overflow-y-auto mb-4 opacity-100 transition-opacity">
        <TierBoard 
            items={gameState.composition} 
            players={gameState.players}
            isDragging={dragState.isDragging}
            tentativePlacement={tentativeTier && currentCard ? { item: currentCard, tier: tentativeTier } : null}
            onPickupTentative={handlePickupTentative}
        />
      </div>
      
      <div className="min-h-[250px] flex items-end justify-center relative z-50">
        
        {tentativeTier && currentCard && !dragState.isDragging && (
             <div className="w-full max-w-md bg-white p-6 rounded-xl border-2 border-stone-200 shadow-lg text-center space-y-4 animate-pop-in">
                 <p className="text-stone-500 font-medium">Placed in <span className="font-bold text-stone-900">{tentativeTier} Tier</span></p>
                 <div className="flex gap-4">
                     <Button 
                        onClick={() => setTentativeTier(null)}
                        variant="outline" 
                        className="flex-1 active:scale-95 transition-transform"
                     >
                        Change
                     </Button>
                     <Button 
                        onClick={handleConfirmPlacement}
                        className="flex-1 bg-stone-900 text-white text-lg font-bold py-6 hover:scale-105 transition-transform shadow-lg active:scale-95"
                     >
                        <Check className="w-5 h-5 mr-2" />
                        Next Turn
                     </Button>
                 </div>
                 <p className="text-xs text-stone-400">or drag the card again to move it</p>
             </div>
        )}

        {(!tentativeTier || dragState.isDragging) && currentCard && (
            <div className="relative w-full flex justify-center">
                 {!dragState.isDragging && (
                    <div className="absolute -top-12 animate-bounce-slow text-center w-full z-0 pointer-events-none">
                        <span className="bg-stone-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            Drag to rank!
                        </span>
                    </div>
                )}

                <div 
                    ref={cardRef}
                    onPointerDown={handlePointerDown}
                    className={cn(
                        "cursor-grab active:cursor-grabbing bg-white overflow-hidden rounded-xl touch-action-none",
                        "border-4 border-stone-900 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]",
                        dragState.isDragging ? "z-[9999] shadow-[16px_16px_0px_0px_rgba(28,25,23,0.5)] scale-105" : "w-full max-w-md hover:scale-[1.02] hover:-rotate-1",
                        // Smooth transition only when NOT dragging (for the hover effect and initial pop-in), 
                        // but instant when dragging
                        !dragState.isDragging ? "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]" : ""
                    )}
                    style={dragState.isDragging ? {
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: dragState.width > 0 ? `${dragState.width}px` : '350px',
                        transform: `translate(${dragState.x}px, ${dragState.y}px) rotate(5deg)`,
                        pointerEvents: 'none' // Important: Let events fall through to window/document elementsFromPoint
                    } : undefined}
                >
                    <div className="flex flex-row h-40 pointer-events-none">
                        <div className="w-1/2 bg-stone-100 relative h-full">
                            <img 
                            src={currentCard.imageUrl} 
                            alt={currentCard.name} 
                            className="w-full h-full object-cover pointer-events-none"
                            />
                        </div>
                        <div className="w-1/2 p-4 flex flex-col justify-center items-center bg-white space-y-2 h-full text-center">
                            <p className="text-xs font-bold uppercase opacity-50">Current Item</p>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-lg text-xl font-black border-2 border-stone-200 text-stone-300",
                                    "bg-stone-50"
                                )}>
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="font-black text-xl leading-tight line-clamp-2">{currentCard.name}</p>
                            <Hand className="w-4 h-4 text-stone-400" />
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GameLoop;