import {
  ArrowRight,
  Check,
  Eye,
  Gavel,
  Hand,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { MAX_TURNS } from '../constants';
import { GameRoom } from '../lib/firestore';
import { cn, getRandomInt, getRandomItem, mulberry32 } from '../lib/utils';
import { AttachedItem, Pack, PackItem, Player, Tier } from '../types';
import TierBoard from './TierBoard';
import { Button } from './ui/button';

interface GameLoopMultiplayerProps {
  room: GameRoom;
  pack: Pack;
  currentPlayer: Player | null;
  onPlaceItem: (item: AttachedItem, newTurnIndex: number) => Promise<void>;
  onGameEnd: (finalComposition: AttachedItem[]) => Promise<void>;
}

const GameLoopMultiplayer: React.FC<GameLoopMultiplayerProps> = ({
  room,
  pack,
  currentPlayer,
  onPlaceItem,
  onGameEnd,
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [tentativeTier, setTentativeTier] = useState<Tier | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  // Improved Drag State
  const [dragState, setDragState] = useState({
    isDragging: false,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    width: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate current turn data using consistent RNG
  const rng = useRef(mulberry32(room.seed + room.currentTurnIndex));

  // Recalculate leader and card when turn changes
  useEffect(() => {
    rng.current = mulberry32(room.seed + room.currentTurnIndex);
  }, [room.seed, room.currentTurnIndex]);

  const leaderIndex = getRandomInt(
    0,
    room.players.length - 1,
    mulberry32(room.seed + room.currentTurnIndex)
  );
  const leader = room.players[leaderIndex];
  const currentCard: PackItem = getRandomItem(
    pack.items,
    mulberry32(room.seed + room.currentTurnIndex + 1000)
  );

  const isCurrentLeader = currentPlayer?.id === leader?.id;

  // Check for game end - any player can trigger this
  useEffect(() => {
    if (room.currentTurnIndex >= MAX_TURNS && room.phase === 'GAME_LOOP') {
      // Only host triggers the end to avoid race conditions
      if (currentPlayer?.id === room.hostId) {
        onGameEnd(room.composition);
      }
    }
  }, [
    room.currentTurnIndex,
    room.composition,
    room.phase,
    room.hostId,
    onGameEnd,
    currentPlayer?.id,
  ]);

  // Splash screen timer - simplified logic
  useEffect(() => {
    // Always show splash initially and on turn changes
    setShowSplash(true);
    setTentativeTier(null);
    setDragState(prev => ({ ...prev, isDragging: false }));

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [room.currentTurnIndex]); // Re-run whenever turn index changes

  // Handle tentative drop
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
        y: e.clientY - prev.originY,
      }));
    };

    const handleGlobalUp = (e: PointerEvent) => {
      e.preventDefault();
      setDragState(prev => ({ ...prev, isDragging: false }));

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const droppedTierElement = elements.find(el =>
        el.getAttribute('data-tier-id')
      );

      if (droppedTierElement) {
        const tierId = droppedTierElement.getAttribute('data-tier-id') as Tier;
        if (tierId) {
          handleTentativeDrop(tierId);
        }
      } else {
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
  }, [dragState.isDragging]);

  const handleConfirmPlacement = async () => {
    if (!currentCard || !tentativeTier || !isCurrentLeader) return;

    setIsPlacing(true);
    try {
      const attachment: AttachedItem = {
        ...currentCard,
        attachedBy: leader.id,
        tier: tentativeTier,
        rotation: (Math.random() - 0.5) * 10,
      };

      await onPlaceItem(attachment, room.currentTurnIndex + 1);
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCurrentLeader) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();

    setDragState({
      isDragging: true,
      x: rect.left,
      y: rect.top,
      originX: e.clientX - rect.left,
      originY: e.clientY - rect.top,
      width: rect.width,
    });
  };

  const handlePickupTentative = (e: React.PointerEvent) => {
    if (!isCurrentLeader) return;

    e.preventDefault();
    setTentativeTier(null);

    const width = 300;
    const height = 160;

    setDragState({
      isDragging: true,
      x: e.clientX - width / 2,
      y: e.clientY - height / 2,
      originX: width / 2,
      originY: height / 2,
      width: width,
    });
  };

  if (showSplash) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-pop-in pb-8 relative items-center justify-center min-h-[60vh] px-4">
        <div
          className="text-center mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <h2 className="text-xl text-stone-500 font-bold uppercase tracking-widest">
            Turn {room.currentTurnIndex + 1} / {MAX_TURNS}
          </h2>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full">
          <div
            className="flex flex-col items-center space-y-4 animate-pop-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative group">
              <div
                className={cn(
                  'text-white w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 z-10 relative transition-transform duration-500 group-hover:scale-105',
                  isCurrentLeader
                    ? 'bg-accent border-orange-200'
                    : 'bg-stone-900 border-stone-200'
                )}
              >
                <span className="text-4xl font-black">
                  {leader?.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="absolute -top-2 -right-2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm transform rotate-12 flex items-center gap-1 animate-bounce-slow">
                <Gavel className="w-3 h-3" />
                JUDGE
              </div>
              {isCurrentLeader && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  You!
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-stone-900">
                {leader?.name}
              </h3>
              <p className="text-stone-500 font-medium">is ranking...</p>
            </div>
          </div>
          <div className="text-stone-300 transform md:rotate-0 rotate-90 animate-pulse-fast">
            <ArrowRight className="w-8 h-8" />
          </div>
          {currentCard && (
            <div
              className="flex flex-col items-center space-y-4 animate-pop-in"
              style={{ animationDelay: '0.4s' }}
            >
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
                <h3 className="text-2xl font-black text-stone-900 max-w-[200px] leading-tight">
                  {currentCard.name}
                </h3>
                <p className="text-xs text-stone-400 font-bold uppercase mt-1">
                  {currentCard.type}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Non-leader view (watching)
  if (!isCurrentLeader) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8 relative">
        <div className="flex-1 overflow-y-auto mb-4">
          <TierBoard
            items={room.composition}
            players={room.players}
            isDragging={false}
            tentativePlacement={null}
            onPickupTentative={() => {}}
          />
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center space-y-4 bg-stone-50 p-8 rounded-xl border-2 border-stone-200">
            <Eye className="w-12 h-12 mx-auto text-stone-300" />
            <div>
              <p className="text-lg font-bold text-stone-900">
                {leader?.name} is making their choice...
              </p>
              <p className="text-sm text-stone-500 mt-1">
                Watch and wait for the next turn
              </p>
            </div>
            {currentCard && (
              <div className="flex items-center justify-center gap-3 bg-white p-4 rounded-lg border border-stone-200">
                <img
                  src={currentCard.imageUrl}
                  alt={currentCard.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="text-left">
                  <p className="font-bold">{currentCard.name}</p>
                  <p className="text-xs text-stone-400 uppercase">
                    {currentCard.type}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Leader view (playing)
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8 relative touch-none select-none">
      <div className="flex-1 overflow-y-auto mb-4 opacity-100 transition-opacity">
        <TierBoard
          items={room.composition}
          players={room.players}
          isDragging={dragState.isDragging}
          tentativePlacement={
            tentativeTier && currentCard
              ? { item: currentCard, tier: tentativeTier }
              : null
          }
          onPickupTentative={handlePickupTentative}
        />
      </div>

      <div className="min-h-[250px] flex items-end justify-center relative z-50">
        {tentativeTier && currentCard && !dragState.isDragging && (
          <div className="w-full max-w-md bg-white p-6 rounded-xl border-2 border-stone-200 shadow-lg text-center space-y-4 animate-pop-in">
            <p className="text-stone-500 font-medium">
              Placed in{' '}
              <span className="font-bold text-stone-900">
                {tentativeTier} Tier
              </span>
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setTentativeTier(null)}
                variant="outline"
                className="flex-1 active:scale-95 transition-transform"
                disabled={isPlacing}
              >
                Change
              </Button>
              <Button
                onClick={handleConfirmPlacement}
                className="flex-1 bg-stone-900 text-white text-lg font-bold py-6 hover:scale-105 transition-transform shadow-lg active:scale-95"
                disabled={isPlacing}
              >
                {isPlacing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Next Turn
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-stone-400">
              or drag the card again to move it
            </p>
          </div>
        )}

        {(!tentativeTier || dragState.isDragging) && currentCard && (
          <div className="relative w-full flex justify-center">
            {!dragState.isDragging && (
              <div className="absolute -top-12 animate-bounce-slow text-center w-full z-0 pointer-events-none">
                <span className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  You're the judge! Drag to rank!
                </span>
              </div>
            )}

            <div
              ref={cardRef}
              onPointerDown={handlePointerDown}
              className={cn(
                'cursor-grab active:cursor-grabbing bg-white overflow-hidden rounded-xl touch-action-none',
                'border-4 border-accent shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]',
                dragState.isDragging
                  ? 'z-[9999] shadow-[16px_16px_0px_0px_rgba(234,88,12,0.5)] scale-105'
                  : 'w-full max-w-md hover:scale-[1.02] hover:-rotate-1',
                !dragState.isDragging
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]'
                  : ''
              )}
              style={
                dragState.isDragging
                  ? {
                      position: 'fixed',
                      left: 0,
                      top: 0,
                      width:
                        dragState.width > 0 ? `${dragState.width}px` : '350px',
                      transform: `translate(${dragState.x}px, ${dragState.y}px) rotate(5deg)`,
                      pointerEvents: 'none',
                    }
                  : undefined
              }
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
                  <p className="text-xs font-bold uppercase opacity-50">
                    Your Turn!
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-lg text-xl font-black border-2 border-stone-200 text-stone-300',
                        'bg-stone-50'
                      )}
                    >
                      <HelpCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="font-black text-xl leading-tight line-clamp-2">
                    {currentCard.name}
                  </p>
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

export default GameLoopMultiplayer;
