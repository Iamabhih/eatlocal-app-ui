import { Wallet, ArrowUpRight, ArrowDownLeft, History, Plus, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useUserWallet,
  useWalletTransactions,
  formatWalletAmount,
  getTransactionDisplay,
} from '@/hooks/useWallet';

export function WalletDashboard() {
  const { data: wallet, isLoading: walletLoading } = useUserWallet();
  const { data: transactions = [] } = useWalletTransactions(15);

  if (walletLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading wallet...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              <span className="font-medium">Smash Local Wallet</span>
            </div>
            <Badge variant="secondary" className="bg-white/20">
              {wallet?.currency || 'ZAR'}
            </Badge>
          </div>

          <div className="mb-6">
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-4xl font-bold">
              {formatWalletAmount(wallet?.balance || 0, wallet?.currency)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Gift className="h-4 w-4" />
              Redeem Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Received</p>
              <p className="text-sm text-muted-foreground">
                {formatWalletAmount(
                  transactions
                    .filter((t) => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Spent</p>
              <p className="text-sm text-muted-foreground">
                {formatWalletAmount(
                  Math.abs(
                    transactions
                      .filter((t) => t.amount < 0)
                      .reduce((sum, t) => sum + t.amount, 0)
                  )
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Your recent wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your wallet credits will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const { icon, color, label } = getTransactionDisplay(transaction.type);
                const isPositive = transaction.amount > 0;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                        {icon}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.description || label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatWalletAmount(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatWalletAmount(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Earn Credits
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Receive refunds for cancelled orders</li>
              <li>• Get promotional credits from campaigns</li>
              <li>• Earn referral bonuses</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Using Your Wallet
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Apply credits at checkout</li>
              <li>• Combine with other payment methods</li>
              <li>• No expiry on earned credits</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
