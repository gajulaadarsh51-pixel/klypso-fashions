import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

const AdminAnalytics = () => {
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((day) => {
      const dayStart = startOfDay(day);
      const dayRevenue = orders
        .filter((o) => {
          const orderDate = startOfDay(new Date(o.created_at));
          return orderDate.getTime() === dayStart.getTime() && o.payment_status === 'paid';
        })
        .reduce((sum, o) => sum + o.total, 0);

      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue,
      };
    });
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [orders]);

  // Top selling categories
  const salesByCategory = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const product = products.find((p) => p.id === item.id);
          if (product) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + item.quantity;
          }
        });
      }
    });
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      sales: count,
    }));
  }, [orders, products]);

  const COLORS = ['#D4AF37', '#8B7355', '#2F4F4F', '#708090', '#A0522D', '#6B8E23'];

  // Summary stats
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.filter((o) => o.payment_status === 'paid').length : 0;
  const totalItems = orders.reduce((sum, o) => {
    if (Array.isArray(o.items)) {
      return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your store performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-heading font-bold mt-2">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-background border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Average Order Value</p>
          <p className="text-3xl font-heading font-bold mt-2">{formatPrice(avgOrderValue || 0)}</p>
        </div>
        <div className="bg-background border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Items Sold</p>
          <p className="text-3xl font-heading font-bold mt-2">{totalItems}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Revenue (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#888' }} />
                <YAxis tick={{ fill: '#888' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#888' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Orders by Status</h2>
          <div className="h-64">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {ordersByStatus.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No order data yet
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-background border rounded-lg p-6 lg:col-span-2">
          <h2 className="font-heading text-xl font-semibold mb-4">Sales by Category</h2>
          <div className="h-64">
            {salesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="category" tick={{ fill: '#888' }} />
                  <YAxis tick={{ fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Bar dataKey="sales" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No sales data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
