import { useState } from 'react';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginTwoFactorVerification } from '@/hooks/useTwoFactor';

interface TwoFactorVerificationProps {
  userId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({
  userId,
  onVerified,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const verifyMutation = useLoginTwoFactorVerification();

  const handleVerify = async () => {
    const result = await verifyMutation.mutateAsync({
      userId,
      token: code,
    });

    if (result.verified) {
      onVerified();
    }
  };

  const handleBackupCodeVerify = async () => {
    const result = await verifyMutation.mutateAsync({
      userId,
      token: backupCode,
    });

    if (result.verified) {
      onVerified();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="authenticator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="authenticator">Authenticator</TabsTrigger>
              <TabsTrigger value="backup">Backup Code</TabsTrigger>
            </TabsList>

            <TabsContent value="authenticator" className="space-y-4 pt-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
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

              <Button
                onClick={handleVerify}
                disabled={code.length !== 6 || verifyMutation.isPending}
                className="w-full"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verify
              </Button>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="backupCode">Backup Code</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="backupCode"
                      placeholder="Enter backup code"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      className="pl-9 uppercase"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use one of your backup codes if you don't have access to your authenticator app
                </p>
              </div>

              <Button
                onClick={handleBackupCodeVerify}
                disabled={backupCode.length < 6 || verifyMutation.isPending}
                className="w-full"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verify with Backup Code
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-muted-foreground"
          >
            Cancel and Sign Out
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Having trouble? Contact support for assistance.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
