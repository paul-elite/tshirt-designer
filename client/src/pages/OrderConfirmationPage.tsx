import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, MapPin, ArrowRight } from 'lucide-react';
import { ordersApi } from '../services/api';
import Button from '../components/ui/Button';
import type { Order } from '../types';
import { SHIPPING_METHODS } from '../types';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      const response = await ordersApi.getOne(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order:', error);
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

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shippingMethodInfo = SHIPPING_METHODS.find((m) => m.value === order.shippingMethod);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">
          Thank you for your order. We've sent a confirmation email to your address.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-gray-400" />
            Order Items
          </h3>
          <div className="space-y-4">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product?.design?.name || 'Custom Design'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Size: {item.product?.size} | Color: {item.product?.colorName}
                  </p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2 text-gray-400" />
            Shipping
          </h3>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{shippingMethodInfo?.label}</p>
              <p className="text-sm text-gray-500">{shippingMethodInfo?.description}</p>
            </div>
            <span className="font-medium">${order.shipping.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-400" />
            Delivery Address
          </h3>
          {order.address && (
            <div>
              <p className="font-medium">{order.address.name}</p>
              <p className="text-gray-600">{order.address.street}</p>
              <p className="text-gray-600">
                {order.address.city}, {order.address.state} {order.address.zipCode}
              </p>
              <p className="text-gray-600">{order.address.country}</p>
            </div>
          )}
        </div>

        {/* Order Total */}
        <div className="border-t pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>${order.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t text-lg font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/orders" className="flex-1">
          <Button variant="outline" className="w-full">
            View All Orders
          </Button>
        </Link>
        <Link to="/design" className="flex-1">
          <Button className="w-full">
            Create Another Design
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
