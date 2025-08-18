import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, DollarSign, Percent, FileText, ShoppingCart, User, GraduationCap, MapPin, Phone, Receipt } from 'lucide-react';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface Product {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  price: string;
  commission_percentage: string;
  is_active: boolean;
  created_at: string;
}

const purchaseFormSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  class: z.string().min(1, "Class is required"),
  education: z.string().min(1, "Education level is required"),
  address: z.string().min(1, "Address is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required").max(10, "Mobile number must be 10 digits"),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

function Products() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has access to products
  if (!user || !['so_center', 'agent', 'marketing_head'].includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
        <p className="text-gray-600">
          This page is only accessible to SO Centers, Agents, and Marketing Head.
        </p>
      </div>
    );
  }

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      studentName: "",
      class: "",
      education: "",
      address: "",
      mobileNumber: "",
    },
  });

  // Fetch products based on user role
  const apiEndpoint = user?.role === 'agent' ? '/api/agent/products' : '/api/so_center/products';
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [apiEndpoint],
  });

  // Purchase product mutation
  const purchaseProductMutation = useMutation({
    mutationFn: async (data: PurchaseFormData & { productId: string }) => {
      const response = await apiRequest('POST', '/api/products/purchase', data);
      return response;
    },
    onSuccess: (result: any) => {
      console.log('Purchase success result:', result);

      // Play success sound
      const audio = new Audio('/phone_pe_notification.mp3');
      audio.play().catch(() => {
        // Fallback if audio fails
        console.log('Audio playback failed');
      });

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Set invoice data and show invoice
      setInvoiceData({
        transactionId: result.transactionId || 'N/A',
        productName: selectedProduct?.name || '',
        studentName: form.getValues('studentName'),
        coursePrice: Number(selectedProduct?.price || 0),
        commissionAmount: Number(selectedProduct?.price || 0) * Number(selectedProduct?.commission_percentage || 0) / 100,
        purchaseDate: new Date().toISOString(),
        agentEmail: result.agentEmail || 'N/A'
      });

      toast({
        title: "Course Successfully Purchased!",
        description: `${selectedProduct?.name} purchased. Transaction ID: ${result.transactionId || 'Processing...'}`,
      });

      // Reset form and close dialog
      form.reset();
      setShowPurchaseForm(false);
      setSelectedProduct(null);

      // Show invoice
      setShowInvoice(true);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product);
    setShowPurchaseForm(true);
  };

  const handleSubmitPurchase = (data: PurchaseFormData) => {
    if (!selectedProduct) return;

    purchaseProductMutation.mutate({
      ...data,
      productId: selectedProduct.id,
    });
  };

  const calculateCommission = (price: string, commissionPercentage: string) => {
    const priceNum = Number(price) || 0;
    const commissionNum = Number(commissionPercentage) || 0;
    return (priceNum * commissionNum / 100);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Products" subtitle="Browse and purchase available products">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (products.length === 0) {
    return (
      <DashboardLayout title="Products" subtitle="Browse and purchase available products">
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
          <p className="text-gray-600">
            No products are currently available for purchase.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Products" subtitle="Browse and purchase available products">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const commission = calculateCommission(product.price, product.commission_percentage);

          return (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
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
                  <Badge variant="default" className="ml-2">
                    Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price and Commission */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Price</span>
                    </div>
                    <div className="font-bold text-blue-700">{formatCurrency(Number(product.price))}</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Commission</span>
                    </div>
                    <div className="font-bold text-green-700">{product.commission_percentage}%</div>
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

                {/* Commission Earnings */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">
                    Commission Earnings
                  </div>
                  <div className="font-bold text-purple-700">
                    {formatCurrency(commission)} per sale
                  </div>
                </div>

                {/* Buy Now Button */}
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  onClick={() => handleBuyNow(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Purchase Form Dialog */}
      <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase Course - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitPurchase)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Student Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Class
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st">1st Grade</SelectItem>
                          <SelectItem value="2nd">2nd Grade</SelectItem>
                          <SelectItem value="3rd">3rd Grade</SelectItem>
                          <SelectItem value="4th">4th Grade</SelectItem>
                          <SelectItem value="5th">5th Grade</SelectItem>
                          <SelectItem value="6th">6th Grade</SelectItem>
                          <SelectItem value="7th">7th Grade</SelectItem>
                          <SelectItem value="8th">8th Grade</SelectItem>
                          <SelectItem value="9th">9th Grade</SelectItem>
                          <SelectItem value="10th">10th Grade</SelectItem>
                          <SelectItem value="11th">11th Grade</SelectItem>
                          <SelectItem value="12th">12th Grade</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Level</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary Education</SelectItem>
                          <SelectItem value="secondary">Secondary Education</SelectItem>
                          <SelectItem value="higher-secondary">Higher Secondary</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter complete address"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Mobile Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">Purchase Summary</div>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Course Price:</span>
                      <span className="font-medium">{formatCurrency(Number(selectedProduct.price))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Commission:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(calculateCommission(selectedProduct.price, selectedProduct.commission_percentage))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPurchaseForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={purchaseProductMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {purchaseProductMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Invoice Generator */}
      <InvoiceGenerator
        invoiceData={invoiceData}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
      />
    </DashboardLayout>
  );
}

export default Products;