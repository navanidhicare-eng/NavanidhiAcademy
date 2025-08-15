import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Package, Edit2, DollarSign, FileText, CheckSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from '@/components/layout/DashboardLayout';

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

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  requirements: z.string().optional(),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a valid positive number"),
  commissionPercentage: z.string().min(1, "Commission percentage is required").refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Must be between 0-100"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

function AdminProducts() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      requirements: "",
      price: "",
      commissionPercentage: "0",
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest('POST', '/api/admin/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id: string }) => {
      await apiRequest('PUT', `/api/admin/products/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/admin/products/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: "Success",
        description: "Product status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      requirements: product.requirements || "",
      price: product.price,
      commissionPercentage: product.commissionPercentage,
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const formatCurrency = (amount: string) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <DashboardLayout 
      title="Products Management" 
      subtitle="Create, manage, and optimize your product portfolio with real-time analytics"
      showAddButton={true}
      onAddClick={() => setIsCreateOpen(true)}
      addButtonText="Add Product"
    >
      <div className="relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-32 right-0 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float-slower"></div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            form={form} 
            onSubmit={handleSubmit} 
            isLoading={createProductMutation.isPending}
            isEditing={false}
          />
        </DialogContent>
      </Dialog>

      {/* Products Grid with premium animations */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse-premium bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-lg">
                <CardHeader>
                  <div className="h-6 bg-gray-300 rounded-full animate-shimmer"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-2/3 animate-shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded-full animate-shimmer"></div>
                    <div className="h-4 bg-gray-300 rounded-full w-1/2 animate-shimmer"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 animate-fade-in-up">
              <div className="relative">
                <Package className="h-20 w-20 mb-6 opacity-30 animate-float-slow" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">No Products Found</h3>
              <p className="text-lg text-center max-w-md leading-relaxed">
                Start by creating your first product to enable commission-based sales for SO centers.
              </p>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Product
              </Button>
            </div>
          ) : (
            products.map((product, index) => (
              <Card key={product.id} className={`group relative overflow-hidden transition-all duration-500 border-0 shadow-lg hover:shadow-2xl hover:-translate-y-2 transform hover:scale-105 animate-slide-up-stagger ${product.isActive ? 'bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30' : 'bg-gradient-to-br from-white via-red-50/20 to-rose-50/30'}`}
                    style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price and Commission */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</span>
                      </div>
                      <div className="font-bold text-green-700">{formatCurrency(product.price)}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commission</span>
                      </div>
                      <div className="font-bold text-blue-700">{product.commissionPercentage}%</div>
                    </div>
                  </div>

                  {/* Requirements */}
                  {product.requirements && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Requirements</span>
                      </div>
                      <p className="text-sm text-yellow-800 line-clamp-3">{product.requirements}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                      />
                      <span className="text-sm text-gray-600">
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <Dialog open={editingProduct?.id === product.id} onOpenChange={(open) => !open && setEditingProduct(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Product</DialogTitle>
                        </DialogHeader>
                        <ProductForm 
                          form={form} 
                          onSubmit={handleSubmit} 
                          isLoading={updateProductMutation.isPending}
                          isEditing={true}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}

// Product Form Component
interface ProductFormProps {
  form: any;
  onSubmit: (data: ProductFormData) => void;
  isLoading: boolean;
  isEditing: boolean;
}

function ProductForm({ form, onSubmit, isLoading, isEditing }: ProductFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="commissionPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commission Percentage (%) *</FormLabel>
              <FormControl>
                <Input type="number" min="0" max="100" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Product description..." 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="List any requirements for purchasing this product..." 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AdminProducts;