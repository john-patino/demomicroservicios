'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDemoUser } from '../../../context/DemoUserContext';
import apiClient, { emitLog } from '../../../api/client';
import { Order } from '../../../types/demo';
import Link from 'next/link';

export default function OrdersPage() {
    const { currentUser } = useDemoUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRows, setExpandedRows] = useState<any>(null);

    const fetchOrders = async () => {
        if (!currentUser) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            emitLog('INFO', 'OrderService', `Consultando órdenes para usuario ${currentUser.fullName} (${currentUser.id})`, 'system');
            const response = await apiClient.get<Order[]>(`/orders?userId=${currentUser.id}`);
            setOrders(response.data);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            emitLog('ERROR', 'OrderService', `Error al consultar historial de órdenes: ${error.message}`, 'system');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentUser]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return dateStr;
        }
    };

    const getStatusSeverity = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
        switch (status) {
            case 'Confirmed':
                return 'success';
            case 'Pending':
                return 'warning';
            case 'Cancelled':
                return 'danger';
            default:
                return 'info';
        }
    };

    const rowExpansionTemplate = (data: Order) => {
        return (
            <div className="p-3 surface-50 border-round">
                <h5 className="font-bold text-900 mb-2">Artículos de la Orden #{data.id}</h5>
                <DataTable value={data.items} responsiveLayout="scroll">
                    <Column field="productName" header="Producto" className="font-semibold" />
                    <Column field="unitPrice" header="Precio Unitario" body={(r) => formatCurrency(r.unitPrice)} />
                    <Column field="quantity" header="Cantidad" />
                    <Column
                        field="totalPrice"
                        header="Total"
                        body={(r) => <span className="font-bold text-primary">{formatCurrency(r.totalPrice)}</span>}
                    />
                </DataTable>
            </div>
        );
    };

    return (
        <div className="surface-ground">
            <div className="surface-card p-4 shadow-2 border-round mb-4 flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <div className="text-3xl font-bold text-900 mb-1">📦 Historial de Pedidos</div>
                    <span className="text-600">
                        {currentUser
                            ? `Visualizando órdenes del usuario activo: ${currentUser.fullName} (${currentUser.email})`
                            : 'Selecciona un usuario demo en la barra superior'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button icon="pi pi-refresh" label="Actualizar" className="p-button-outlined p-button-sm" onClick={fetchOrders} loading={loading} />
                    <Link href="/">
                        <Button icon="pi pi-plus" label="Nuevo Pedido" className="p-button-primary p-button-sm" />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="surface-card p-6 shadow-2 border-round text-center">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                    <div className="mt-3 text-color-secondary font-medium">Cargando órdenes desde OrderService...</div>
                </div>
            ) : orders.length === 0 ? (
                <div className="surface-card p-6 shadow-2 border-round text-center">
                    <i className="pi pi-inbox text-6xl text-400 mb-3 block"></i>
                    <div className="text-2xl font-bold text-900 mb-2">No tienes órdenes registradas</div>
                    <p className="text-600 mb-4">Aún no se han emitido pedidos para este perfil de usuario.</p>
                    <Link href="/">
                        <Button label="Ir al Catálogo" icon="pi pi-th-large" className="p-button-primary" />
                    </Link>
                </div>
            ) : (
                <div className="surface-card p-4 shadow-2 border-round">
                    <DataTable
                        value={orders}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="id"
                        responsiveLayout="scroll"
                        paginator
                        rows={10}
                    >
                        <Column expander style={{ width: '3rem' }} />
                        <Column
                            field="id"
                            header="ID de Orden"
                            body={(r) => (
                                <span className="font-monospace text-sm font-semibold select-all">
                                    {r.id.substring(0, 13)}...
                                </span>
                            )}
                        />
                        <Column field="createdAt" header="Fecha de Emisión" body={(r) => formatDate(r.createdAt)} />
                        <Column
                            field="items.length"
                            header="Ítems"
                            body={(r) => `${r.items?.length || 0} producto(s)`}
                        />
                        <Column
                            field="totalAmount"
                            header="Total"
                            body={(r) => <span className="font-bold text-lg text-primary">{formatCurrency(r.totalAmount)}</span>}
                        />
                        <Column
                            field="status"
                            header="Estado"
                            body={(r) => <Tag value={r.status} severity={getStatusSeverity(r.status)} rounded />}
                        />
                    </DataTable>
                </div>
            )}
        </div>
    );
}
