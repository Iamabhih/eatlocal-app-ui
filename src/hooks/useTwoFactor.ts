import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TwoFactorStatus {
  id: string;
  user_id: string;
  is_enabled: boolean;
  secret?: string;
  backup_codes?: string[];
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Generate a simple TOTP secret (in production, use a proper TOTP library)
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Generate backup codes
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Simple TOTP verification (in production, use a proper TOTP library like otplib)
function verifyTOTP(secret: string, token: string): boolean {
  // This is a simplified verification for demo purposes
  // In production, use a proper TOTP library
  const timeStep = 30; // 30 seconds
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);

  // Check current and adjacent time windows
  for (let i = -1; i <= 1; i++) {
    const time = currentTime + i;
    const hmac = simpleHMAC(secret, time.toString());
    const expectedToken = hmac.substring(0, 6);
    if (token === expectedToken) {
      return true;
    }
  }
  return false;
}

// Simple HMAC for demo (in production, use crypto-js or Web Crypto API)
function simpleHMAC(secret: string, message: string): string {
  let hash = 0;
  const combined = secret + message;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(6, '0');
}

// Hook to get 2FA status
export function useTwoFactorStatus() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['two-factor-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('id, user_id, is_enabled, verified_at, created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No 2FA configured
        }
        throw error;
      }

      return data as Omit<TwoFactorStatus, 'secret' | 'backup_codes'>;
    },
    enabled: !!user && (role === 'admin' || role === 'superadmin'),
  });
}

// Hook to setup 2FA
export function useSetupTwoFactor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const secret = generateTOTPSecret();
      const backupCodes = generateBackupCodes();

      // Check if 2FA already exists
      const { data: existing } = await supabase
        .from('two_factor_auth')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('two_factor_auth')
          .update({
            secret,
            backup_codes: backupCodes,
            is_enabled: false,
            verified_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('two_factor_auth')
          .insert({
            user_id: user.id,
            secret,
            backup_codes: backupCodes,
            is_enabled: false,
          });

        if (error) throw error;
      }

      // Return data for QR code generation
      const otpauthUrl = `otpauth://totp/EatLocal:${user.email}?secret=${secret}&issuer=EatLocal`;

      return {
        secret,
        backupCodes,
        otpauthUrl,
      };
    },
    onError: (error: Error) => {
      toast({
        title: '2FA Setup Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to verify and enable 2FA
export function useVerifyTwoFactor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the secret
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify the token
      const isValid = verifyTOTP(twoFactor.secret, token);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          is_enabled: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to disable 2FA
export function useDisableTwoFactor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the secret
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret, backup_codes')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify the token or backup code
      const isValidToken = verifyTOTP(twoFactor.secret, token);
      const isValidBackupCode = twoFactor.backup_codes?.includes(token.toUpperCase());

      if (!isValidToken && !isValidBackupCode) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          is_enabled: false,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disable Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook for login verification
export function useLoginTwoFactorVerification() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      token,
    }: {
      userId: string;
      token: string;
    }) => {
      // Get the secret
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret, backup_codes, is_enabled')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (!twoFactor.is_enabled) {
        return { verified: true, skipped: true };
      }

      // Verify the token or backup code
      const isValidToken = verifyTOTP(twoFactor.secret, token);
      const isValidBackupCode = twoFactor.backup_codes?.includes(token.toUpperCase());

      if (!isValidToken && !isValidBackupCode) {
        throw new Error('Invalid verification code');
      }

      // If backup code was used, remove it from the list
      if (isValidBackupCode) {
        const updatedCodes = twoFactor.backup_codes.filter(
          (code: string) => code !== token.toUpperCase()
        );
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', userId);
      }

      return { verified: true, skipped: false };
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Check if user requires 2FA verification
export async function checkTwoFactorRequired(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('two_factor_auth')
    .select('is_enabled')
    .eq('user_id', userId)
    .single();

  return data?.is_enabled ?? false;
}
