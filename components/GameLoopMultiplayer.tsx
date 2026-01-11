import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  Gavel,
  Hand,
  Loader2,
  LogOut,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { GameRoom } from '../lib/firestore';
import { cn, getRandomInt, mulberry32 } from '../lib/utils';
import { AttachedItem, Pack, Player, Tier } from '../types';
import TierBoard from './TierBoard';
import { Button } from './ui/button';

interface GameLoopMultiplayerProps {
  room: GameRoom;
  pack: Pack;
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceItem: (item: AttachedItem, newTurnIndex: number) => Promise<void>;
  onGameEnd: (finalComposition: AttachedItem[]) => Promise<void>;
  onLeaveGame: () => Promise<void>;
  onEndAndDeleteRoom: () => Promise<void>;
  onRemovePlayer: (player: Player) => Promise<void>;
  onFinishEarly: () => Promise<void>;
}

const GameLoopMultiplayer: React.FC<GameLoopMultiplayerProps> = ({
  room,
  pack,
  currentPlayer,
  isHost,
  onPlaceItem,
  onGameEnd,
  onLeaveGame,
  onEndAndDeleteRoom,
  onRemovePlayer,
  onFinishEarly,
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [tentativeTier, setTentativeTier] = useState<Tier | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showPackInfo, setShowPackInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);

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

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Create a deterministic shuffle of items based on room seed
  const shuffledItems = React.useMemo(() => {
    const items = [...pack.items];
    const rng = mulberry32(room.seed);

    // Fisher-Yates shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [pack.items, room.seed]);

  // Round-robin turn order:
  // First leader is randomly determined by seed, then we cycle through players in order
  const startingPlayerIndex = getRandomInt(
    0,
    room.players.length - 1,
    mulberry32(room.seed) // Only use seed, not turn index, so starting player is fixed
  );
  // Cycle through players: (startingIndex + turnIndex) % playerCount
  const leaderIndex =
    (startingPlayerIndex + room.currentTurnIndex) % room.players.length;
  const leader = room.players[leaderIndex];

  // Pick the card for this turn from the shuffled list that hasn't been played yet
  const currentCard = React.useMemo(() => {
    return shuffledItems.find(
      item => !room.composition.some(placed => placed.id === item.id)
    );
  }, [shuffledItems, room.composition]);

  const isCurrentLeader = currentPlayer?.id === leader?.id;

  // Check for game end - any player can trigger this
  useEffect(() => {
    // Game ends when all items have been played
    if (
      room.composition.length >= pack.items.length &&
      room.phase === 'GAME_LOOP'
    ) {
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
    pack.items.length,
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

    const originX = width * 0.85;

    setDragState({
      isDragging: true,
      x: e.clientX - originX,
      y: e.clientY - height / 2,
      originX: originX,
      originY: height / 2,
      width: width,
    });
  };

  // Pack Info Modal - Rendered at top level to ensure it covers the entire screen
  const PackInfoModal = showPackInfo && (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowPackInfo(false)}
    >
      <div
        className="bg-white rounded-2xl border-4 border-stone-900 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] max-w-lg w-full max-h-[80vh] overflow-hidden animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-stone-200 bg-stone-50">
          <div>
            <h3 className="text-xl font-black text-stone-900">{pack.name}</h3>
            <p className="text-sm text-stone-500">
              {pack.items.length} items total
            </p>
          </div>
          <button
            onClick={() => setShowPackInfo(false)}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {pack.items.map(item => {
              const isPlaced = room.composition.some(c => c.id === item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'relative rounded-lg overflow-hidden border-2 transition-all',
                    isPlaced
                      ? 'border-green-400 opacity-60'
                      : 'border-stone-200 hover:border-stone-400'
                  )}
                >
                  <div className="aspect-square bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-1.5 bg-white">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {item.name}
                    </p>
                  </div>
                  {isPlaced && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600 drop-shadow-lg" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-stone-200 bg-stone-50">
          <p className="text-xs text-center text-stone-500">
            <Check className="w-3 h-3 inline-block mr-1 text-green-500" />
            {room.composition.length} placed ·{' '}
            {pack.items.length - room.composition.length} remaining
          </p>
        </div>
      </div>
    </div>
  );

  // Room Code Chip component - displays room code with copy functionality
  const RoomCodeChip = (
    <button
      onClick={handleCopyCode}
      className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-stone-700 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 border border-stone-200 group w-fit"
      title="Click to copy room code"
    >
      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
        Room
      </span>
      <span className="text-sm font-black tracking-widest text-stone-900">
        {room.id}
      </span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
      )}
    </button>
  );

  // Info button component for reuse - Floating pill design
  const InfoButton = (
    <button
      onClick={() => setShowPackInfo(true)}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-white/30 w-fit"
    >
      <span className="text-sm font-bold">View All Items</span>
      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold">{pack.items.length}</span>
      </div>
    </button>
  );

  // Leave game button
  const LeaveButton = (
    <button
      onClick={onLeaveGame}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full shadow-sm hover:bg-stone-200 hover:text-stone-800 transition-all duration-200 border border-stone-200 shrink-0"
      title="Leave game"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">Leave</span>
    </button>
  );

  // Kick player button (host only)
  const ManagePlayersButton = isHost && (
    <button
      onClick={() => setShowPlayerMenu(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full shadow-sm hover:bg-stone-200 hover:text-stone-800 transition-all duration-200 border border-stone-200 shrink-0"
      title="Manage players"
    >
      <UserX className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">Kick</span>
    </button>
  );

  // End room button (host only)
  const EndRoomButton = isHost && (
    <button
      onClick={onEndAndDeleteRoom}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full shadow-sm hover:bg-red-100 hover:text-red-700 transition-all duration-200 border border-red-200 shrink-0"
      title="End game and delete room"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">End</span>
    </button>
  );

  // Player Management Modal
  const PlayerMenuModal = showPlayerMenu && (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowPlayerMenu(false)}
    >
      <div
        className="bg-white rounded-2xl border-4 border-stone-900 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] max-w-sm w-full overflow-hidden animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-stone-200 bg-stone-50">
          <h3 className="text-lg font-black text-stone-900">Manage Players</h3>
          <button
            onClick={() => setShowPlayerMenu(false)}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {room.players.map(player => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-xs">
                  {player.name.substring(0, 1).toUpperCase()}
                </div>
                <span className="font-bold text-sm">
                  {player.name}
                  {player.id === currentPlayer?.id && ' (You)'}
                </span>
              </div>
              {player.id !== currentPlayer?.id ? (
                <button
                  onClick={async () => {
                    if (
                      confirm(`Are you sure you want to kick ${player.name}?`)
                    ) {
                      await onRemovePlayer(player);
                    }
                  }}
                  className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  title="Kick player"
                >
                  <UserX className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs text-stone-400 font-bold bg-stone-200 px-2 py-1 rounded">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Header bar with room code, info button, and controls
  const HeaderBar = (
    <div className="w-full mb-4 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {RoomCodeChip}
          {LeaveButton}
          {ManagePlayersButton}
          {EndRoomButton}
        </div>
        {InfoButton}
      </div>
      {PlayerMenuModal}
    </div>
  );

  if (showSplash) {
    return (
      <>
        {PackInfoModal}
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-pop-in pb-8 px-4">
          {HeaderBar}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div
              className="text-center mb-8 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <h2 className="text-xl text-stone-500 font-bold uppercase tracking-widest">
                Turn {room.currentTurnIndex + 1} / {pack.items.length}
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
                  <div className="absolute -top-2 -right-2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm transform rotate-12 flex items-center gap-1 animate-bounce-slow z-[1000000]">
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
        </div>
      </>
    );
  }

  // Non-leader view (watching)
  if (!isCurrentLeader) {
    return (
      <>
        {PackInfoModal}
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8 px-2">
          {HeaderBar}

          <div className="flex-1 overflow-y-auto mb-4 relative flex">
            {/* Rank Direction Indicator */}
            <div className="w-6 mr-1 flex flex-col items-center justify-center py-4 bg-stone-100 rounded-full my-auto h-[80%] opacity-50 hover:opacity-100 transition-opacity self-center">
              <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase -rotate-90 whitespace-nowrap mb-2">
                Higher
              </span>
              <ArrowRight className="w-3 h-3 text-stone-400 -rotate-90 mt-1" />
            </div>

            <div className="flex-1">
              <TierBoard
                items={room.composition}
                players={room.players}
                isDragging={false}
                tentativePlacement={null}
                onPickupTentative={() => {}}
              />
            </div>
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
      </>
    );
  }

  // Leader view (playing)
  return (
    <>
      {PackInfoModal}
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8 px-2 touch-none select-none">
        {HeaderBar}

        <div className="flex-1 overflow-y-auto mb-4 opacity-100 transition-opacity relative flex">
          {/* Rank Direction Indicator */}
          <div className="w-6 mr-1 flex flex-col items-center justify-center py-4 bg-stone-100 rounded-full my-auto h-[80%] opacity-50 hover:opacity-100 transition-opacity self-center">
            <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase -rotate-90 whitespace-nowrap mb-2">
              Higher
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400 -rotate-90 mt-1" />
          </div>

          <div className="flex-1">
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
                          dragState.width > 0
                            ? `${dragState.width}px`
                            : '350px',
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
                      {/* <div
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-lg text-xl font-black border-2 border-stone-200 text-stone-300',
                        'bg-stone-50'
                      )}
                    >
                      <HelpCircle className="w-6 h-6" />
                    </div> */}
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
    </>
  );
};

export default GameLoopMultiplayer;
