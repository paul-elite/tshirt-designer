import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ChevronRight, MapPin, Truck, CreditCard, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';
import { addressesApi, paymentsApi, ordersApi } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AddressForm from '../components/checkout/AddressForm';
import PaymentForm from '../components/checkout/PaymentForm';
import type { Address, PriceBreakdown, ShippingMethod } from '../types';
import { SHIPPING_METHODS } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

type CheckoutStep = 'address' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, fetchCart } = useCartStore();

  const [step, setStep] = useState<CheckoutStep>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [discountCode] = useState<string>((location.state as { discountCode?: string })?.discountCode || '');
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAddressId || shippingMethod) {
      calculateTotals();
    }
  }, [selectedAddressId, shippingMethod, discountCode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchCart();
      const addressesRes = await addressesApi.getAll();
      setAddresses(addressesRes.data);

      // Select default address
      const defaultAddress = addressesRes.data.find((a: Address) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      toast.error('Failed to load checkout data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = async () => {
    try {
      const response = await paymentsApi.calculate({
        addressId: selectedAddressId || undefined,
        shippingMethod,
        discountCode: discountCode || undefined,
      });
      setPriceBreakdown(response.data);
    } catch (error) {
      console.error('Failed to calculate totals:', error);
    }
  };

  const handleAddAddress = async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await addressesApi.create(data);
      setAddresses([...addresses, response.data]);
      setSelectedAddressId(response.data.id);
      setShowAddressForm(false);
      toast.success('Address added');
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handleContinueToShipping = () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    setStep('shipping');
  };

  const handleContinueToPayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      const response = await paymentsApi.createIntent({
        addressId: selectedAddressId,
        shippingMethod,
        discountCode: discountCode || undefined,
      });

      setClientSecret(response.data.clientSecret);
      setPriceBreakdown(response.data.breakdown);
      setStep('payment');
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const response = await ordersApi.create({
        addressId: selectedAddressId!,
        shippingMethod,
        discountCode: discountCode || undefined,
        stripePaymentId: paymentIntentId,
      });

      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['Address', 'Shipping', 'Payment'].map((label, index) => {
          const stepKey = ['address', 'shipping', 'payment'][index] as CheckoutStep;
          const isActive = step === stepKey;
          const isPast =
            (step === 'shipping' && index === 0) ||
            (step === 'payment' && index < 2);

          return (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isPast
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isPast ? '✓' : index + 1}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
              {index < 2 && <ChevronRight className="h-5 w-5 mx-4 text-gray-300" />}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Address Step */}
          {step === 'address' && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center mb-6">
                <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Delivery Address</h2>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{address.name}</p>
                        <p className="text-sm text-gray-600">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-gray-500">{address.phone}</p>
                        )}
                        {address.isDefault && (
                          <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No saved addresses. Add one below.</p>
              )}

              <button
                onClick={() => setShowAddressForm(true)}
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Address
              </button>

              <div className="mt-6 pt-6 border-t">
                <Button onClick={handleContinueToShipping} className="w-full" size="lg">
                  Continue to Shipping
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Step */}
          {step === 'shipping' && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center mb-6">
                <Truck className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Shipping Method</h2>
              </div>

              {/* Selected Address Summary */}
              {selectedAddress && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Delivering to:</p>
                  <p className="font-medium">{selectedAddress.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}{' '}
                    {selectedAddress.zipCode}
                  </p>
                  <button
                    onClick={() => setStep('address')}
                    className="text-sm text-primary-600 mt-2"
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {SHIPPING_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      shippingMethod === method.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.value}
                        checked={shippingMethod === method.value}
                        onChange={() => setShippingMethod(method.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                    <span className="font-medium">${method.basePrice.toFixed(2)}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t flex space-x-3">
                <Button variant="outline" onClick={() => setStep('address')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleContinueToPayment} className="flex-1">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && clientSecret && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Payment</h2>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  total={priceBreakdown?.total || 0}
                />
              </Elements>

              <button
                onClick={() => setStep('shipping')}
                className="w-full mt-4 text-center text-gray-600 hover:text-gray-800"
              >
                Back to Shipping
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.design?.thumbnailUrl ? (
                      <img
                        src={item.product.design.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.design?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.product.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    ${(item.product.pricePerUnit * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            {priceBreakdown && (
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${priceBreakdown.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>${priceBreakdown.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${priceBreakdown.tax.toFixed(2)}</span>
                </div>
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${priceBreakdown.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                  <span>Total</span>
                  <span>${priceBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        title="Add New Address"
      >
        <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
      </Modal>
    </div>
  );
}
