'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types/demo';
import { emitLog } from '../api/client';

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('demo_cart');
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch {
                    // ignore parse error
                }
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('demo_cart', JSON.stringify(items));
        }
    }, [items]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                const newQty = Math.min(existing.quantity + quantity, product.stock);
                emitLog('INFO', 'Cart', `Incrementada cantidad de "${product.name}" a ${newQty} en carrito`, 'system');
                return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty } : i));
            }
            const initialQty = Math.min(quantity, product.stock);
            emitLog('INFO', 'Cart', `Producto "${product.name}" agregado al carrito (cant: ${initialQty})`, 'system');
            return [...prev, { product, quantity: initialQty }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems((prev) => {
            const item = prev.find((i) => i.product.id === productId);
            if (item) {
                emitLog('INFO', 'Cart', `Producto "${item.product.name}" removido del carrito`, 'system');
            }
            return prev.filter((i) => i.product.id !== productId);
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setItems((prev) =>
            prev.map((i) => {
                if (i.product.id === productId) {
                    const validQty = Math.min(quantity, i.product.stock);
                    return { ...i, quantity: validQty };
                }
                return i;
            })
        );
    };

    const clearCart = () => {
        setItems([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('demo_cart');
        }
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalAmount
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
