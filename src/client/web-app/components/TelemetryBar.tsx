'use client';

import React, { useState } from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useTelemetry } from '../context/TelemetryContext';
import { useDemoUser } from '../context/DemoUserContext';

export const TelemetryBar: React.FC = () => {
    const { lastCorrelationId, lastStatusCode, setDrawerOpen, getSeqUrlForCorrelation, serviceHealth } = useTelemetry();
    const { currentUser } = useDemoUser();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (lastCorrelationId) {
            navigator.clipboard.writeText(lastCorrelationId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getStatusSeverity = (status: number | null): 'success' | 'warning' | 'danger' | 'info' => {
        if (!status) return 'info';
        if (status >= 200 && status < 300) return 'success';
        if (status >= 400 && status < 500) return 'warning';
        return 'danger';
    };

    return (
        <div
            className="flex flex-wrap align-items-center justify-content-between px-4 py-2 surface-card border-top-1 surface-border shadow-2 w-full gap-2"
            style={{ fontSize: '0.85rem' }}
        >
            {/* Status, User & Live Health Indicators */}
            <div className="flex align-items-center flex-wrap gap-3">
                <div className="flex align-items-center gap-2">
                    <span className="font-semibold text-color-secondary">Estado API:</span>
                    <Tag
                        value={lastStatusCode ? `HTTP ${lastStatusCode}` : 'IDLE / LISTO'}
                        severity={getStatusSeverity(lastStatusCode)}
                    />
                </div>

                <span className="text-300">|</span>

                {/* Microservices Live Health Indicators */}
                <div className="flex align-items-center gap-2">
                    <span className="font-semibold text-color-secondary" title="Sondas de salud HTTP autónomas">Salud:</span>
                    <span
                        className={`inline-flex align-items-center px-2 py-1 border-round text-xs font-semibold ${
                            serviceHealth.apiGateway ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        title={serviceHealth.apiGateway ? 'YARP Gateway: Saludable' : 'YARP Gateway: No disponible'}
                    >
                        <i className={`pi pi-circle-fill mr-1 text-xs ${serviceHealth.apiGateway ? 'text-green-500' : 'text-red-500'}`}></i>
                        Gateway
                    </span>
                    <span
                        className={`inline-flex align-items-center px-2 py-1 border-round text-xs font-semibold ${
                            serviceHealth.userService ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        title={serviceHealth.userService ? 'UserService: Saludable' : 'UserService: No disponible'}
                    >
                        <i className={`pi pi-circle-fill mr-1 text-xs ${serviceHealth.userService ? 'text-green-500' : 'text-red-500'}`}></i>
                        Users
                    </span>
                    <span
                        className={`inline-flex align-items-center px-2 py-1 border-round text-xs font-semibold ${
                            serviceHealth.productService ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        title={serviceHealth.productService ? 'ProductService: Saludable' : 'ProductService: No disponible'}
                    >
                        <i className={`pi pi-circle-fill mr-1 text-xs ${serviceHealth.productService ? 'text-green-500' : 'text-red-500'}`}></i>
                        Products
                    </span>
                    <span
                        className={`inline-flex align-items-center px-2 py-1 border-round text-xs font-semibold ${
                            serviceHealth.orderService ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        title={serviceHealth.orderService ? 'OrderService: Saludable' : 'OrderService: No disponible'}
                    >
                        <i className={`pi pi-circle-fill mr-1 text-xs ${serviceHealth.orderService ? 'text-green-500' : 'text-red-500'}`}></i>
                        Orders
                    </span>
                </div>

                <span className="text-300">|</span>

                <div className="flex align-items-center gap-2">
                    <i className="pi pi-user text-primary"></i>
                    <span className="font-medium text-color">
                        {currentUser ? currentUser.fullName : 'Sin usuario'}
                    </span>
                </div>
            </div>

            {/* Correlation ID & Tracing Action */}
            <div className="flex align-items-center flex-wrap gap-3">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-sitemap text-blue-500"></i>
                    <span className="font-bold text-color-secondary">X-Correlation-ID:</span>
                    <span className="font-monospace text-primary select-all">
                        {lastCorrelationId || 'Esperando primera petición...'}
                    </span>

                    {lastCorrelationId && (
                        <Button
                            icon={copied ? 'pi pi-check text-green-500' : 'pi pi-copy'}
                            className="p-button-text p-button-sm p-button-secondary py-0 px-2"
                            tooltip={copied ? '¡Copiado!' : 'Copiar Correlation ID'}
                            onClick={handleCopy}
                        />
                    )}
                </div>

                <a
                    href={getSeqUrlForCorrelation(lastCorrelationId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-button p-button-outlined p-button-sm p-button-info py-1 px-3"
                    title="Abrir Seq con streaming y auto-refresh activo"
                >
                    <i className="pi pi-search-plus mr-2"></i>Ver en Seq (Streaming)
                </a>

                <Button
                    icon="pi pi-terminal"
                    label="Logs en Vivo"
                    className="p-button-sm p-button-secondary py-1 px-3"
                    onClick={() => setDrawerOpen(true)}
                />
            </div>
        </div>
    );
};
