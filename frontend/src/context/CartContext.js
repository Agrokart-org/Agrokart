import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const CartContext = createContext();

// Local storage key for cart persistence
const CART_STORAGE_KEY = 'agrokart_cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validate the cart is an array
        if (Array.isArray(parsedCart)) {
          return parsedCart;
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      // Check if product already exists in cart
      const existingItemIndex = prevCart.findIndex(
        item => (item._id || item.id) === (product._id || product.id)
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      }

      // Create a new cart item with a unique ID
      const newItem = {
        ...product,
        quantity,
        cartItemId: `${product._id || product.id}-${Date.now()}`,
        id: product._id || product.id
      };
      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      let price = 0;
      if (typeof item.price === 'number') {
        price = item.price;
      } else if (typeof item.price === 'string') {
        const cleanPrice = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleanPrice);
      }

      if (isNaN(price)) price = 0;

      return total + (price * item.quantity);
    }, 0);
  };

  const clearCart = () => {
    setCart([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  const value = {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;