import { Car, Moon, Users, ShoppingBag, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface JourneyMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tier: string;
}

const journeyModes: JourneyMode[] = [
  {
    id: 'budget',
    name: 'Budget',
    description: 'Most affordable option',
    icon: <Car className="h-6 w-6" />,
    tier: 'budget',
  },
  {
    id: 'night_out',
    name: 'Night Out',
    description: 'Top-rated drivers for safe nights',
    icon: <Moon className="h-6 w-6" />,
    tier: 'enhanced',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Extra space for everyone',
    icon: <Users className="h-6 w-6" />,
    tier: 'enhanced',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    description: 'Room for all your bags',
    icon: <ShoppingBag className="h-6 w-6" />,
    tier: 'budget',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional & punctual',
    icon: <Briefcase className="h-6 w-6" />,
    tier: 'premium',
  },
];

interface JourneyModeSelectorProps {
  selected: string;
  onSelect: (mode: string, tier: string) => void;
}

export function JourneyModeSelector({ selected, onSelect }: JourneyModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {journeyModes.map((mode) => (
        <Card
          key={mode.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
            selected === mode.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => onSelect(mode.id, mode.tier)}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`${selected === mode.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {mode.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{mode.name}</h3>
              <p className="text-xs text-muted-foreground">{mode.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
