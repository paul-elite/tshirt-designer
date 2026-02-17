import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { ordersApi } from '../services/api';
import type { Order, OrderStatus } from '../types';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  processing: { label: 'Processing', icon: Package, color: 'text-purple-600 bg-purple-50' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start designing your custom t-shirts!</p>
          <Link
            to="/design"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Start Designing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status as OrderStatus] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Link
                key={order.id}
                to={`/order-confirmation/${order.id}`}
                className="block bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order</p>
                    <p className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                    >
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {status.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  {order.orderItems?.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {item.product?.design?.thumbnailUrl ? (
                        <img
                          src={item.product.design.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                  ))}
                  {(order.orderItems?.length || 0) > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{(order.orderItems?.length || 0) - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    <span>
                      {order.orderItems?.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                    <span className="mx-2">•</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                </div>

                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500">
                      Tracking: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
