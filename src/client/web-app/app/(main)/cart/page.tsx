/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { useCart } from '../../../context/CartContext';
import { useDemoUser } from '../../../context/DemoUserContext';
import apiClient, { emitLog } from '../../../api/client';
import { Order } from '../../../types/demo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
    const { currentUser } = useDemoUser();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const handleCheckout = async () => {
        if (!currentUser) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Usuario Requerido',
                detail: 'Debes seleccionar un usuario demo en la barra superior para proceder.',
                life: 3000
            });
            return;
        }

        if (items.length === 0) {
            toast.current?.show({
                severity: 'info',
                summary: 'Carrito Vacío',
                detail: 'Agrega al menos un producto al carrito antes de realizar el pedido.',
                life: 2500
            });
            return;
        }

        setSubmitting(true);
        const orderPayload = {
            userId: currentUser.id,
            items: items.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity
            }))
        };

        try {
            emitLog(
                'INFO',
                'OrderService',
                `Iniciando orquestación de checkout para ${currentUser.fullName} (${items.length} ítems)...`,
                'system',
                undefined,
                orderPayload
            );

            const response = await apiClient.post<Order>('/orders', orderPayload);
            const createdOrder = response.data;

            setLastCreatedOrder(createdOrder);
            clearCart();

            toast.current?.show({
                severity: 'success',
                summary: '¡Orden Confirmada!',
                detail: `Orden #${createdOrder.id.substring(0, 8)}... procesada exitosamente con estado ${createdOrder.status}`,
                life: 5000
            });
        } catch (err: any) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail || err.response?.data?.title || err.message;

            if (status === 409) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Conflicto de Inventario (409)',
                    detail: `${detail}. Se ha ejecutado el rollback compensatorio automático en ProductService.`,
                    life: 6000
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: `Error en Pedido (${status || 'Network'})`,
                    detail: detail,
                    life: 5000
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const imageBodyTemplate = (rowData: any) => {
        return (
            <img
                src={rowData.product.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60'}
                alt={rowData.product.name}
                className="w-4rem h-4rem shadow-2 border-round"
                style={{ objectFit: 'cover' }}
            />
        );
    };

    const quantityBodyTemplate = (rowData: any) => {
        return (
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-minus"
                    className="p-button-rounded p-button-text p-button-sm"
                    onClick={() => updateQuantity(rowData.product.id, rowData.quantity - 1)}
                />
                <span className="font-bold px-2">{rowData.quantity}</span>
                <Button
                    icon="pi pi-plus"
                    className="p-button-rounded p-button-text p-button-sm"
                    disabled={rowData.quantity >= rowData.product.stock}
                    onClick={() => updateQuantity(rowData.product.id, rowData.quantity + 1)}
                />
                <span className="text-xs text-500 ml-1">/ max {rowData.product.stock}</span>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-danger p-button-sm"
                onClick={() => removeFromCart(rowData.product.id)}
            />
        );
    };

    return (
        <div className="surface-ground">
            <Toast ref={toast} />

            <div className="surface-card p-4 shadow-2 border-round mb-4">
                <div className="flex justify-content-between align-items-center">
                    <div>
                        <div className="text-3xl font-bold text-900 mb-1">🛒 Carrito & Checkout Síncrono</div>
                        <span className="text-600">
                            Orquestación distribuida con deducción atómica de inventario y rollback de compensación automático.
                        </span>
                    </div>
                    <Link href="/">
                        <Button label="Seguir Comprando" icon="pi pi-arrow-left" className="p-button-outlined p-button-sm" />
                    </Link>
                </div>
            </div>

            {/* Success Banner if an order was just completed */}
            {lastCreatedOrder && (
                <div className="surface-card p-4 shadow-2 border-round border-left-3 border-green-500 mb-4 bg-green-50">
                    <div className="flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <div className="text-green-800 font-bold text-lg mb-1">
                                <i className="pi pi-check-circle mr-2 text-xl"></i>
                                ¡Pedido realizado y confirmado exitosamente!
                            </div>
                            <div className="text-green-700 text-sm">
                                ID de Orden: <span className="font-monospace font-bold">{lastCreatedOrder.id}</span> — Total: <span className="font-bold">{formatCurrency(lastCreatedOrder.totalAmount)}</span>
                            </div>
                        </div>
                        <Button
                            label="Ver en Mis Pedidos"
                            icon="pi pi-box"
                            className="p-button-success p-button-sm"
                            onClick={() => router.push('/orders')}
                        />
                    </div>
                </div>
            )}

            {items.length === 0 && !lastCreatedOrder ? (
                <div className="surface-card p-6 shadow-2 border-round text-center">
                    <i className="pi pi-shopping-cart text-6xl text-400 mb-3 block"></i>
                    <div className="text-2xl font-bold text-900 mb-2">Tu carrito está vacío</div>
                    <p className="text-600 mb-4">Explora nuestro catálogo de productos y agrega artículos para probar la orquestación.</p>
                    <Link href="/">
                        <Button label="Explorar Catálogo" icon="pi pi-th-large" className="p-button-primary" />
                    </Link>
                </div>
            ) : items.length > 0 ? (
                <div className="grid">
                    {/* Cart Items Table */}
                    <div className="col-12 lg:col-8">
                        <div className="surface-card p-4 shadow-2 border-round">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <h4 className="text-xl font-bold m-0 text-900">Productos en Carrito ({totalItems})</h4>
                                <Button
                                    label="Vaciar Carrito"
                                    icon="pi pi-trash"
                                    className="p-button-text p-button-danger p-button-sm"
                                    onClick={clearCart}
                                />
                            </div>

                            <DataTable value={items} responsiveLayout="scroll">
                                <Column body={imageBodyTemplate} header="Imagen" style={{ width: '5rem' }} />
                                <Column
                                    field="product.name"
                                    header="Producto"
                                    body={(r) => (
                                        <div>
                                            <div className="font-bold text-900">{r.product.name}</div>
                                            <div className="text-xs text-500">{r.product.sku}</div>
                                        </div>
                                    )}
                                />
                                <Column
                                    field="product.price"
                                    header="Precio Unit."
                                    body={(r) => formatCurrency(r.product.price)}
                                />
                                <Column header="Cantidad" body={quantityBodyTemplate} />
                                <Column
                                    header="Subtotal"
                                    body={(r) => (
                                        <span className="font-bold text-primary">
                                            {formatCurrency(r.product.price * r.quantity)}
                                        </span>
                                    )}
                                />
                                <Column body={actionBodyTemplate} style={{ width: '3rem' }} />
                            </DataTable>
                        </div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="col-12 lg:col-4">
                        <div className="surface-card p-4 shadow-2 border-round">
                            <h4 className="text-xl font-bold mb-3 text-900">Resumen del Pedido</h4>

                            {/* User details */}
                            <div className="p-3 surface-100 border-round mb-3">
                                <span className="text-xs text-500 font-bold block mb-1">COMPRADOR ACTIVO:</span>
                                {currentUser ? (
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-user text-primary text-xl"></i>
                                        <div>
                                            <div className="font-bold text-900 text-sm">{currentUser.fullName}</div>
                                            <div className="text-xs text-600">{currentUser.email}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-red-500 text-sm">Selecciona un usuario en la barra superior</span>
                                )}
                            </div>

                            <div className="flex justify-content-between mb-2">
                                <span className="text-600">Subtotal</span>
                                <span className="font-semibold text-900">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-content-between mb-3">
                                <span className="text-600">Impuestos (0%)</span>
                                <span className="font-semibold text-900">$0.00</span>
                            </div>

                            <Divider />

                            <div className="flex justify-content-between mb-4">
                                <span className="text-xl font-bold text-900">Total a Pagar</span>
                                <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                            </div>

                            <Button
                                label="Confirmar y Realizar Pedido"
                                icon="pi pi-check"
                                className="p-button-primary w-full p-3 text-lg font-bold"
                                loading={submitting}
                                disabled={submitting || !currentUser || items.length === 0}
                                onClick={handleCheckout}
                            />

                            <div className="mt-3 text-center text-xs text-500 line-height-2">
                                <i className="pi pi-shield mr-1 text-green-500"></i>
                                Transacción protegida con rollback compensatorio en caso de fallo de inventario.
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
