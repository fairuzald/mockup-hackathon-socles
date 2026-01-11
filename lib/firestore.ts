import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { AttachedItem, GamePhase, Player } from '../types';
import { db, isFirebaseConfigured } from './firebase';

// Re-export for convenience
export { isFirebaseConfigured };

// Collection name
const ROOMS_COLLECTION = 'gameRooms';

// Helper to check if db is available
const ensureDb = () => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Please add your Firebase credentials to .env.local'
    );
  }
  return db;
};

// Room document interface
export interface GameRoom {
  id: string;
  hostId: string;
  hostName: string;
  players: Player[];
  phase: GamePhase;
  selectedPackId: string | null;
  composition: AttachedItem[];
  currentTurnIndex: number;
  seed: number;
  playedPackIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Generate a short, memorable room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new game room
export const createRoom = async (host: Player): Promise<string> => {
  const roomCode = generateRoomCode();
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode);

  // Check if room code already exists (rare but possible)
  const existingRoom = await getDoc(roomRef);
  if (existingRoom.exists()) {
    // Recursive retry with new code
    return createRoom(host);
  }

  const roomData: Omit<GameRoom, 'createdAt' | 'updatedAt'> & {
    createdAt: any;
    updatedAt: any;
  } = {
    id: roomCode,
    hostId: host.id,
    hostName: host.name,
    players: [host],
    phase: 'LOBBY',
    selectedPackId: null,
    composition: [],
    currentTurnIndex: 0,

    seed: Date.now(),
    playedPackIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(roomRef, roomData);
  return roomCode;
};

// Join an existing room
export const joinRoom = async (
  roomCode: string,
  player: Player
): Promise<GameRoom | null> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    return null;
  }

  const room = roomSnap.data() as GameRoom;

  // Check if player with same name exists
  if (
    room.players.some(p => p.name.toLowerCase() === player.name.toLowerCase())
  ) {
    throw new Error('A player with that name is already in the room');
  }

  // Check max players
  if (room.players.length >= 6) {
    throw new Error('Room is full (max 6 players)');
  }

  // Allow joining at any phase - new players can spectate mid-game
  // They'll get a turn in the next round

  await updateDoc(roomRef, {
    players: arrayUnion(player),
    updatedAt: serverTimestamp(),
  });

  return { ...room, players: [...room.players, player] };
};

// Leave a room
export const leaveRoom = async (
  roomCode: string,
  playerId: string
): Promise<void> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return;

  const room = roomSnap.data() as GameRoom;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return;

  // If host leaves, delete the room
  if (room.hostId === playerId) {
    await deleteDoc(roomRef);
  } else {
    await updateDoc(roomRef, {
      players: arrayRemove(player),
      updatedAt: serverTimestamp(),
    });
  }
};

// Update game state
export const updateRoomState = async (
  roomCode: string,
  updates: Partial<
    Pick<
      GameRoom,
      | 'phase'
      | 'selectedPackId'
      | 'composition'
      | 'currentTurnIndex'
      | 'seed'
      | 'playedPackIds'
    >
  >
): Promise<void> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  await updateDoc(roomRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to room updates (real-time listener)
export const subscribeToRoom = (
  roomCode: string,
  callback: (room: GameRoom | null) => void
): Unsubscribe => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());

  return onSnapshot(
    roomRef,
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as GameRoom);
      } else {
        callback(null);
      }
    },
    error => {
      console.error('Room subscription error:', error);
      callback(null);
    }
  );
};

// Check if room exists
export const checkRoomExists = async (roomCode: string): Promise<boolean> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  const roomSnap = await getDoc(roomRef);
  return roomSnap.exists();
};

// Remove a player (host only)
export const removePlayerFromRoom = async (
  roomCode: string,
  player: Player
): Promise<void> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  await updateDoc(roomRef, {
    players: arrayRemove(player),
    updatedAt: serverTimestamp(),
  });
};

// Start the game (host only)
export const startGame = async (roomCode: string): Promise<void> => {
  await updateRoomState(roomCode, { phase: 'PACK_SELECTION' });
};

// Select pack and start game loop
export const selectPackForRoom = async (
  roomCode: string,
  packId: string
): Promise<void> => {
  await updateRoomState(roomCode, {
    selectedPackId: packId,
    phase: 'GAME_LOOP',
    currentTurnIndex: 0,
    composition: [],
    seed: Date.now(),
  });
};

// Place an item (during game loop)
export const placeItem = async (
  roomCode: string,
  item: AttachedItem,
  newTurnIndex: number
): Promise<void> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return;

  const room = roomSnap.data() as GameRoom;

  await updateDoc(roomRef, {
    composition: [...room.composition, item],
    currentTurnIndex: newTurnIndex,
    updatedAt: serverTimestamp(),
  });
};

// End game and show results
export const endGame = async (
  roomCode: string,
  finalComposition: AttachedItem[]
): Promise<void> => {
  await updateRoomState(roomCode, {
    composition: finalComposition,
    phase: 'RESULT',
  });

  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  // Add the current pack to the history of played packs
  const roomSnap = await getDoc(roomRef);
  if (roomSnap.exists()) {
    const data = roomSnap.data() as GameRoom;
    if (data.selectedPackId) {
      await updateDoc(roomRef, {
        playedPackIds: arrayUnion(data.selectedPackId),
      });
    }
  }
};

// Reset game to lobby
export const resetGameToLobby = async (roomCode: string): Promise<void> => {
  await updateRoomState(roomCode, {
    phase: 'LOBBY',
    selectedPackId: null,
    composition: [],
    currentTurnIndex: 0,
  });
};

// Delete a room completely (host only)
export const deleteRoom = async (roomCode: string): Promise<void> => {
  const roomRef = doc(ensureDb(), ROOMS_COLLECTION, roomCode.toUpperCase());
  await deleteDoc(roomRef);
};
