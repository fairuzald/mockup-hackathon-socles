import {
  Check,
  Copy,
  Crown,
  Loader2,
  LogOut,
  Play,
  Share2,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { GameRoom } from '../lib/firestore';
import { cn } from '../lib/utils';
import { Player } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface RoomLobbyProps {
  room: GameRoom;
  currentPlayer: Player | null;
  isHost: boolean;
  onStartGame: () => Promise<void>;
  onRemovePlayer: (player: Player) => Promise<void>;
  onLeaveRoom: () => Promise<void>;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  currentPlayer,
  isHost,
  onStartGame,
  onRemovePlayer,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join my TierClash game!',
      text: `Join my TierClash Holiday Edition game! Room code: ${room.id}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        handleCopyCode();
      }
    } catch (err) {
      // User cancelled sharing
    }
  };

  const handleStartGame = async () => {
    setStartingGame(true);
    try {
      await onStartGame();
    } finally {
      setStartingGame(false);
    }
  };

  const canStart = room.players.length >= 2;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-slide-up">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-stone-900">
          TierClash
        </h1>
        <p className="text-stone-500 font-medium">Holiday Edition</p>
      </div>

      {/* Room Code Card */}
      <Card className="border-2 border-accent bg-gradient-to-br from-orange-50 to-amber-50 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.5)]">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl font-black tracking-[0.3em] text-stone-900">
                {room.id}
              </span>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="border-stone-300"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="border-stone-300"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Card */}
      <Card className="border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Players ({room.players.length}/12)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {room.players.map(player => (
              <div
                key={player.id}
                className={cn(
                  'group relative flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm transition-all',
                  player.id === currentPlayer?.id
                    ? 'border-accent bg-orange-50'
                    : 'border-stone-200 hover:border-stone-400'
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold border border-stone-200 shrink-0">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{player.name}</span>
                  {player.id === room.hostId && (
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                {/* Remove button for host (can't remove self) */}
                {isHost && player.id !== currentPlayer?.id && (
                  <button
                    onClick={() => onRemovePlayer(player)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-all focus:opacity-100"
                    aria-label={`Remove ${player.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {room.players.length < 2 && (
              <div className="col-span-2 text-center py-8 text-stone-400 border-2 border-dashed border-stone-200 rounded-lg">
                Waiting for more players...
              </div>
            )}
          </div>

          {/* Waiting message for non-host */}
          {!isHost && (
            <div className="text-center py-4 bg-stone-50 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
              <p className="text-sm text-stone-500">
                Waiting for <span className="font-bold">{room.hostName}</span>{' '}
                to start the game...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Game Button (host only) */}
      {isHost && (
        <Button
          onClick={handleStartGame}
          disabled={!canStart || startingGame}
          size="lg"
          className={cn(
            'w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-transform active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]',
            !canStart
              ? 'opacity-50 cursor-not-allowed bg-stone-300'
              : 'bg-accent hover:bg-orange-600 text-white'
          )}
        >
          {startingGame ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </>
          )}
        </Button>
      )}

      {!canStart && room.players.length > 0 && (
        <p className="text-center text-sm text-stone-500">
          Need at least 2 players to start.
        </p>
      )}

      {/* Leave Room Button */}
      <Button
        onClick={onLeaveRoom}
        variant="ghost"
        size="sm"
        className="w-full text-stone-400 hover:text-red-500 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Leave Room
      </Button>
    </div>
  );
};

export default RoomLobby;
