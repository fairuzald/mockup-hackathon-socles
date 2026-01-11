import { AlertCircle, Play, UserPlus, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Player } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface LobbyProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onStart: () => void;
}

const Lobby: React.FC<LobbyProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onStart,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();

    // 1. Empty Check
    if (!trimmedName) {
      return;
    }

    // 2. Duplicate Check (Case-insensitive)
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('That name is already taken!');
      return;
    }

    // 3. Max Limit Check (UI safety)
    if (players.length >= 12) {
      setError('Lobby is full (max 12 players).');
      return;
    }

    onAddPlayer(trimmedName);
    setName('');
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(null); // Clear error as soon as user types
  };

  const canStart = players.length >= 2;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-slide-up">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-stone-900">
          TierClash
        </h1>
        <p className="text-stone-500 font-medium">Holiday Edition</p>
      </div>

      <Card className="border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Who's joining?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdd} className="relative">
            <div className="flex gap-2">
              <Input
                placeholder="Enter name..."
                value={name}
                onChange={handleInputChange}
                className={cn(
                  'border-stone-400 focus-visible:ring-stone-900 transition-colors text-base md:text-sm', // text-base prevents iOS zoom
                  error &&
                    'border-red-500 focus-visible:ring-red-500 bg-red-50 text-red-900 placeholder:text-red-300'
                )}
                maxLength={12}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                className={cn(
                  'shrink-0 bg-stone-900 hover:bg-stone-800 transition-all',
                  !name.trim() && 'opacity-50'
                )}
                disabled={!name.trim()}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Error Message */}
            <div
              className={cn(
                'absolute -bottom-6 left-0 flex items-center gap-1.5 text-xs font-bold text-red-500 transition-all duration-300 transform',
                error
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              )}
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2 mt-6">
            {players.map(player => (
              <div
                key={player.id}
                className="group relative flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg shadow-sm transition-all hover:border-stone-400"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold border border-stone-200 shrink-0`}
                  >
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{player.name}</span>
                </div>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-all focus:opacity-100"
                  aria-label={`Remove ${player.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {players.length === 0 && (
              <div className="col-span-2 text-center py-8 text-stone-400 border-2 border-dashed border-stone-200 rounded-lg">
                Waiting for players...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onStart}
        disabled={!canStart}
        size="lg"
        className={cn(
          'w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-transform active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]',
          !canStart
            ? 'opacity-50 cursor-not-allowed bg-stone-300'
            : 'bg-accent hover:bg-orange-600 text-white'
        )}
      >
        <Play className="w-5 h-5 mr-2" />
        Start Game
      </Button>

      {!canStart && players.length > 0 && (
        <p className="text-center text-sm text-stone-500">
          Need at least 2 players to start.
        </p>
      )}
    </div>
  );
};

export default Lobby;
