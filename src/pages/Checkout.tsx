import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, CreditCard, Wallet, Building2, Edit, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/components/ProductCard';
import { supabase } from "@/integrations/supabase/client";

type Step = 'cart' | 'shipping' | 'payment' | 'confirmation';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface SavedAddress {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  images: string[]; // Array of image paths
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user, setIsAuthModalOpen, setAuthMode } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Free shipping over ₹2000
  const shippingCost = totalPrice > 2000 ? 0 : 99;
  
  // GST is already included in product prices, so no separate tax calculation
  const grandTotal = totalPrice + shippingCost;

  const steps = [
    { id: 'cart', label: 'Review' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirm' },
  ];

  // Convert camelCase to snake_case for database
  const convertToDbFormat = (info: ShippingInfo, setAsDefault = false): Omit<SavedAddress, 'id' | 'created_at'> => ({
    user_id: user?.id,
    first_name: info.firstName,
    last_name: info.lastName,
    email: info.email,
    phone: info.phone,
    address: info.address,
    city: info.city,
    state: info.state,
    zip_code: info.zipCode,
    country: info.country,
    is_default: setAsDefault
  });

  // Convert snake_case to camelCase for component
  const convertToComponentFormat = (dbAddress: SavedAddress): ShippingInfo => ({
    firstName: dbAddress.first_name,
    lastName: dbAddress.last_name,
    email: dbAddress.email,
    phone: dbAddress.phone,
    address: dbAddress.address,
    city: dbAddress.city,
    state: dbAddress.state,
    zipCode: dbAddress.zip_code,
    country: dbAddress.country,
    isDefault: dbAddress.is_default
  });

  // Load saved addresses
  useEffect(() => {
    if (user && currentStep === 'shipping') {
      loadSavedAddresses();
    }
  }, [user, currentStep]);

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    setIsLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setSavedAddresses(data);
        // Convert first address to component format
        const defaultAddress = data.find(addr => addr.is_default) || data[0];
        setShippingInfo(convertToComponentFormat(defaultAddress));
        setIsEditing(false);
        setShowNewAddressForm(false);
      } else {
        setShowNewAddressForm(true);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast({
        title: 'Error loading addresses',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const saveAddress = async (address: ShippingInfo, setAsDefault = false) => {
    if (!user) return;

    try {
      const addressData = convertToDbFormat(address, setAsDefault);

      // If setting as default, first remove default from other addresses
      if (setAsDefault) {
        const { error: resetError } = await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);

        if (resetError) throw resetError;
      }

      // For new addresses, use insert with select to get the created address
      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert([addressData])
        .select();

      if (error) throw error;

      toast({
        title: 'Address saved successfully',
      });

      await loadSavedAddresses();
      setIsEditing(false);
      setShowNewAddressForm(false);
      return data?.[0];
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast({
        title: 'Failed to save address',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleContinueToShipping = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentStep('shipping');
  };

  const handleContinueToPayment = async () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missing = required.filter((field) => !shippingInfo[field as keyof ShippingInfo]);

    if (missing.length > 0) {
      toast({
        title: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Save the current address if it's being edited or is new
    if (isEditing || showNewAddressForm || savedAddresses.length === 0) {
      try {
        await saveAddress(shippingInfo, savedAddresses.length === 0);
      } catch (error) {
        console.error('Failed to save address:', error);
        return;
      }
    }

    setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast({
        title: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // First, save the shipping address if needed
      if (isEditing || showNewAddressForm || savedAddresses.length === 0) {
        await saveAddress(shippingInfo, savedAddresses.length === 0);
      }

      // Prepare shipping address JSON for the order
      const shippingAddressJson = {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
      };

      // FIXED: Prepare order items with proper image handling
      const orderItems = items.map(item => {
        // Ensure images is always an array of strings (image paths from storage)
        let imagesArray: string[] = [];
        
        if (item.product.images && Array.isArray(item.product.images)) {
          // If it's already an array, use it
          imagesArray = item.product.images;
        } else if (typeof item.product.images === 'string') {
          // If it's a string, try to parse it as JSON or use as single image
          try {
            const parsed = JSON.parse(item.product.images);
            imagesArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            imagesArray = [item.product.images];
          }
        } else if (item.product.image_url) {
          // Fallback to image_url field
          imagesArray = [item.product.image_url];
        } else if (item.product.thumbnail) {
          // Fallback to thumbnail field
          imagesArray = [item.product.thumbnail];
        }
        
        // Ensure we only store the image paths (not full URLs)
        // Storage paths should be like 'products/shoe.jpg' not 'https://...'
        const processedImages = imagesArray.map(img => {
          if (typeof img === 'string') {
            // If it's already a path (not a full URL), use it as is
            if (!img.startsWith('http')) {
              return img;
            }
            // If it's a full URL, extract just the path part if it's from Supabase Storage
            const match = img.match(/product-images\/(.+)$/);
            if (match) {
              return match[1]; // Return just the path after 'product-images/'
            }
          }
          return img;
        });

        return {
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          images: processedImages // Array of image paths
        };
      });

      // Create order payload according to your schema
      const orderPayload = {
        user_id: user.id,
        customer_email: shippingInfo.email,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_phone: shippingInfo.phone,
        shipping_address: shippingAddressJson,
        items: orderItems,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        total: grandTotal,
        status: "pending",
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
      };

      console.log("Order payload:", JSON.stringify(orderPayload, null, 2));

      const { error } = await supabase
        .from("orders")
        .insert(orderPayload);

      if (error) {
        console.error("Order failed:", error);
        throw error;
      }

      // Clear cart and move to confirmation
      clearCart();
      setCurrentStep("confirmation");
      
      toast({
        title: 'Order placed successfully!',
        description: 'You will receive a confirmation email shortly.',
      });
    } catch (error: any) {
      console.error("Order placement error:", error);
      toast({
        title: "Order failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrderComplete = () => {
    navigate('/');
    toast({
      title: 'Thank you for your order!',
      description: 'Check your email for order updates.',
    });
  };

  const handleSelectAddress = (address: SavedAddress) => {
    setShippingInfo(convertToComponentFormat(address));
    setIsEditing(false);
    setShowNewAddressForm(false);
  };

  const handleEditAddress = (address: SavedAddress) => {
    setShippingInfo(convertToComponentFormat(address));
    setIsEditing(true);
    setShowNewAddressForm(true);
  };

  const handleAddNewAddress = () => {
    setShippingInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    });
    setIsEditing(false);
    setShowNewAddressForm(true);
  };

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-2xl mb-4">Your bag is empty</h1>
            <button onClick={() => navigate('/products')} className="btn-outline">
              CONTINUE SHOPPING
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthModal />

      <main className="flex-1 bg-cream">
        <div className="container mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    steps.findIndex((s) => s.id === currentStep) >= index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {steps.findIndex((s) => s.id === currentStep) > index ? (
                    <Check size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm hidden sm:block">{step.label}</span>
                {index < steps.length - 1 && (
                  <div className="w-12 sm:w-20 h-px bg-border mx-4" />
                )}
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Cart Review Step */}
            {currentStep === 'cart' && (
              <div className="bg-background p-6 md:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">Review Your Order</h2>

                <div className="space-y-6 mb-8">
                  {items.map((item) => {
                    // Get image URL for display
                    const getImageUrl = () => {
                      if (item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
                        const img = item.product.images[0];
                        if (img.startsWith('http')) return img;
                        return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
                      }
                      if (item.product.image_url) return item.product.image_url;
                      return '/placeholder-image.jpg';
                    };

                    return (
                      <div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        className="flex gap-4 pb-6 border-b border-border"
                      >
                        <img
                          src={getImageUrl()}
                          alt={item.product.name}
                          className="w-20 h-24 object-cover bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Size: {item.size} | Color: {item.color}
                          </p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 border-t border-border pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (GST included)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-semibold pt-3 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <button onClick={handleContinueToShipping} className="w-full btn-primary mt-8">
                  {isAuthenticated ? 'CONTINUE TO SHIPPING' : 'SIGN IN TO CONTINUE'}
                </button>
              </div>
            )}

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="bg-background p-6 md:p-8">
                <button
                  onClick={() => setCurrentStep('cart')}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                  <ChevronLeft size={18} />
                  Back to cart
                </button>

                <h2 className="font-heading text-2xl font-semibold mb-6">Shipping Information</h2>

                {isLoadingAddresses ? (
                  <div className="text-center py-8">Loading addresses...</div>
                ) : (
                  <>
                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <div className="mb-8">
                        <h3 className="font-medium mb-4">Select a saved address</h3>
                        <div className="space-y-4">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id || `${address.phone}-${address.address}`}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                shippingInfo.phone === address.phone && shippingInfo.address === address.address
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleSelectAddress(address)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {address.first_name} {address.last_name}
                                    {address.is_default && (
                                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        Default
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">{address.address}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.city}, {address.state} {address.zip_code}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{address.country}</p>
                                  <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                                  <p className="text-sm text-muted-foreground">Email: {address.email}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress(address);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Edit size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleAddNewAddress}
                          className="flex items-center gap-2 mt-6 text-primary hover:text-primary/80"
                        >
                          <Plus size={18} />
                          Add new address
                        </button>
                      </div>
                    )}

                    {/* Address Form */}
                    {(showNewAddressForm || savedAddresses.length === 0) && (
                      <div>
                        {savedAddresses.length > 0 && (
                          <h3 className="font-medium mb-4">
                            {isEditing ? 'Edit Address' : 'Add New Address'}
                          </h3>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs tracking-wider mb-2">FIRST NAME *</label>
                            <input
                              type="text"
                              value={shippingInfo.firstName}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">LAST NAME *</label>
                            <input
                              type="text"
                              value={shippingInfo.lastName}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">EMAIL *</label>
                            <input
                              type="email"
                              value={shippingInfo.email}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">PHONE *</label>
                            <input
                              type="tel"
                              value={shippingInfo.phone}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs tracking-wider mb-2">ADDRESS *</label>
                            <input
                              type="text"
                              value={shippingInfo.address}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">CITY *</label>
                            <input
                              type="text"
                              value={shippingInfo.city}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">STATE *</label>
                            <input
                              type="text"
                              value={shippingInfo.state}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">ZIP CODE *</label>
                            <input
                              type="text"
                              value={shippingInfo.zipCode}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                              className="input-elegant"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider mb-2">COUNTRY *</label>
                            <select
                              value={shippingInfo.country}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                              className="input-elegant"
                            >
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                          <input
                            type="checkbox"
                            id="setAsDefault"
                            checked={savedAddresses.length === 0}
                            onChange={(e) => {
                              // For new addresses, auto-set as default if it's the first address
                              if (savedAddresses.length === 0) {
                                // Can't uncheck for first address
                              }
                            }}
                            disabled={savedAddresses.length === 0}
                          />
                          <label htmlFor="setAsDefault" className="text-sm">
                            {savedAddresses.length === 0 
                              ? "This will be set as your default address" 
                              : "Set as default address"}
                          </label>
                        </div>

                        {savedAddresses.length > 0 && (
                          <div className="flex gap-4 mt-6">
                            <button
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setIsEditing(false);
                                // Reset to the first saved address
                                if (savedAddresses.length > 0) {
                                  const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
                                  setShippingInfo(convertToComponentFormat(defaultAddress));
                                }
                              }}
                              className="btn-outline"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveAddress(shippingInfo, false)}
                              className="btn-primary"
                              disabled={!shippingInfo.firstName || !shippingInfo.lastName || 
                                       !shippingInfo.email || !shippingInfo.phone || 
                                       !shippingInfo.address || !shippingInfo.city || 
                                       !shippingInfo.state || !shippingInfo.zipCode}
                            >
                              {isEditing ? 'Update Address' : 'Save Address'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {savedAddresses.length === 0 && (
                      <button
                        onClick={handleContinueToPayment}
                        className="w-full btn-primary mt-8"
                        disabled={!shippingInfo.firstName || !shippingInfo.lastName || 
                                 !shippingInfo.email || !shippingInfo.phone || 
                                 !shippingInfo.address || !shippingInfo.city || 
                                 !shippingInfo.state || !shippingInfo.zipCode}
                      >
                        CONTINUE TO PAYMENT
                      </button>
                    )}

                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <button
                        onClick={handleContinueToPayment}
                        className="w-full btn-primary mt-8"
                      >
                        CONTINUE TO PAYMENT
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="bg-background p-6 md:p-8">
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                  <ChevronLeft size={18} />
                  Back to shipping
                </button>

                <h2 className="font-heading text-2xl font-semibold mb-6">Payment Method</h2>

                <div className="space-y-4 mb-8">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center gap-4 p-4 border transition-colors ${
                      paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <CreditCard size={24} />
                    <div className="text-left">
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full flex items-center gap-4 p-4 border transition-colors ${
                      paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Wallet size={24} />
                    <div className="text-left">
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`w-full flex items-center gap-4 p-4 border transition-colors ${
                      paymentMethod === 'netbanking' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Building2 size={24} />
                    <div className="text-left">
                      <p className="font-medium">Net Banking</p>
                      <p className="text-sm text-muted-foreground">All major banks supported</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full flex items-center gap-4 p-4 border transition-colors ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <span className="text-2xl">💵</span>
                    <div className="text-left">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when you receive</p>
                    </div>
                  </button>
                </div>

                {/* Order Summary */}
                <div className="bg-muted p-4 mb-8">
                  <h3 className="font-medium mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.length} items)</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">* GST included in prices</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                      <span>Total</span>
                      <span>{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {isProcessing ? 'PROCESSING...' : 'PLACE ORDER'}
                </button>
              </div>
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirmation' && (
              <div className="bg-background p-6 md:p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={32} className="text-green-600" />
                </div>
                <h2 className="font-heading text-3xl font-semibold mb-4">Order Confirmed!</h2>
                <p className="text-muted-foreground mb-2">
                  Thank you for shopping with SS Fashions.
                </p>
                <p className="text-muted-foreground mb-8">
                  A confirmation email has been sent to {shippingInfo.email}
                </p>

                <div className="bg-muted p-6 text-left mb-8">
                  <h3 className="font-medium mb-4">Delivery Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {shippingInfo.firstName} {shippingInfo.lastName}<br />
                    {shippingInfo.address}<br />
                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                    {shippingInfo.country}<br />
                    Phone: {shippingInfo.phone}
                  </p>
                </div>

                <button onClick={handleOrderComplete} className="btn-primary">
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;