import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Platform configuration interface
export interface PlatformConfig {
  // Food Delivery Service
  food: {
    platformCommissionRate: number; // Default restaurant commission %
    serviceFeeRate: number; // Customer service fee %
    deliveryBaseFee: number; // Base delivery fee (R)
    deliveryPerKmFee: number; // Per km delivery fee (R)
    minimumOrderDefault: number; // Default minimum order (R)
    taxRate: number; // VAT rate %
    deliveryPartnerRate: number; // Delivery partner earning rate %
    deliveryPartnerPlatformFee: number; // Platform fee from delivery partners %
  };

  // Hotel Booking Service
  hotels: {
    platformCommissionRate: number; // Commission on hotel bookings %
    serviceFeeFlat: number; // Flat service fee (R)
    vatRate: number; // VAT rate %
    cancellationPeriodHours: number; // Free cancellation period
    instantBookingEnabled: boolean;
  };

  // Venue & Experience Service
  venues: {
    platformCommissionRate: number; // Commission on venue bookings %
    experienceCommissionRate: number; // Commission on experiences %
    serviceFeeRate: number; // Service fee %
    privateBookingMultiplier: number; // Multiplier for private bookings
  };

  // Rides Service
  rides: {
    budgetBaseFare: number; // Budget tier base fare (R)
    budgetPerKmRate: number; // Budget per km (R)
    enhancedBaseFare: number; // Enhanced tier base fare (R)
    enhancedPerKmRate: number; // Enhanced per km (R)
    premiumBaseFare: number; // Premium tier base fare (R)
    premiumPerKmRate: number; // Premium per km (R)
    luxuryBaseFare: number; // Luxury tier base fare (R)
    luxuryPerKmRate: number; // Luxury per km (R)
    platformCommissionRate: number; // Platform commission %
    surgePricingEnabled: boolean;
    surgePricingMultiplier: number;
  };

  // Loyalty Program
  loyalty: {
    pointsPerRand: number; // Points earned per R1 spent
    pointValueInRand: number; // Value of 1 point in R
    bronzeThreshold: number; // Points to reach Bronze
    silverThreshold: number; // Points to reach Silver
    goldThreshold: number; // Points to reach Gold
    platinumThreshold: number; // Points to reach Platinum
    bronzeMultiplier: number; // Bronze points multiplier
    silverMultiplier: number; // Silver points multiplier
    goldMultiplier: number; // Gold points multiplier
    platinumMultiplier: number; // Platinum points multiplier
  };

  // Payment Settings
  payments: {
    payfastMerchantId: string;
    payfastMerchantKey: string;
    payfastPassphrase: string;
    sandboxMode: boolean;
    walletEnabled: boolean;
    maxWalletBalance: number;
  };

  // Platform Settings
  platform: {
    maintenanceMode: boolean;
    newRegistrationsEnabled: boolean;
    provinces: string[]; // Active provinces
    supportEmail: string;
    supportPhone: string;
    emergencyNumbers: {
      saps: string;
      ambulance: string;
      universal: string;
    };
  };
}

// Default configuration
const DEFAULT_CONFIG: PlatformConfig = {
  food: {
    platformCommissionRate: 15,
    serviceFeeRate: 4.5,
    deliveryBaseFee: 25,
    deliveryPerKmFee: 5,
    minimumOrderDefault: 50,
    taxRate: 15,
    deliveryPartnerRate: 85,
    deliveryPartnerPlatformFee: 15,
  },
  hotels: {
    platformCommissionRate: 12,
    serviceFeeFlat: 50,
    vatRate: 15,
    cancellationPeriodHours: 24,
    instantBookingEnabled: true,
  },
  venues: {
    platformCommissionRate: 10,
    experienceCommissionRate: 15,
    serviceFeeRate: 5,
    privateBookingMultiplier: 1.5,
  },
  rides: {
    budgetBaseFare: 15,
    budgetPerKmRate: 8.5,
    enhancedBaseFare: 20,
    enhancedPerKmRate: 10,
    premiumBaseFare: 30,
    premiumPerKmRate: 12.5,
    luxuryBaseFare: 50,
    luxuryPerKmRate: 18,
    platformCommissionRate: 20,
    surgePricingEnabled: false,
    surgePricingMultiplier: 1.5,
  },
  loyalty: {
    pointsPerRand: 0.1,
    pointValueInRand: 0.1,
    bronzeThreshold: 0,
    silverThreshold: 1000,
    goldThreshold: 5000,
    platinumThreshold: 10000,
    bronzeMultiplier: 1,
    silverMultiplier: 1.25,
    goldMultiplier: 1.5,
    platinumMultiplier: 2,
  },
  payments: {
    payfastMerchantId: '',
    payfastMerchantKey: '',
    payfastPassphrase: '',
    sandboxMode: true,
    walletEnabled: true,
    maxWalletBalance: 10000,
  },
  platform: {
    maintenanceMode: false,
    newRegistrationsEnabled: true,
    provinces: [
      'Gauteng',
      'Western Cape',
      'KwaZulu-Natal',
      'Eastern Cape',
      'Free State',
      'Limpopo',
      'Mpumalanga',
      'Northern Cape',
      'North West',
    ],
    supportEmail: 'support@smashlocal.co.za',
    supportPhone: '0800 123 456',
    emergencyNumbers: {
      saps: '10111',
      ambulance: '10177',
      universal: '112',
    },
  },
};

