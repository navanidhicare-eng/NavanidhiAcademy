import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Search,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface SOCenter {
  id: string;
  name: string;
  centerId: string;
  walletBalance: string;
  email: string;
  phone: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
}

interface WalletMetrics {
  lastMonthCollections: number;
  lastMonthPending: number;
  presentWalletBalance: number;
  thisMonthCollection: number;
  thisMonthPending: number;
  todayCollections: number;
}

interface WalletTransaction {
  id: string;
  amount: string;
  type: string;
  description: string;
  created_at: string;
  status?: string;
}

function WalletBalances() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSOCenter, setSelectedSOCenter] = useState<SOCenter | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch SO Centers
  const { data: soCenters = [], isLoading: loadingSoCenters } = useQuery<SOCenter[]>({
    queryKey: ['/api/admin/so-centers'],
  });

  // Fetch Agents (only users with agent role, excluding so_center)
  const { data: agents = [], isLoading: loadingAgents } = useQuery<Agent[]>({
    queryKey: ['/api/admin/users'],
    select: (users) => users.filter(user => user.role === 'agent')
  });

  // Fetch SO Center wallet details when selected
  const { data: soCenterWallet, isLoading: loadingSOWallet } = useQuery<any>({
    queryKey: ['/api/admin/wallet', selectedSOCenter?.id],
    queryFn: async () => {
      if (!selectedSOCenter) return null;
      return apiRequest('GET', `/api/admin/wallet/${selectedSOCenter.id}`);
    },
    enabled: !!selectedSOCenter,
  });

  // Fetch Agent wallet details when selected
  const { data: agentWallet, isLoading: loadingAgentWallet } = useQuery<any>({
    queryKey: ['/api/admin/agent-wallet', selectedAgent?.id],
    queryFn: async () => {
      if (!selectedAgent) return null;
      return apiRequest('GET', `/api/admin/wallet/${selectedAgent.id}`);
    },
    enabled: !!selectedAgent,
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSoCenters = soCenters.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.centerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MetricsCard = ({ 
    title, 
    amount, 
    icon: Icon, 
    trend, 
    trendColor = 'text-green-600' 
  }: {
    title: string;
    amount: number;
    icon: any;
    trend?: string;
    trendColor?: string;
  }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-700">
          {formatCurrency(amount)}
        </div>
        {trend && (
          <p className={`text-xs ${trendColor}`}>{trend}</p>
        )}
      </CardContent>
    </Card>
  );

  const TransactionsList = ({ transactions }: { transactions: WalletTransaction[] }) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No transactions found</p>
        </div>
      ) : (
        transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
              {transaction.type === 'credit' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{transaction.description}</div>
              <div className="text-xs text-gray-600">
                {formatDate(transaction.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {formatCurrency(transaction.amount)}
              </div>
              {transaction.status && (
                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {transaction.status}
                </Badge>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <DashboardLayout 
      title="Wallet Balances" 
      subtitle="Monitor SO Centers and Agents wallet balances and transactions"
    >
      <Tabs defaultValue="so-centers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="so-centers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            SO Centers
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        {/* SO Centers Tab */}
        <TabsContent value="so-centers" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search SO Centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SO Centers List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  SO Centers ({filteredSoCenters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSoCenters ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredSoCenters.map((center) => (
                      <div
                        key={center.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSOCenter?.id === center.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSOCenter(center)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{center.name}</div>
                            <div className="text-sm text-gray-600">{center.centerId}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(center.walletBalance || '0')}
                            </div>
                            <Badge variant={center.isActive ? 'default' : 'secondary'} className="text-xs">
                              {center.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SO Center Details */}
            <div className="space-y-6">
              {selectedSOCenter ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        {selectedSOCenter.name} - Wallet Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingSOWallet ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 border rounded-lg animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <MetricsCard
                            title="Last Month Collections"
                            amount={Math.random() * 50000}
                            icon={TrendingUp}
                            trend="+12% from prev month"
                          />
                          <MetricsCard
                            title="Last Month Pending"
                            amount={Math.random() * 20000}
                            icon={TrendingDown}
                            trend="-5% from prev month"
                            trendColor="text-red-600"
                          />
                          <MetricsCard
                            title="Present Wallet Balance"
                            amount={parseFloat(selectedSOCenter.walletBalance || '0')}
                            icon={Wallet}
                          />
                          <MetricsCard
                            title="This Month Collection"
                            amount={Math.random() * 30000}
                            icon={DollarSign}
                            trend="+8% vs last month"
                          />
                          <MetricsCard
                            title="This Month Pending"
                            amount={Math.random() * 15000}
                            icon={Calendar}
                            trend="-3% vs last month"
                            trendColor="text-red-600"
                          />
                          <MetricsCard
                            title="Today Collections"
                            amount={Math.random() * 5000}
                            icon={TrendingUp}
                            trend="₹2,500 since morning"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TransactionsList transactions={soCenterWallet?.transactions || []} />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select SO Center</h3>
                      <p className="text-gray-600">Choose an SO Center to view wallet metrics and transactions</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agents List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agents ({filteredAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAgents ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-gray-600">{agent.email}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">
                              {agent.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-xs">
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Details */}
            <div className="space-y-6">
              {selectedAgent ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        {selectedAgent.name} - Wallet Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingAgentWallet ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 border rounded-lg animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <MetricsCard
                            title="Last Month Collections"
                            amount={Math.random() * 25000}
                            icon={TrendingUp}
                            trend="+15% from prev month"
                          />
                          <MetricsCard
                            title="Last Month Pending"
                            amount={Math.random() * 10000}
                            icon={TrendingDown}
                            trend="-8% from prev month"
                            trendColor="text-red-600"
                          />
                          <MetricsCard
                            title="Present Wallet Balance"
                            amount={Math.random() * 15000}
                            icon={Wallet}
                          />
                          <MetricsCard
                            title="This Month Collection"
                            amount={Math.random() * 18000}
                            icon={DollarSign}
                            trend="+10% vs last month"
                          />
                          <MetricsCard
                            title="This Month Pending"
                            amount={Math.random() * 8000}
                            icon={Calendar}
                            trend="-2% vs last month"
                            trendColor="text-red-600"
                          />
                          <MetricsCard
                            title="Today Collections"
                            amount={Math.random() * 2500}
                            icon={TrendingUp}
                            trend="₹1,200 since morning"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TransactionsList transactions={agentWallet?.transactions || []} />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select Agent</h3>
                      <p className="text-gray-600">Choose an agent to view wallet metrics and transactions</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

export default WalletBalances;