import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  generateSecret,
  generateBackupCodes,
  verifyTOTP,
  generateOtpauthUrl,
  isValidTokenFormat,
  isValidBackupCode,
} from '@/lib/totp';

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

// Hook to get 2FA status
export function useTwoFactorStatus() {
  const { user, isAdmin, isSuperAdmin } = useAuth();

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
    // Only enable for admin/superadmin users
    enabled: !!user && (isAdmin() || isSuperAdmin()),
  });
}

// Hook to setup 2FA
export function useSetupTwoFactor() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Generate cryptographically secure secret and backup codes
      const secret = generateSecret(20);
      const backupCodes = generateBackupCodes(10);

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

      // Generate proper OTPAuth URL for QR code
      const otpauthUrl = generateOtpauthUrl('EatLocal', user.email || '', secret);

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

      // Validate token format
      if (!isValidTokenFormat(token)) {
        throw new Error('Invalid code format. Please enter 6 digits.');
      }

      // Get the secret
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify the token using RFC 6238 TOTP
      const isValid = await verifyTOTP(twoFactor.secret, token);
      if (!isValid) {
        throw new Error('Invalid verification code. Please try again.');
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

      // Get the secret and backup codes
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret, backup_codes')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify the token (either TOTP or backup code)
      let isValid = false;
      let usedBackupCode = false;

      // Check if it's a TOTP token (6 digits)
      if (isValidTokenFormat(token)) {
        isValid = await verifyTOTP(twoFactor.secret, token);
      }

      // Check if it's a backup code
      if (!isValid && isValidBackupCode(token)) {
        const normalizedToken = token.toUpperCase();
        usedBackupCode = twoFactor.backup_codes?.includes(normalizedToken) ?? false;
        isValid = usedBackupCode;
      }

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // If backup code was used, remove it from the list
      if (usedBackupCode) {
        const updatedCodes = twoFactor.backup_codes.filter(
          (code: string) => code !== token.toUpperCase()
        );
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', user.id);
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
      // Get the secret and backup codes
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret, backup_codes, is_enabled')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (!twoFactor.is_enabled) {
        return { verified: true, skipped: true };
      }

      // Verify the token (either TOTP or backup code)
      let isValid = false;
      let usedBackupCode = false;

      // Check if it's a TOTP token (6 digits)
      if (isValidTokenFormat(token)) {
        isValid = await verifyTOTP(twoFactor.secret, token);
      }

      // Check if it's a backup code
      if (!isValid && isValidBackupCode(token)) {
        const normalizedToken = token.toUpperCase();
        usedBackupCode = twoFactor.backup_codes?.includes(normalizedToken) ?? false;
        isValid = usedBackupCode;
      }

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // If backup code was used, remove it from the list
      if (usedBackupCode) {
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

// Hook to regenerate backup codes
export function useRegenerateBackupCodes() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (verificationToken: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the secret
      const { data: twoFactor, error: fetchError } = await supabase
        .from('two_factor_auth')
        .select('secret, is_enabled')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!twoFactor.is_enabled) {
        throw new Error('2FA is not enabled');
      }

      // Verify the token
      if (!isValidTokenFormat(verificationToken)) {
        throw new Error('Invalid code format. Please enter 6 digits.');
      }

      const isValid = await verifyTOTP(twoFactor.secret, verificationToken);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Generate new backup codes
      const newBackupCodes = generateBackupCodes(10);

      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          backup_codes: newBackupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return newBackupCodes;
    },
    onSuccess: () => {
      toast({
        title: 'Backup Codes Regenerated',
        description: 'New backup codes have been generated. Please save them securely.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Regenerate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
