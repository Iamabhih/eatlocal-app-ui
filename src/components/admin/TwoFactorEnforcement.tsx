/**
 * Two-Factor Authentication Enforcement
 *
 * Displays a modal requiring admins to set up 2FA before accessing admin features
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TwoFactorSetup } from './TwoFactorSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useTwoFactorStatus } from '@/hooks/useTwoFactor';

export function TwoFactorEnforcement() {
  const { user, userRoles } = useAuth();
  const { data: twoFactorStatus, isLoading } = useTwoFactorStatus();
  const [showSetup, setShowSetup] = useState(false);

  // Check if user is admin/superadmin
  const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');

  // Check if 2FA is required but not enabled
  const requires2FA = isAdmin && !twoFactorStatus?.is_enabled;

  useEffect(() => {
    if (requires2FA && !isLoading) {
      setShowSetup(true);
    }
  }, [requires2FA, isLoading]);

  if (!requires2FA || isLoading) {
    return null;
  }

  return (
    <Dialog open={showSetup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-orange-600">
            <Shield className="h-6 w-6" />
            <DialogTitle>Two-Factor Authentication Required</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            For security reasons, all administrators must enable two-factor authentication
            before accessing admin features.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You will not be able to access admin features until 2FA is enabled.
            This is a mandatory security requirement.
          </AlertDescription>
        </Alert>

        <TwoFactorSetup />
      </DialogContent>
    </Dialog>
  );
}
