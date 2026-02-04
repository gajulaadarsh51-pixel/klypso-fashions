import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from './ProductCard';

const CartDrawer = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalPrice,
  } = useCart();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ HARD FIX: CLOSE CART ON ANY ROUTE CHANGE
  useEffect(() => {
    if (isCartOpen) {
      setIsCartOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-primary/40 z-50 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-background z-50 shadow-2xl animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <h2 className="font-heading text-lg sm:text-xl font-semibold">
              Shopping Bag ({items.length})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:text-gold transition-colors -mr-2"
              aria-label="Close cart"
            >
              <X size={24} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Your bag is empty</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/products');
                  }}
                  className="btn-outline text-xs"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex gap-3 sm:gap-4"
                  >
                    <img
                      src={item.product.images?.[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-20 h-24 sm:w-24 sm:h-32 object-cover bg-muted rounded-md"
                    />

                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Size: {item.size} | Color: {item.color}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.size,
                              item.color
                            )
                          }
                          className="p-1.5 hover:text-destructive transition-colors flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>

                          <span className="px-3 text-sm font-medium">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                            className="p-2 hover:bg-muted transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="font-semibold text-sm sm:text-base">
                          {formatPrice(
                            item.product.price * item.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 sm:p-6 space-y-3 sm:space-y-4 bg-background">
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>

              <button
                onClick={handleCheckout}
                className="w-full btn-primary py-3.5 text-sm sm:text-base"
              >
                CHECKOUT
              </button>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/products');
                }}
                className="w-full btn-outline py-3"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;