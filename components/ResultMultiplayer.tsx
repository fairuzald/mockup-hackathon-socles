import { LogOut, RotateCcw, Share2, Trophy } from 'lucide-react';
import React from 'react';
import { GameRoom } from '../lib/firestore';
import { cn } from '../lib/utils';
import { Pack } from '../types';
import TierBoard from './TierBoard';
import { Button } from './ui/button';

interface ResultMultiplayerProps {
  room: GameRoom;
  pack: Pack;
  isHost: boolean;
  onReset: () => Promise<void>;
  onLeave: () => Promise<void>;
}

const ResultMultiplayer: React.FC<ResultMultiplayerProps> = ({
  room,
  pack,
  isHost,
  onReset,
  onLeave,
}) => {
  const handleShare = async () => {
    const shareText = `Check out our tier list from VibeCheck Chaos Edition! 🎉 Room: ${room.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'VibeCheck Results',
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    } catch (err) {
      // User cancelled
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <Trophy className="w-6 h-6" />
          <span className="text-xl font-black">Results!</span>
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900">
          {pack.name} Tier List
        </h1>
        <p className="text-stone-500 mt-2">
          Created by{' '}
          {room.players.map((p, i) => (
            <span key={p.id}>
              <span className="font-bold">{p.name}</span>
              {i < room.players.length - 2
                ? ', '
                : i === room.players.length - 2
                ? ' & '
                : ''}
            </span>
          ))}
        </p>
      </div>

      {/* Tier Board */}
      <div className="flex-1 overflow-y-auto mb-4">
        <TierBoard
          items={room.composition}
          players={room.players}
          isDragging={false}
          tentativePlacement={null}
          onPickupTentative={() => {}}
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleShare}
          size="lg"
          variant="outline"
          className="w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Results
        </Button>

        {isHost ? (
          <Button
            onClick={onReset}
            size="lg"
            className={cn(
              'w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]',
              'bg-accent hover:bg-orange-600 text-white',
              'transition-transform active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]'
            )}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        ) : (
          <div className="text-center py-4 bg-stone-50 rounded-lg">
            <p className="text-sm text-stone-500">
              Waiting for <span className="font-bold">{room.hostName}</span> to
              start a new game...
            </p>
          </div>
        )}

        <Button
          onClick={onLeave}
          variant="ghost"
          size="sm"
          className="w-full text-stone-400 hover:text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </div>
  );
};

export default ResultMultiplayer;
