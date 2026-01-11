import {
  AlertCircle,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface RoomEntryProps {
  onCreateRoom: (name: string) => Promise<string | null>;
  onJoinRoom: (code: string, name: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  clearSession: () => void;
}

type Mode = 'initial' | 'create' | 'join';

const RoomEntry: React.FC<RoomEntryProps> = ({
  onCreateRoom,
  onJoinRoom,
  loading,
  error,
  clearError,
  clearSession,
}) => {
  const [mode, setMode] = useState<Mode>('initial');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearError();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateRoom(name.trim());
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    await onJoinRoom(roomCode.trim(), name.trim());
  };

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
            {mode === 'initial' && 'Play with Friends'}
            {mode === 'create' && 'Create a Room'}
            {mode === 'join' && 'Join a Room'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'initial' && (
            <div className="space-y-3">
              <Button
                onClick={() => handleModeChange('create')}
                size="lg"
                className="w-full text-lg bg-accent hover:bg-orange-600 text-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-transform active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Room
              </Button>
              <Button
                onClick={() => handleModeChange('join')}
                size="lg"
                variant="outline"
                className="w-full text-lg border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-transform active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Join Room
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border-stone-400 focus-visible:ring-stone-900 text-base"
                  maxLength={12}
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleModeChange('initial')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-orange-600 text-white"
                  disabled={!name.trim() || loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">
                  Room Code
                </label>
                <Input
                  placeholder="XXXX"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  className="border-stone-400 focus-visible:ring-stone-900 text-base text-center font-mono text-2xl tracking-widest uppercase"
                  maxLength={4}
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border-stone-400 focus-visible:ring-stone-900 text-base"
                  maxLength={12}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleModeChange('initial')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-orange-600 text-white"
                  disabled={!name.trim() || !roomCode.trim() || loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Clear session button for stuck sessions */}
      <button
        onClick={clearSession}
        className="w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center justify-center gap-1.5 py-2"
      >
        <RefreshCw className="w-3 h-3" />
        Having trouble? Clear session
      </button>
    </div>
  );
};

export default RoomEntry;
