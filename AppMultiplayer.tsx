import { AlertCircle, ExternalLink } from 'lucide-react';
import React from 'react';
import GameLoopMultiplayer from './components/GameLoopMultiplayer';
import PackSelection from './components/PackSelection';
import ResultMultiplayer from './components/ResultMultiplayer';
import RoomEntry from './components/RoomEntry';
import RoomLobby from './components/RoomLobby';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { PACKS } from './constants';
import { useGameRoom } from './hooks/useGameRoom';

const AppMultiplayer: React.FC = () => {
  const {
    room,
    loading,
    error,
    isHost,
    currentPlayer,
    isConfigured,
    createNewRoom,
    joinExistingRoom,
    leaveCurrentRoom,
    removePlayer,
    startTheGame,
    selectPack,
    placeItemOnBoard,
    endTheGame,
    resetGame,
    clearError,
  } = useGameRoom();

  // Firebase not configured - show setup instructions
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-stone-900">
              TierClash
            </h1>
            <p className="text-stone-500 font-medium">Holiday Edition</p>
          </div>

          <Card className="border-2 border-amber-500 bg-amber-50 shadow-[4px_4px_0px_0px_rgba(245,158,11,0.5)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-6 h-6" />
                Firebase Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-stone-700">
                To enable multiplayer, you need to configure Firebase. Follow
                these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
                <li>
                  Create a Firebase project at{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    console.firebase.google.com{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Enable <strong>Firestore Database</strong> in your project
                </li>
                <li>Go to Project Settings → General → Your apps</li>
                <li>Add a Web app and copy the config</li>
                <li>
                  Create a{' '}
                  <code className="bg-stone-200 px-1 rounded">.env.local</code>{' '}
                  file with your credentials
                </li>
              </ol>

              <div className="bg-white/50 p-3 rounded-lg border border-amber-200">
                <p className="font-mono text-xs text-stone-600">
                  VITE_FIREBASE_API_KEY=your_key
                  <br />
                  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
                  <br />
                  VITE_FIREBASE_PROJECT_ID=your_project
                  <br />
                  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
                  <br />
                  VITE_FIREBASE_MESSAGING_SENDER_ID=123456
                  <br />
                  VITE_FIREBASE_APP_ID=1:123:web:abc
                </p>
              </div>

              <p className="text-xs text-stone-500">
                After adding your credentials, restart the dev server.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // No room - show room entry
  if (!room) {
    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
          <RoomEntry
            onCreateRoom={createNewRoom}
            onJoinRoom={joinExistingRoom}
            loading={loading}
            error={error}
            clearError={clearError}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // In room - lobby phase
  if (room.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
          <RoomLobby
            room={room}
            currentPlayer={currentPlayer}
            isHost={isHost}
            onStartGame={startTheGame}
            onRemovePlayer={removePlayer}
            onLeaveRoom={leaveCurrentRoom}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Pack selection phase (host selects, others wait)
  if (room.phase === 'PACK_SELECTION') {
    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
          {isHost ? (
            <PackSelection
              onSelect={selectPack}
              playedPackIds={room.playedPackIds || []}
              onBack={async () => {
                await resetGame();
              }}
            />
          ) : (
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto bg-stone-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎴</span>
              </div>
              <p className="text-stone-500 font-medium">
                <span className="font-bold text-stone-900">
                  {room.hostName}
                </span>{' '}
                is selecting a pack...
              </p>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // Game loop phase
  if (room.phase === 'GAME_LOOP' && room.selectedPackId) {
    const pack = PACKS.find(p => p.id === room.selectedPackId);

    // If pack is missing (e.g. invalid ID or code update removed it), show error
    if (!pack) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
          <Card className="max-w-md w-full border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Pack Not Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The selected pack ({room.selectedPackId}) no longer exists.</p>
              <Button
                onClick={() => (isHost ? resetGame() : leaveCurrentRoom())}
                className="w-full"
              >
                {isHost ? 'Return to Lobby' : 'Leave Room'}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
          <GameLoopMultiplayer
            room={room}
            pack={pack}
            currentPlayer={currentPlayer}
            onPlaceItem={placeItemOnBoard}
            onGameEnd={endTheGame}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Result phase
  if (room.phase === 'RESULT' && room.selectedPackId) {
    const pack = PACKS.find(p => p.id === room.selectedPackId);

    if (!pack) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Button onClick={() => (isHost ? resetGame() : leaveCurrentRoom())}>
            Return to Lobby
          </Button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
          <ResultMultiplayer
            room={room}
            pack={pack}
            isHost={isHost}
            onReset={resetGame}
            onLeave={leaveCurrentRoom}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return null;
};

const Footer: React.FC = () => (
  <footer className="w-full text-center py-4 text-xs text-stone-400">
    TierClash Holiday Edition &copy; {new Date().getFullYear()}
  </footer>
);

export default AppMultiplayer;
