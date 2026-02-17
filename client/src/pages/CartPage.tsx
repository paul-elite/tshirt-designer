import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { discountsApi } from '../services/api';
import CartItem from '../components/cart/CartItem';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, localItems, subtotal, isLoading, fetchCart, updateQuantity, removeItem } =
    useCartStore();

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    description: string;
  } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const cartItems = isAuthenticated ? items : [];
  const localCartItems = !isAuthenticated ? localItems : [];
  const hasItems = cartItems.length > 0 || localCartItems.length > 0;

  const calculateLocalSubtotal = () => {
    return localCartItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  };

  const currentSubtotal = isAuthenticated ? subtotal : calculateLocalSubtotal();

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const response = await discountsApi.validate(discountCode, currentSubtotal);
      setAppliedDiscount({
        code: response.data.code,
        amount: response.data.discountAmount,
        description: response.data.description,
      });
      toast.success('Discount applied!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Invalid discount code');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout', { state: { discountCode: appliedDiscount?.code } });
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Start designing your custom t-shirt!</p>
          <Link to="/design">
            <Button>Start Designing</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {isAuthenticated
            ? cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            : localCartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-4 p-4 bg-white rounded-xl border"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.designName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.designName}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Color: {item.colorName}
                    </p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-semibold text-gray-900 mt-2">
                      ${(item.pricePerUnit * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Discount Code */}
            <div className="mb-6">
              <div className="flex space-x-2">
                <Input
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyDiscount}
                  isLoading={isApplyingDiscount}
                >
                  Apply
                </Button>
              </div>
              {appliedDiscount && (
                <div className="mt-2 flex items-center text-green-600 text-sm">
                  <Tag className="h-4 w-4 mr-1" />
                  {appliedDiscount.description} applied
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${currentSubtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${appliedDiscount.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-500">Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Estimated Total</span>
                <span className="font-bold text-lg">
                  ${(currentSubtotal - (appliedDiscount?.amount || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <Button onClick={handleCheckout} className="w-full mt-6" size="lg">
              Checkout
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <Link
              to="/design"
              className="block text-center mt-4 text-primary-600 hover:text-primary-700 text-sm"
            >
              Continue Designing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
