import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCartItems } from "../services/cartService";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cartCount: number;
  refreshCartCount: () => Promise<number>;
  clearCartCount: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshCartCount = async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return 0;
    }

    try {
      const response = await getCartItems();
      const totalCount = response.data.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      setCartCount(totalCount);
      return totalCount;
    } catch (error) {
      console.error("Refresh cart count failed", error);
      setCartCount(0);
      return 0;
    }
  };

  const clearCartCount = () => {
    setCartCount(0);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCartCount();
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{ cartCount, refreshCartCount, clearCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
