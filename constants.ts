import { Pack, PackItem } from './types';

export const TIERS_CONFIG = [
  { id: 'DIAMOND', label: 'Diamond', color: 'bg-cyan-400', text: 'text-white' },
  { id: 'GOLD', label: 'Gold', color: 'bg-yellow-400', text: 'text-black' },
  { id: 'SILVER', label: 'Silver', color: 'bg-slate-300', text: 'text-black' },
  { id: 'BRONZE', label: 'Bronze', color: 'bg-amber-600', text: 'text-white' },
  { id: 'TRASH', label: 'Trash', color: 'bg-stone-700', text: 'text-white' },
] as const;

const generateItems = (
  count: number,
  type: PackItem['type'],
  prefix: string
): PackItem[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${type}-${i}`,
    name: `${prefix} ${type} ${i + 1}`,
    type,
    imageUrl: `https://picsum.photos/seed/${prefix}-${type}-${i}/400/400`,
  }));
};

// Hardcoded fun packs
export const PACKS: Pack[] = [
  {
    id: 'ramen-chaos',
    name: 'Late Night Ramen',
    description: 'The ultimate comfort food gone wrong (or right?).',
    themeColor: 'bg-orange-100',
    items: [
      ...generateItems(5, 'base', 'Noodle'),
      ...generateItems(5, 'topping', 'Egg'),
      ...generateItems(5, 'atmosphere', 'Chili'),
      ...generateItems(5, 'chaos', 'Mystery Sauce'),
    ],
  },
  {
    id: 'coffee-snob',
    name: 'Hipster Coffee',
    description: 'Espresso, plants, and existential dread.',
    themeColor: 'bg-stone-100',
    items: [
      ...generateItems(5, 'base', 'Latte Art'),
      ...generateItems(5, 'topping', 'Pastry'),
      ...generateItems(5, 'atmosphere', 'Laptop'),
      ...generateItems(5, 'chaos', 'Succulent'),
    ],
  },
  {
    id: 'bbq-feast',
    name: 'Backyard BBQ',
    description: 'Grill master vibes only.',
    themeColor: 'bg-red-50',
    items: [
      ...generateItems(5, 'base', 'Steak'),
      ...generateItems(5, 'topping', 'Corn'),
      ...generateItems(5, 'atmosphere', 'Smoke'),
      ...generateItems(5, 'chaos', 'Tongs'),
    ],
  },
];

export const MAX_TURNS = 8; // Increased for Tier List fullness
