# Firebase/Firestore Multiplayer Integration

This project includes real-time multiplayer functionality powered by **Firebase Firestore**.

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" (or select an existing one)
3. Follow the setup wizard

### 2. Enable Firestore

1. In your Firebase project, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** for development (update rules before production!)
4. Select a location closest to your users

### 3. Add a Web App

1. Go to **Project Settings** > **General**
2. Scroll to "Your apps" and click the Web icon (`</>`)
3. Register your app (any nickname works)
4. Copy the configuration values

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Security Rules

Copy the contents of `firestore.rules` to your Firebase Console:

1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with the contents of `firestore.rules`
3. Click **Publish**

## How Multiplayer Works

### Creating a Room

1. Host enters their name and clicks "Create Room"
2. A unique 4-character room code is generated (e.g., `ABCD`)
3. Share this code with friends!

### Joining a Room

1. Other players enter the room code and their name
2. Click "Join Room"
3. They appear in the lobby in real-time!

### Game Flow

1. **Host** starts the game when 2+ players are ready
2. **Host** selects a pack (other players wait)
3. Each turn, a random player becomes the "Judge"
4. Only the Judge can drag and place items
5. Other players watch in real-time
6. After all turns, everyone sees the results!

## File Structure

```
lib/
├── firebase.ts      # Firebase initialization
└── firestore.ts     # Firestore CRUD operations

hooks/
└── useGameRoom.ts   # React hook for room sync

components/
├── RoomEntry.tsx           # Create/Join room UI
├── RoomLobby.tsx           # Multiplayer lobby
├── GameLoopMultiplayer.tsx # Real-time game loop
└── ResultMultiplayer.tsx   # Shared results

AppMultiplayer.tsx   # Main multiplayer app
```

## Key Features

- **Real-time sync**: All players see updates instantly
- **Room codes**: Easy 4-character codes to share
- **Host controls**: Only the host can start games and pick packs
- **Spectator mode**: Non-judges watch the current judge play
- **Persistent sessions**: Refresh the page and rejoin automatically
- **Offline support**: IndexedDB persistence for reliability

## Troubleshooting

### "Room not found"

- Check the room code is correct (case-insensitive)
- The host may have left (which deletes the room)

### "Game has already started"

- You can only join during the lobby phase
- Wait for the current game to finish

### "A player with that name is already in the room"

- Choose a different name
- If it's you, you may already be in the room (check localStorage)

### Firebase quota exceeded

- Firestore has generous free tier limits
- For production, consider upgrading your Firebase plan