const CONFIG_KEY = 'smash-local-platform-config';

// Load config from localStorage
const loadConfig = (): PlatformConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any new fields
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        food: { ...DEFAULT_CONFIG.food, ...parsed.food },
        hotels: { ...DEFAULT_CONFIG.hotels, ...parsed.hotels },
        venues: { ...DEFAULT_CONFIG.venues, ...parsed.venues },
        rides: { ...DEFAULT_CONFIG.rides, ...parsed.rides },
        loyalty: { ...DEFAULT_CONFIG.loyalty, ...parsed.loyalty },
        payments: { ...DEFAULT_CONFIG.payments, ...parsed.payments },
        platform: { ...DEFAULT_CONFIG.platform, ...parsed.platform },
      };
    }
  } catch (error) {
    console.error('Failed to load platform config:', error);
  }
  return DEFAULT_CONFIG;
};

// Save config to localStorage
const saveConfig = (config: PlatformConfig): void => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save platform config:', error);
    throw error;
  }
};

export function usePlatformConfig() {
  const queryClient = useQueryClient();

  // Load config
  const { data: config, isLoading } = useQuery({
    queryKey: ['platform-config'],
    queryFn: loadConfig,
    staleTime: Infinity, // Config doesn't change unless we update it
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<PlatformConfig>) => {
      const current = loadConfig();
      const newConfig = {
        ...current,
        ...updates,
        food: { ...current.food, ...(updates.food || {}) },
        hotels: { ...current.hotels, ...(updates.hotels || {}) },
        venues: { ...current.venues, ...(updates.venues || {}) },
        rides: { ...current.rides, ...(updates.rides || {}) },
        loyalty: { ...current.loyalty, ...(updates.loyalty || {}) },
        payments: { ...current.payments, ...(updates.payments || {}) },
        platform: { ...current.platform, ...(updates.platform || {}) },
      };
      saveConfig(newConfig);
      return newConfig;
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['platform-config'], newConfig);
      toast.success('Configuration saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save configuration');
      console.error(error);
    },
  });

  // Reset to defaults
  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    },
    onSuccess: (defaultConfig) => {
      queryClient.setQueryData(['platform-config'], defaultConfig);
      toast.success('Configuration reset to defaults');
    },
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    updateConfig: updateConfigMutation.mutate,
    resetConfig: resetConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
    DEFAULT_CONFIG,
  };
}

// Utility hook to get specific service config
export function useFoodConfig() {
  const { config } = usePlatformConfig();
  return config.food;
}

export function useHotelConfig() {
  const { config } = usePlatformConfig();
  return config.hotels;
}

export function useVenueConfig() {
  const { config } = usePlatformConfig();
  return config.venues;
}

export function useRidesConfig() {
  const { config } = usePlatformConfig();
  return config.rides;
}

export function useLoyaltyConfig() {
  const { config } = usePlatformConfig();
  return config.loyalty;
}

export function usePaymentConfig() {
  const { config } = usePlatformConfig();
  return config.payments;
}

export function usePlatformSettings() {
  const { config } = usePlatformConfig();
  return config.platform;
}
