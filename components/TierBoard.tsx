import { Gem, GripVertical, Medal, Trash2, Trophy } from 'lucide-react';
import React from 'react';
import { TIERS_CONFIG } from '../constants';
import { cn } from '../lib/utils';
import { AttachedItem, PackItem, Player, Tier } from '../types';

interface TierBoardProps {
  items: AttachedItem[];
  players: Player[];
  className?: string;
  isDragging?: boolean;
  tentativePlacement?: { item: PackItem; tier: Tier } | null;
  onPickupTentative?: (e: React.PointerEvent) => void;
}

const TierBoard: React.FC<TierBoardProps> = ({
  items,
  players,
  className,
  isDragging,
  tentativePlacement,
  onPickupTentative,
}) => {
  const getTierIcon = (id: string) => {
    switch (id) {
      case 'DIAMOND':
        return <Gem className="w-5 h-5 md:w-8 md:h-8" />;
      case 'GOLD':
        return <Trophy className="w-5 h-5 md:w-8 md:h-8" />;
      case 'SILVER':
        return <Medal className="w-5 h-5 md:w-8 md:h-8" />;
      case 'BRONZE':
        return <Medal className="w-5 h-5 md:w-8 md:h-8 opacity-75" />; // Reusing Medal, maybe style differently
      case 'TRASH':
        return <Trash2 className="w-5 h-5 md:w-8 md:h-8" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'w-full bg-[#1c1c1c] border-2 border-stone-900 rounded-lg overflow-hidden shadow-2xl transition-all duration-300',
        className
      )}
    >
      {TIERS_CONFIG.map(tierConfig => {
        const tierItems = items.filter(item => item.tier === tierConfig.id);
        const isTentativeRow = tentativePlacement?.tier === tierConfig.id;

        return (
          <div
            key={tierConfig.id}
            data-tier-id={tierConfig.id}
            className={cn(
              'flex min-h-[70px] md:min-h-[110px] border-b last:border-b-0 border-[#2a2a2a] transition-all duration-300 ease-out',
              // highlight all tiers as potential drop targets when dragging
              isDragging &&
                'hover:bg-white/5 ring-inset ring-2 ring-transparent hover:ring-white/10'
            )}
          >
            {/* Label/Icon Column */}
            <div
              className={cn(
                'w-12 md:w-24 flex flex-col items-center justify-center shrink-0 p-1 md:p-2 z-10 border-r border-[#2a2a2a] gap-1',
                tierConfig.color
              )}
            >
              <div className={cn('drop-shadow-md', tierConfig.text)}>
                {getTierIcon(tierConfig.id)}
              </div>
              <span
                className={cn(
                  'text-[10px] md:text-xs font-bold uppercase tracking-wider hidden md:block',
                  tierConfig.text
                )}
              >
                {tierConfig.label}
              </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-wrap items-center gap-1.5 md:gap-3 py-1.5 pr-1.5 pl-0.5 md:py-3 md:pr-3 md:pl-1 relative min-h-[70px] md:min-h-[110px] content-center">
              {/* Tentative Item (The one currently being placed) */}
              {isTentativeRow && tentativePlacement && (
                <div
                  className="relative w-14 h-14 md:w-24 md:h-24 bg-white rounded-md overflow-hidden border-2 border-stone-900 shadow-[0_0_15px_rgba(255,255,255,0.6)] z-30 cursor-grab active:cursor-grabbing animate-pop-in"
                  onPointerDown={onPickupTentative}
                >
                  <img
                    src={tentativePlacement.item.imageUrl}
                    alt={tentativePlacement.item.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/0 transition-colors">
                    <GripVertical className="text-white drop-shadow-md w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              )}

              {/* Committed Items */}
              {tierItems.map(item => {
                const player = players.find(p => p.id === item.attachedBy);
                return (
                  <div
                    key={item.id + item.attachedBy}
                    className="relative w-14 h-14 md:w-24 md:h-24 bg-white rounded-md overflow-visible border-2 border-stone-900 shadow-sm z-0 hover:z-20 group transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-110 hover:rotate-3"
                    style={{
                      transform: `rotate(${item.rotation}deg)`,
                    }}
                  >
                    <div className="w-full h-full overflow-hidden rounded-[4px]">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Player Badge */}
                    {player && (
                      <div
                        className="absolute -bottom-1.5 -right-1.5 md:-bottom-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-[8px] md:text-[10px] font-bold border border-white shadow-md z-10 transition-transform duration-300 group-hover:scale-110"
                        title={player.name}
                      >
                        {player.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}

              {isDragging && (
                <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TierBoard;
