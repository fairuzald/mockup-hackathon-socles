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
  type: PackItem['type'] = 'base',
  imageUrl?: string
): PackItem => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  type,
  imageUrl:
    imageUrl ??
    `https://picsum.photos/seed/${name.replace(/\s+/g, '-')}/400/400`,
});

export const PACKS: Pack[] = [
  {
    id: 'football-leagues',
    name: 'Liga Sepak Bola',
    description: 'Top leagues from around the world. Which one is the GOAT?',
    themeColor: 'bg-blue-100',
    items: [
      createItem(
        'Liga Inggris',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaUL-Sl8QGcchiTOyZ8oT8cGkBGgMdGqswiA&s'
      ),
      createItem(
        'Liga Indonesia',
        'chaos',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_Indonesia.svg/1280px-Flag_of_Indonesia.svg.png'
      ),
      createItem(
        'Liga Italia',
        'base',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Italy.svg/2560px-Flag_of_Italy.svg.png'
      ),
      createItem(
        'Liga Arab',
        'money' as any,
        'https://asset.kompas.com/crops/E85zxtrO11JZ4Ge4bHvNoK8ngdo=/0x0:800x533/1200x800/data/photo/2023/01/26/63d2055c75390.png'
      ), // Cast for fun, will fallback to string
      createItem(
        'Liga Belanda',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT22jhTfN6WuelYr7hvpqwKXJxIAYN1oIkb-A&s'
      ),
      createItem(
        'Liga Jerman',
        'base',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Flag_of_Germany_%28RGB%29.svg/330px-Flag_of_Germany_%28RGB%29.svg.png'
      ),
      createItem(
        'Liga Spanyol',
        'base',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/960px-Flag_of_Spain.svg.png'
      ),
    ],
  },
  {
    id: 'mie-instan',
    name: 'Mie Instan',
    description: 'The holy grail of midnight snacks.',
    themeColor: 'bg-yellow-100',
    items: [
      createItem(
        'Rendang',
        'base',
        'https://image.astronauts.cloud/product-images/2024/4/IndomieGorengRendangMieInstant1_99bf7eaa-2427-418b-8f2f-b86736a34159_900x900.jpeg'
      ),
      createItem(
        'Goreng Biasa',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbiS6PRNoeLYUKX2rump9sR0fzxoqtIP5RKg&s'
      ),
      createItem(
        'Mie Aceh',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmF9IB3zJ6uzgmnorLybebE6rEotXX2XPsLw&s'
      ),
      createItem(
        'Kari Ayam',
        'base',
        'https://c.alfagift.id/product/1/1_A7549750001037_20241104113648149_base.jpg'
      ),
      createItem(
        'Ayam Bawang',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzjDFpty2_lbj4uUZ9vUBr3QI7VJQ0OVLumQ&s'
      ),
      createItem(
        'Soto',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ75wfyxxspQttZDv6_3qNg23RhwGi9JoOo-w&s'
      ),
    ],
  },
  {
    id: 'house-keeping',
    name: 'HouseKeeping',
    description: 'Chores you love to hate.',
    themeColor: 'bg-green-100',
    items: [
      createItem(
        'Mopping',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDTuQVRP3wPpZyA67OhbDvdpYReYZYHoTLeA&s'
      ),
      createItem(
        'Brooming',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQfA-hnG08HipbgmbHstitKtWjG9_wqDD5GQ&s'
      ),
      createItem(
        'Washing Dishes',
        'chaos',
        'https://www.cleaninginstitute.org/sites/default/files/styles/landing_page_wide/public/2019-03/shutterstock_woman-yellow-protective-rubber-gloves-washing-414078580.jpg?itok=yJ3Ngp0i'
      ),
      createItem(
        'Laundry',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSco5A8iscduSh-oEqcVyQ9JmFD2Y4fysPMtw&s'
      ),
      createItem(
        'Taking out Trash',
        'base',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRG_Vtr4Vmka0Cmcfrl97AV2nSJzrJq_QH-OA&s'
      ),
    ],
  },
];

export const MAX_TURNS = 12; // Increased to allow more items to be placed
