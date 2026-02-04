import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product, useDeleteProduct, useUpdateProduct } from '@/hooks/useProducts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

const ProductsTable = ({ products, onEdit }: ProductsTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const handleDelete = () => {
    if (deleteId) {
      deleteProduct.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const toggleActive = (product: Product) => {
    updateProduct.mutate({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      is_active: !product.is_active,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Product</th>
              <th className="text-left p-4 font-medium text-sm">Category</th>
              <th className="text-left p-4 font-medium text-sm">Price</th>
              <th className="text-left p-4 font-medium text-sm">Stock</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.subcategory}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">{product.category}</td>
                <td className="p-4">
                  <div>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={product.stock < 10 ? 'text-destructive font-medium' : ''}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {product.is_active ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {product.is_new && <Badge className="bg-gold text-primary">NEW</Badge>}
                    {product.is_on_sale && <Badge variant="destructive">SALE</Badge>}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(product)}
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {product.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                      <Edit size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsTable;
