import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, Percent, FileText } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  price: string;
  commissionPercentage: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductsListProps {
  userRole: 'so_center' | 'agent' | 'marketing_head';
}

export function ProductsList({ userRole }: ProductsListProps) {
  // Determine API endpoint based on role
  const getApiEndpoint = () => {
    switch (userRole) {
      case 'marketing_head':
        return '/api/marketing/products';
      case 'so_center':
        return '/api/so_center/products';
      case 'agent':
        return '/api/agent/products';
      default:
        return '/api/so_center/products';
    }
  };

  // Fetch active products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [getApiEndpoint()],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600">
          {userRole === 'so_center' 
            ? 'No products are currently available for sale at your center.'
            : userRole === 'agent'
            ? 'No products are currently available for commission-based sales.'
            : 'No products are currently available in the product portfolio.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </CardTitle>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Price and Commission */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Price</span>
                  </div>
                  <div className="font-bold text-blue-700">₹{Number(product.price).toLocaleString()}</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      {userRole === 'agent' ? 'Commission' : userRole === 'marketing_head' ? 'Commission' : 'Margin'}
                    </span>
                  </div>
                  <div className="font-bold text-green-700">{product.commissionPercentage}%</div>
                </div>
              </div>

              {/* Requirements */}
              {product.requirements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Requirements</span>
                  </div>
                  <p className="text-sm text-yellow-800 line-clamp-2">{product.requirements}</p>
                </div>
              )}

              {/* Earnings Potential (for agents and marketing_head) */}
              {(userRole === 'agent' || userRole === 'marketing_head') && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">
                    {userRole === 'marketing_head' ? 'Commission per Sale' : 'Commission Earnings'}
                  </div>
                  <div className="font-bold text-purple-700">
                    ₹{(Number(product.price) * Number(product.commissionPercentage) / 100).toLocaleString()} per sale
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button 
                className="w-full mt-4" 
                variant={userRole === 'agent' ? 'default' : 'outline'}
              >
                {userRole === 'agent' ? 'Promote Product' : userRole === 'marketing_head' ? 'Analyze Product' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}