import React, { useState, useEffect } from 'react';
import { GameState, Player, LOCAL_STORAGE_KEY } from './types';
import { PACKS } from './constants';
import Lobby from './components/Lobby';
import PackSelection from './components/PackSelection';
import GameLoop from './components/GameLoop';
import Result from './components/Result';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse game state", e);
      }
    }
    return {
      phase: 'LOBBY',
      players: [],
      selectedPackId: null,
      composition: [],
      currentTurnIndex: 0,
      seed: Date.now(),
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      avatarSeed: Math.floor(Math.random() * 1000),
    };
    setGameState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
  };

  const removePlayer = (id: string) => {
    setGameState(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
  };

  const startGame = () => {
    setGameState(prev => ({ ...prev, phase: 'PACK_SELECTION' }));
  };

  const selectPack = (packId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedPackId: packId,
      phase: 'GAME_LOOP',
      currentTurnIndex: 0,
      composition: [],
      seed: Date.now(), // New seed for new game
    }));
  };

  const handleGameEnd = (finalComposition: any) => {
    setGameState(prev => ({
      ...prev,
      composition: finalComposition,
      phase: 'RESULT'
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'LOBBY',
      selectedPackId: null,
      composition: [],
      currentTurnIndex: 0,
    }));
  };

  const backToLobby = () => {
      setGameState(prev => ({ ...prev, phase: 'LOBBY' }));
  }

  return (
    <div className="min-h-screen bg-background text-primary p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl flex-1 flex flex-col justify-center">
        {gameState.phase === 'LOBBY' && (
          <Lobby
            players={gameState.players}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onStart={startGame}
          />
        )}

        {gameState.phase === 'PACK_SELECTION' && (
          <PackSelection onSelect={selectPack} onBack={backToLobby} />
        )}

        {gameState.phase === 'GAME_LOOP' && gameState.selectedPackId && (
          <GameLoop
            gameState={gameState}
            pack={PACKS.find(p => p.id === gameState.selectedPackId)!}
            setGameState={setGameState}
            onGameEnd={handleGameEnd}
          />
        )}

        {gameState.phase === 'RESULT' && gameState.selectedPackId && (
          <Result
            gameState={gameState}
            pack={PACKS.find(p => p.id === gameState.selectedPackId)!}
            onReset={resetGame}
          />
        )}
      </div>
      
      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-stone-400">
        VibeCheck Chaos Edition &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;