import { DollarSign, Package, ShoppingCart, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  // Calculate stats
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock < 10);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to SS Fashions Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          change="From paid orders"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          change={`${pendingOrders} pending`}
          changeType={pendingOrders > 0 ? 'negative' : 'positive'}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Products"
          value={products.length}
          change={`${products.filter(p => p.is_active).length} active`}
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          change={lowStockProducts.length > 0 ? 'Needs attention' : 'All stocked'}
          changeType={lowStockProducts.length > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-gold hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <p className={`text-xs capitalize ${
                      order.status === 'delivered' ? 'text-green-600' : 
                      order.status === 'cancelled' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Low Stock Alert</h2>
            <Link to="/admin/products" className="text-sm text-gold hover:underline">
              Manage inventory
            </Link>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center gap-4 py-2 border-b last:border-0">
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
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${product.stock === 0 ? 'text-destructive' : 'text-yellow-600'}`}>
                      {product.stock} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto text-green-600 mb-2" size={32} />
              <p className="text-muted-foreground">All products are well stocked!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
