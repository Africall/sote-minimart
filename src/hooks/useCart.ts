
import { useCart as useCartContext } from '@/contexts/CartContext';
import { useCartActions } from './useCartActions';

export const useCart = () => {
  const cartContext = useCartContext();
  const cartActions = useCartActions();

  return {
    ...cartContext,
    ...cartActions,
  };
};
