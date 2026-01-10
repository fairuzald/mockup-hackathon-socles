import { Pack, PackItem } from './types';

export const TIERS_CONFIG = [
  { id: 'DIAMOND', label: 'Diamond', color: 'bg-cyan-400', text: 'text-white' },
  { id: 'GOLD', label: 'Gold', color: 'bg-yellow-400', text: 'text-black' },
  { id: 'SILVER', label: 'Silver', color: 'bg-slate-300', text: 'text-black' },
  { id: 'BRONZE', label: 'Bronze', color: 'bg-amber-600', text: 'text-white' },
  { id: 'TRASH', label: 'Trash', color: 'bg-stone-700', text: 'text-white' },
] as const;

// Helper to create specific items
const createItem = (
  name: string,
  type: PackItem['type'] = 'base'
): PackItem => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  type,
  imageUrl: `https://picsum.photos/seed/${name.replace(/\s+/g, '-')}/400/400`,
});

export const PACKS: Pack[] = [
  {
    id: 'football-leagues',
    name: 'Liga Sepak Bola',
    description: 'Top leagues from around the world. Which one is the GOAT?',
    themeColor: 'bg-blue-100',
    items: [
      createItem('Liga Inggris', 'base'),
      createItem('Liga Indonesia', 'chaos'),
      createItem('Liga Italia', 'base'),
      createItem('Liga Arab', 'money' as any), // Cast for fun, will fallback to string
      createItem('Liga Belanda', 'base'),
      createItem('Liga Jerman', 'base'),
      createItem('Liga Spanyol', 'base'),
    ],
  },
  {
    id: 'mie-instan',
    name: 'Mie Instan',
    description: 'The holy grail of midnight snacks.',
    themeColor: 'bg-yellow-100',
    items: [
      createItem('Rendang', 'base'),
      createItem('Goreng Biasa', 'base'),
      createItem('Mie Aceh', 'base'),
      createItem('Kari Ayam', 'base'),
      createItem('Ayam Bawang', 'base'),
      createItem('Soto', 'base'),
    ],
  },
  {
    id: 'house-activity',
    name: 'House Activity',
    description: 'Chores you love to hate.',
    themeColor: 'bg-green-100',
    items: [
      createItem('Moping', 'base'),
      createItem('Brooming', 'base'),
      createItem('Washing Dishes', 'chaos'),
      createItem('Laundry', 'base'),
      createItem('Taking out Trash', 'base'),
      createItem('Cleaning Windows', 'base'),
      createItem('Vacuuming', 'base'),
    ],
  },
];

export const MAX_TURNS = 12; // Increased to allow more items to be placed
