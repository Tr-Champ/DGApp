import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
    cartItems: any[];
    totalPrice: number;
    cartCount: number;
    fetchCart: () => Promise<void>;
    addToCart: (product: any, quantity?: number) => Promise<void>;
    updateQuantity: (product_id: any, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    useEffect(() => {
        if (token) fetchCart();
        else {
            setCartItems([]);
            setTotalPrice(0);
        }
    }, [token]);

    const cartCount = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    }, [cartItems]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/carts/');
            setCartItems(res.data.items || []);
            setTotalPrice(res.data.total_price || 0);
        } catch (e) {
            console.error(e);
        }
    };

    const syncCartWithBackend = async (newItems: any[]) => {
        const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setCartItems(newItems);
        setTotalPrice(newTotal);
        try {
            await api.put('/carts/', { items: newItems, total_price: newTotal });
        } catch (e) {
            console.error(e);
        }
    };

    const addToCart = async (product: any, quantity = 1) => {
        const existingIndex = cartItems.findIndex(i => i.product_id === product.id);
        let updated = [...cartItems];
        if (existingIndex > -1) {
            updated[existingIndex].quantity += quantity;
            updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price;
        } else {
            updated.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity
            });
        }
        await syncCartWithBackend(updated);
    };

    const updateQuantity = async (product_id: any, quantity: number) => {
        let updated = [...cartItems];
        if (quantity <= 0) {
            updated = updated.filter(i => i.product_id !== product_id);
        } else {
            const item = updated.find(i => i.product_id === product_id);
            if (item) {
                item.quantity = quantity;
                item.subtotal = item.price * quantity;
            }
        }
        await syncCartWithBackend(updated);
    };

    const clearCart = async () => {
        try {
            await api.delete('/carts/');
        } catch (e) {
            console.error(e);
        }
        setCartItems([]);
        setTotalPrice(0);
    };

    return (
        <CartContext.Provider value={{ cartItems, totalPrice, cartCount, fetchCart, addToCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);