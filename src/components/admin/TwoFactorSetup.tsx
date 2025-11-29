import { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useTwoFactorStatus,
  useSetupTwoFactor,
  useVerifyTwoFactor,
  useDisableTwoFactor,
} from '@/hooks/useTwoFactor';
import { useToast } from '@/hooks/use-toast';

export function TwoFactorSetup() {
  const { toast } = useToast();
  const { data: status, isLoading } = useTwoFactorStatus();
  const setupMutation = useSetupTwoFactor();
  const verifyMutation = useVerifyTwoFactor();
  const disableMutation = useDisableTwoFactor();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    backupCodes: string[];
    otpauthUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const isEnabled = status?.is_enabled ?? false;

  const handleSetup = async () => {
    const result = await setupMutation.mutateAsync();
    setSetupData(result);
    setShowSetupDialog(true);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;

    await verifyMutation.mutateAsync(verificationCode);
    setShowSetupDialog(false);
    setVerificationCode('');
    setSetupData(null);
  };

  const handleDisable = async () => {
    if (disableCode.length < 6) return;

    await disableMutation.mutateAsync(disableCode);
    setShowDisableDialog(false);
    setDisableCode('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? 'Two-factor authentication is enabled. You will need to enter a verification code from your authenticator app when signing in.'
              : 'Protect your admin account by enabling two-factor authentication. You will need an authenticator app like Google Authenticator or Authy.'}
          </p>

          {isEnabled ? (
            <Button
              variant="destructive"
              onClick={() => setShowDisableDialog(true)}
              className="gap-2"
            >
              <ShieldOff className="h-4 w-4" />
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={handleSetup} disabled={setupMutation.isPending} className="gap-2">
              {setupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Enable 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code or enter the secret key manually in your authenticator app
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-6 py-4">
              {/* QR Code Placeholder - In production, use a QR code library */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-center text-muted-foreground">
                    Scan with your authenticator app
                    <br />
                    <span className="font-mono mt-2 block text-xs">
                      {setupData.otpauthUrl.slice(0, 50)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Manual Entry Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                    {setupData.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(setupData.secret, 'Secret key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Backup Codes</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {showBackupCodes ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showBackupCodes && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md">
                    {setupData.backupCodes.map((code, index) => (
                      <code key={index} className="text-sm font-mono">
                        {code}
                      </code>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Save these backup codes securely. You can use them if you lose access to your
                  authenticator app.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(setupData.backupCodes.join('\n'), 'Backup codes')
                  }
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Backup Codes
                </Button>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Enter the 6-digit code from your authenticator app
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your verification code or a backup code to disable 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Disabling 2FA will make your account less secure. Only proceed if necessary.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length < 6 || disableMutation.isPending}
            >
              {disableMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
