import { Gift, Star, TrendingUp, History, Award, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useUserLoyalty,
  useLoyaltyTiers,
  useLoyaltyTransactions,
  getProgressToNextTier,
} from '@/hooks/useLoyalty';

export function LoyaltyDashboard() {
  const { data: userLoyalty, isLoading: loyaltyLoading } = useUserLoyalty();
  const { data: tiers = [] } = useLoyaltyTiers();
  const { data: transactions = [] } = useLoyaltyTransactions(10);

  if (loyaltyLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading loyalty status...</p>
        </CardContent>
      </Card>
    );
  }

  const { nextTier, pointsNeeded, progressPercent } = getProgressToNextTier(
    userLoyalty?.total_points || 0,
    tiers
  );

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: userLoyalty?.tier?.badge_color || '#CD7F32' }}
        />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {userLoyalty?.tier?.name || 'Bronze'} Member
              </CardTitle>
              <CardDescription>
                {userLoyalty?.lifetime_orders || 0} lifetime orders
              </CardDescription>
            </div>
            <Badge
              style={{
                backgroundColor: userLoyalty?.tier?.badge_color || '#CD7F32',
                color: 'white',
              }}
              className="text-lg px-4 py-1"
            >
              {userLoyalty?.tier?.multiplier || 1}x Points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Points Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-3xl font-bold">{userLoyalty?.total_points || 0}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Available Points</p>
              <p className="text-3xl font-bold text-primary">
                {userLoyalty?.current_points || 0}
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span className="font-medium">{pointsNeeded} points needed</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          )}

          {/* Current Benefits */}
          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Your Benefits
            </h4>
            <ul className="space-y-2">
              {(userLoyalty?.tier?.benefits || ['Free delivery on first order']).map(
                (benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {benefit}
                  </li>
                )
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* All Tiers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Loyalty Tiers
          </CardTitle>
          <CardDescription>
            Earn more points and unlock better rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier) => {
              const isCurrentTier = tier.id === userLoyalty?.tier_id;
              const isUnlocked = (userLoyalty?.total_points || 0) >= tier.min_points;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-lg border p-4 text-center transition-all ${
                    isCurrentTier
                      ? 'border-2 ring-2 ring-offset-2'
                      : isUnlocked
                      ? 'border-primary/50'
                      : 'opacity-60'
                  }`}
                  style={{
                    borderColor: isCurrentTier ? tier.badge_color : undefined,
                    ['--tw-ring-color' as string]: tier.badge_color,
                  }}
                >
                  {isCurrentTier && (
                    <Badge
                      className="absolute -top-2 left-1/2 -translate-x-1/2"
                      style={{ backgroundColor: tier.badge_color }}
                    >
                      Current
                    </Badge>
                  )}
                  <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: tier.badge_color + '20' }}
                  >
                    <Award className="h-6 w-6" style={{ color: tier.badge_color }} />
                  </div>
                  <h4 className="font-semibold">{tier.name}</h4>
                  <p className="text-xs text-muted-foreground">{tier.min_points}+ points</p>
                  <p className="text-sm font-medium mt-1">{tier.multiplier}x multiplier</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Points Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet. Order food to earn points!
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.type === 'earn'
                        ? 'Points Earned'
                        : transaction.type === 'redeem'
                        ? 'Points Redeemed'
                        : transaction.type === 'bonus'
                        ? 'Bonus Points'
                        : 'Points Expired'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description ||
                        new Date(transaction.created_at).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.points > 0 ? '+' : ''}
                    {transaction.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl">🍔</span>
              </div>
              <div>
                <h4 className="font-medium">Order Food</h4>
                <p className="text-sm text-muted-foreground">
                  Earn 1 point for every R10 spent
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <h4 className="font-medium">Write Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Get bonus points for helpful reviews
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h4 className="font-medium">Refer Friends</h4>
                <p className="text-sm text-muted-foreground">
                  Earn points when friends order
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
