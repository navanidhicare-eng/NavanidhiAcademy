import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, BookOpen, Calendar, DollarSign, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoursePurchase {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    agentId: string;
    agentEmail: string;
    productId: string;
    productName: string;
    studentName: string;
    coursePrice: number;
    commissionAmount: number;
    transactionId: string;
  };
  is_read: boolean;
  created_at: string;
}

function CoursePurchases() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course purchase notifications
  const { data: purchases = [], isLoading } = useQuery<CoursePurchase[]>({
    queryKey: ['/api/admin/course-purchases'],
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PATCH', `/api/admin/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/course-purchases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as read",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Course Purchases" subtitle="Monitor new course purchases by agents and SO centers">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Course Purchases" subtitle="Monitor new course purchases by agents and SO centers">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{purchases.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(purchases.reduce((sum, p) => sum + (p.data?.coursePrice || 0), 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(purchases.reduce((sum, p) => sum + (p.data?.commissionAmount || 0), 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Check className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {purchases.filter(p => !p.is_read).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase List */}
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Purchases</h3>
                <p className="text-gray-600">Course purchases by agents and SO centers will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            purchases.map((purchase) => (
              <Card 
                key={purchase.id} 
                className={`transition-all duration-200 ${
                  !purchase.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-l-4 border-l-gray-300'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg text-gray-900">{purchase.title}</CardTitle>
                        {!purchase.is_read && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">New</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{purchase.message}</p>
                      <div className="text-sm text-gray-500">
                        {formatDate(purchase.created_at)}
                      </div>
                    </div>
                    {!purchase.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(purchase.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {purchase.data && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Agent</span>
                        </div>
                        <div className="font-medium text-gray-900">{purchase.data.agentEmail}</div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Course</span>
                        </div>
                        <div className="font-medium text-blue-900">{purchase.data.productName}</div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Price</span>
                        </div>
                        <div className="font-bold text-green-700">{formatCurrency(purchase.data.coursePrice)}</div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Commission</span>
                        </div>
                        <div className="font-bold text-purple-700">{formatCurrency(purchase.data.commissionAmount)}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Student Name:</span>
                          <span className="ml-2 text-gray-900">{purchase.data.studentName}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Transaction ID:</span>
                          <span className="ml-2 text-gray-900 font-mono">{purchase.data.transactionId}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CoursePurchases;