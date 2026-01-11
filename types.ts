export type GamePhase = 'LOBBY' | 'PACK_SELECTION' | 'GAME_LOOP' | 'RESULT';

export interface Player {
  id: string;
  name: string;
  avatarSeed: number;
}

export interface PackItem {
  id: string;
  name: string;
  type: 'base' | 'topping' | 'atmosphere' | 'drink' | 'chaos';
  imageUrl: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  items: PackItem[];
  themeColor: string;
}

export type Tier = 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH';

export interface AttachedItem extends PackItem {
  attachedBy: string; // player id
  tier: Tier;
  rotation: number;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  selectedPackId: string | null;
  composition: AttachedItem[];
  currentTurnIndex: number; // How many items have been placed
  seed: number; // For RNG consistency
}

export type TurnPhase =
  | 'ANNOUNCE_LEADER'
  | 'REVEAL_CARD'
  | 'ATTACHING'
  | 'ATTACHED';

export const LOCAL_STORAGE_KEY = 'TierClash_game_state_v2';
