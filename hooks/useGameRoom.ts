import { useCallback, useEffect, useState } from 'react';
import {
  GameRoom,
  createRoom,
  endGame,
  isFirebaseConfigured,
  joinRoom,
  leaveRoom,
  placeItem,
  removePlayerFromRoom,
  resetGameToLobby,
  selectPackForRoom,
  startGame,
  subscribeToRoom,
} from '../lib/firestore';
import { AttachedItem, Player } from '../types';

interface UseGameRoomReturn {
  room: GameRoom | null;
  loading: boolean;
  error: string | null;
  isHost: boolean;
  currentPlayer: Player | null;
  isConfigured: boolean;

  // Actions
  createNewRoom: (playerName: string) => Promise<string | null>;
  joinExistingRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveCurrentRoom: () => Promise<void>;
  removePlayer: (player: Player) => Promise<void>;
  startTheGame: () => Promise<void>;
  selectPack: (packId: string) => Promise<void>;
  placeItemOnBoard: (item: AttachedItem, newTurnIndex: number) => Promise<void>;
  endTheGame: (finalComposition: AttachedItem[]) => Promise<void>;
  resetGame: () => Promise<void>;
  clearError: () => void;
}

const PLAYER_ID_KEY = 'TierClash_player_id';
const ROOM_CODE_KEY = 'TierClash_room_code';

export const useGameRoom = (): UseGameRoomReturn => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(PLAYER_ID_KEY);
  });
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return localStorage.getItem(ROOM_CODE_KEY);
  });

  // Subscribe to room updates
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      return;
    }

    const unsubscribe = subscribeToRoom(roomCode, updatedRoom => {
      if (updatedRoom) {
        setRoom(updatedRoom);

        // Check if current player was removed
        if (
          currentPlayerId &&
          !updatedRoom.players.some(p => p.id === currentPlayerId)
        ) {
          // Player was removed or room was deleted
          localStorage.removeItem(ROOM_CODE_KEY);
          setRoomCode(null);
          setRoom(null);
          setError('You were removed from the room');
        }
      } else {
        // Room no longer exists
        localStorage.removeItem(ROOM_CODE_KEY);
        setRoomCode(null);
        setRoom(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentPlayerId]);

  const isHost = room?.hostId === currentPlayerId;
  const currentPlayer =
    room?.players.find(p => p.id === currentPlayerId) || null;

  const createNewRoom = useCallback(
    async (playerName: string): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const player: Player = {
          id: crypto.randomUUID(),
          name: playerName.trim(),
          avatarSeed: Math.floor(Math.random() * 1000),
        };

        const newRoomCode = await createRoom(player);

        // Store player ID and room code
        localStorage.setItem(PLAYER_ID_KEY, player.id);
        localStorage.setItem(ROOM_CODE_KEY, newRoomCode);

        setCurrentPlayerId(player.id);
        setRoomCode(newRoomCode);

        return newRoomCode;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create room');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const joinExistingRoom = useCallback(
    async (code: string, playerName: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const player: Player = {
          id: crypto.randomUUID(),
          name: playerName.trim(),
          avatarSeed: Math.floor(Math.random() * 1000),
        };

        const joinedRoom = await joinRoom(code, player);

        if (!joinedRoom) {
          setError('Room not found. Check the code and try again.');
          return false;
        }

        // Store player ID and room code
        localStorage.setItem(PLAYER_ID_KEY, player.id);
        localStorage.setItem(ROOM_CODE_KEY, code.toUpperCase());

        setCurrentPlayerId(player.id);
        setRoomCode(code.toUpperCase());

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join room');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const leaveCurrentRoom = useCallback(async (): Promise<void> => {
    if (!roomCode || !currentPlayerId) return;

    try {
      await leaveRoom(roomCode, currentPlayerId);

      localStorage.removeItem(ROOM_CODE_KEY);
      setRoomCode(null);
      setRoom(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [roomCode, currentPlayerId]);

  const removePlayer = useCallback(
    async (player: Player): Promise<void> => {
      if (!roomCode || !isHost) return;

      try {
        await removePlayerFromRoom(roomCode, player);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove player'
        );
      }
    },
    [roomCode, isHost]
  );

  const startTheGame = useCallback(async (): Promise<void> => {
    if (!roomCode || !isHost) return;

    try {
      await startGame(roomCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  }, [roomCode, isHost]);

  const selectPack = useCallback(
    async (packId: string): Promise<void> => {
      if (!roomCode || !isHost) return;

      if (room?.playedPackIds?.includes(packId)) {
        setError('This pack has already been played!');
        return;
      }

      try {
        await selectPackForRoom(roomCode, packId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to select pack');
      }
    },
    [roomCode, isHost, room]
  );

  const placeItemOnBoard = useCallback(
    async (item: AttachedItem, newTurnIndex: number): Promise<void> => {
      if (!roomCode) return;

      try {
        await placeItem(roomCode, item, newTurnIndex);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to place item');
      }
    },
    [roomCode]
  );

  const endTheGame = useCallback(
    async (finalComposition: AttachedItem[]): Promise<void> => {
      if (!roomCode) return;

      try {
        await endGame(roomCode, finalComposition);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to end game');
      }
    },
    [roomCode]
  );

  const resetGame = useCallback(async (): Promise<void> => {
    if (!roomCode || !isHost) return;

    try {
      await resetGameToLobby(roomCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    }
  }, [roomCode, isHost]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    room,
    loading,
    error,
    isHost,
    currentPlayer,
    isConfigured: isFirebaseConfigured(),
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
  };
};
