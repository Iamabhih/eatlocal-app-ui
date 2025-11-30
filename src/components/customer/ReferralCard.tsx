import { useState } from 'react';
import {
  Gift,
  Copy,
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  Smartphone,
  Users,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useReferralCode,
  useReferralStats,
  useShareReferral,
  getReferralUrl,
} from '@/hooks/useReferrals';

export function ReferralCard() {
  const { data: referralCode, isLoading } = useReferralCode();
  const { data: stats } = useReferralStats();
  const shareReferral = useShareReferral();
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleCopyCode = async () => {
    if (!referralCode) return;
    await shareReferral.shareViaClipboard(referralCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;
    await shareReferral.shareViaWebShare(referralCode.code);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!referralCode) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Invite Friends, Earn Rewards</CardTitle>
              <CardDescription>
                Give R{shareReferral.REWARDS.REFERRED}, Get R{shareReferral.REWARDS.REFERRER}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            <Users className="h-3 w-3 mr-1" />
            {stats?.totalReferrals || 0} referrals
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Your referral code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-2xl font-bold tracking-wider text-primary">
              {referralCode.code}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Share via</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full"
              onClick={handleShare}
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full bg-green-50 hover:bg-green-100 border-green-200"
              onClick={() => shareReferral.shareViaWhatsApp(referralCode.code)}
              title="WhatsApp"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => shareReferral.shareViaTwitter(referralCode.code)}
              title="Twitter"
            >
              <Twitter className="h-5 w-5 text-blue-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => shareReferral.shareViaFacebook(referralCode.code)}
              title="Facebook"
            >
              <Facebook className="h-5 w-5 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full hidden sm:flex"
              onClick={() => shareReferral.shareViaEmail(referralCode.code)}
              title="Email"
            >
              <Mail className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full hidden sm:flex"
              onClick={() => shareReferral.shareViaSms(referralCode.code)}
              title="SMS"
            >
              <Smartphone className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Copy Link Button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleCopyCode}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Referral Link
            </>
          )}
        </Button>

        <Separator />

        {/* Stats Collapsible */}
        <Collapsible open={showStats} onOpenChange={setShowStats}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Your Referral Stats</span>
              {showStats ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats?.totalReferrals || 0}</p>
                <p className="text-xs text-muted-foreground">Friends Invited</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  R{stats?.pendingRewards || 0}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  R{stats?.totalRewardsEarned || 0}
                </p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </div>
            </div>

            {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Recent Referrals</p>
                {stats.recentReferrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                    <Badge
                      variant={referral.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {referral.status === 'completed' ? (
                        <>+R{referral.reward}</>
                      ) : (
                        'Pending'
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* How it works */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p className="font-medium text-foreground">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Share your code with friends</li>
            <li>They get R{shareReferral.REWARDS.REFERRED} off their first order</li>
            <li>You get R{shareReferral.REWARDS.REFERRER} credit when they order</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
