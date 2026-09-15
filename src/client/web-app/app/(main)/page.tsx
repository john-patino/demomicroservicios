/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import apiClient, { emitLog } from '../../api/client';
import { Product } from '../../types/demo';
import { useCart } from '../../context/CartContext';
import { useDemoUser } from '../../context/DemoUserContext';
import Link from 'next/link';

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { addToCart, totalItems } = useCart();
    const { currentUser } = useDemoUser();
    const toast = useRef<Toast>(null);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            emitLog('INFO', 'Catalog', 'Consultando catálogo de productos desde /gateway/products', 'system');
            const response = await apiClient.get<Product[]>('/products');
            setProducts(response.data);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Error de conexión con el Gateway';
            setError(errorMsg);
            emitLog('ERROR', 'Catalog', `Fallo al cargar catálogo: ${errorMsg}`, 'system');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        toast.current?.show({
            severity: 'success',
            summary: 'Agregado al Carrito',
            detail: `${product.name} añadido exitosamente`,
            life: 2500
        });
    };

    const getStockSeverity = (stock: number): 'success' | 'warning' | 'danger' => {
        if (stock > 5) return 'success';
        if (stock > 0) return 'warning';
        return 'danger';
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="surface-ground">
            <Toast ref={toast} />

            {/* Header Hero Banner */}
            <div className="surface-card p-4 shadow-2 border-round mb-4">
                <div className="flex flex-column md:flex-row justify-content-between md:align-items-center gap-3">
                    <div>
                        <div className="text-3xl font-bold text-900 mb-2">🛍️ Catálogo de Productos</div>
                        <span className="text-600">
                            Inventario en tiempo real sincronizado con <span className="font-semibold text-primary">ProductService</span> a través del <span className="font-semibold">API Gateway</span>.
                        </span>
                    </div>

                    <div className="flex align-items-center gap-3">
                        <Link href="/diagrams">
                            <Button
                                icon="pi pi-sitemap"
                                label="Diagramas de Arquitectura"
                                className="p-button-outlined p-button-info p-button-sm"
                                tooltip="Explorar diagramas interactivos del sistema"
                            />
                        </Link>
                        <Button
                            icon="pi pi-refresh"
                            label="Actualizar Stock"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={fetchProducts}
                            loading={loading}
                        />
                        <Link href="/cart">
                            <Button
                                icon="pi pi-shopping-cart"
                                label={`Ver Carrito (${totalItems})`}
                                className="p-button-primary p-button-sm"
                            />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-red-50 border-round border-1 border-red-200 mb-4 flex align-items-center justify-content-between">
                    <div className="flex align-items-center gap-3 text-red-700">
                        <i className="pi pi-exclamation-triangle text-2xl"></i>
                        <div>
                            <div className="font-bold">No se pudo cargar el catálogo</div>
                            <div className="text-sm">{error}. Asegúrate de que el API Gateway (:5000) y ProductService estén en ejecución.</div>
                        </div>
                    </div>
                    <Button label="Reintentar" icon="pi pi-replay" className="p-button-danger p-button-sm" onClick={fetchProducts} />
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="flex flex-column align-items-center justify-content-center py-8">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                    <span className="mt-3 text-color-secondary font-medium">Consultando catálogo vía YARP API Gateway...</span>
                </div>
            ) : (
                /* Products Grid */
                <div className="grid">
                    {products.map((product) => (
                        <div key={product.id} className="col-12 md:col-6 lg:col-4 p-3">
                            <div className="surface-card p-4 shadow-2 border-round flex flex-column justify-content-between h-full hover:shadow-4 transition-duration-200">
                                <div>
                                    {/* Product Image */}
                                    <div className="w-full text-center mb-3 overflow-hidden border-round surface-100 flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                        <img
                                            src={product.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60'}
                                            alt={product.name}
                                            className="w-full h-full"
                                            style={{ objectFit: 'cover' }}
                                            onError={(e: any) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60';
                                            }}
                                        />
                                    </div>

                                    {/* SKU and Stock Tags */}
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="text-xs text-500 font-bold tracking-wider">{product.sku}</span>
                                        <Tag
                                            value={product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
                                            severity={getStockSeverity(product.stock)}
                                            rounded
                                        />
                                    </div>

                                    {/* Name & Description */}
                                    <h3 className="text-xl font-bold text-900 mb-2 line-height-2">{product.name}</h3>
                                    <p className="text-600 text-sm mb-4 line-clamp-2" style={{ minHeight: '2.8rem' }}>
                                        {product.description}
                                    </p>
                                </div>

                                {/* Price and Action Button */}
                                <div className="border-top-1 surface-border pt-3 flex justify-content-between align-items-center mt-auto">
                                    <div>
                                        <span className="text-xs text-color-secondary block">Precio</span>
                                        <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
                                    </div>

                                    <Button
                                        icon="pi pi-shopping-cart"
                                        label={product.stock > 0 ? 'Agregar' : 'Agotado'}
                                        disabled={product.stock <= 0}
                                        className={product.stock > 0 ? 'p-button-primary' : 'p-button-secondary'}
                                        onClick={() => handleAddToCart(product)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
