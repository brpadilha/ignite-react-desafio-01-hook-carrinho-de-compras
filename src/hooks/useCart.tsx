import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage
    const storageCart = window.localStorage.getItem("@RocketShoes:cart");
    if (storageCart) {
      return JSON.parse(storageCart);
    }
    
    return [];
  });
  
  
  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productExistsOnCart = cart.find(product => product.id === productId)

      if (productExistsOnCart) {
        const { amount: productAmount } = productExistsOnCart
        
        const { data: stock } = await api.get<Stock>(`stock/${productId}`)
        
        const productIsAvailableInStock = stock.amount > productAmount;

        if (!productIsAvailableInStock) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        const updateAmountCart = cart.map(product => {
          return product.id === productId ? { ...product, amount: productAmount + 1 } : product
        });

        setCart(updateAmountCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateAmountCart));
        return
      }
      const {data: product} = await api.get<Product>('/products/' + productId)
      const newCartWithNewProduct = [...cart, {...product, amount: 1}]
      setCart(newCartWithNewProduct)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartWithNewProduct))
      
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productExistsOnCart = cart.find(product => product.id === productId)
      console.log(productExistsOnCart)
      if (!productExistsOnCart) throw Error()

      const newCart = cart.filter(product => product.id !== productId)
      
      setCart(newCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount < 1) return;

      const {data: stockProduct} = await api.get<Stock>(`stock/${productId}`)
      
      const hasProductOnStock = stockProduct.amount >= amount

      if (!hasProductOnStock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const productExistsOnCart = cart.find(product => product.id === productId)

      if (!productExistsOnCart) throw Error();

      const newCartUpdated = cart.map(product => {
        return product.id === productId ? {
          ...product, amount
        } : product
      })

      setCart(newCartUpdated)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartUpdated))
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
