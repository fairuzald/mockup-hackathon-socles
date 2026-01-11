import { toPng } from 'html-to-image';
import { Camera, Loader2, LogOut, RotateCcw, Trophy } from 'lucide-react';
import React, { useRef, useState } from 'react';
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
  const boardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShare = async () => {
    if (!boardRef.current) return;

    setIsDownloading(true);

    const download = (dataUrl: string) => {
      const link = document.createElement('a');
      link.download = `vibecheck-results-${room.id}.png`;
      link.href = dataUrl;
      link.click();
    };

    const options = {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#1c1c1c',
      style: { overflow: 'visible', height: 'auto', maxHeight: 'none' },
    } as any;

    try {
      // Attempt 1: Standard Capture
      const dataUrl = await toPng(boardRef.current, {
        ...options,
        cacheBust: true,
        useCORS: true,
        skipOnError: true,
      });
      download(dataUrl);
    } catch (err) {
      console.warn('Standard capture failed, trying fallback...', err);
      try {
        // Attempt 2: "Security Bypass" - Exclude images
        const dataUrl = await toPng(boardRef.current, {
          ...options,
          filter: (node: any) => node.tagName !== 'IMG',
        });
        download(dataUrl);
        alert(
          'Saved with restricted images hidden. Some content might be missing due to browser security settings.'
        );
      } catch (finalErr) {
        console.error('All capture attempts failed', finalErr);
        alert('Failed to generate image. Please take a manual screenshot.');
      }
    } finally {
      setIsDownloading(false);
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
      <div
        className="flex-1 overflow-y-auto mb-4 bg-[#1c1c1c] rounded-lg"
        ref={boardRef}
      >
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
          disabled={isDownloading}
          size="lg"
          variant="outline"
          className="w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:bg-stone-100"
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Camera className="w-5 h-5 mr-2" />
          )}
          {isDownloading ? 'Saving...' : 'Save Screenshot'}
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
