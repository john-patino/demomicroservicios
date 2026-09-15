'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OperationLog } from '../types/demo';
import { subscribeToLogs } from '../api/client';

export interface ServiceHealthState {
    userService: boolean;
    productService: boolean;
    orderService: boolean;
    apiGateway: boolean;
}

interface TelemetryContextType {
    lastCorrelationId: string | null;
    lastStatusCode: number | null;
    logs: OperationLog[];
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    addLog: (log: OperationLog) => void;
    clearLogs: () => void;
    seqBaseUrl: string;
    getSeqUrlForCorrelation: (corrId?: string | null) => string;
    serviceHealth: ServiceHealthState;
    refreshHealth: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lastCorrelationId, setLastCorrelationId] = useState<string | null>(null);
    const [lastStatusCode, setLastStatusCode] = useState<number | null>(null);
    const [logs, setLogs] = useState<OperationLog[]>([]);
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [serviceHealth, setServiceHealth] = useState<ServiceHealthState>({
        userService: true,
        productService: true,
        orderService: true,
        apiGateway: true
    });

    const seqBaseUrl = process.env.NEXT_PUBLIC_SEQ_URL || 'http://localhost:5341';
    const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5000/gateway';
    const gatewayRoot = gatewayBaseUrl.replace(/\/gateway\/?$/, '');

    const addLog = (log: OperationLog) => {
        setLogs((prev) => [log, ...prev].slice(0, 100)); // Keep last 100 logs
        if (log.correlationId && log.correlationId !== 'unknown') {
            setLastCorrelationId(log.correlationId);
        }
        if (log.statusCode) {
            setLastStatusCode(log.statusCode);
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const checkServiceHealth = async (url: string): Promise<boolean> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);
            return res.ok;
        } catch {
            return false;
        }
    };

    const refreshHealth = async () => {
        const [u, p, o, g] = await Promise.all([
            checkServiceHealth(`${gatewayBaseUrl}/users/health`),
            checkServiceHealth(`${gatewayBaseUrl}/products/health`),
            checkServiceHealth(`${gatewayBaseUrl}/orders/health`),
            checkServiceHealth(`${gatewayRoot}/health`)
        ]);

        setServiceHealth({
            userService: u,
            productService: p,
            orderService: o,
            apiGateway: g
        });
    };

    useEffect(() => {
        const unsubscribe = subscribeToLogs((incomingLog) => {
            addLog(incomingLog);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        refreshHealth();
        const interval = setInterval(refreshHealth, 4000);
        return () => clearInterval(interval);
    }, [gatewayBaseUrl]);

    const getSeqUrlForCorrelation = (corrId?: string | null) => {
        const targetId = corrId || lastCorrelationId;
        if (!targetId) return `${seqBaseUrl}/#/events?autorefresh=true`;
        const filter = encodeURIComponent(`CorrelationId = '${targetId}'`);
        return `${seqBaseUrl}/#/events?autorefresh=true&filter=${filter}`;
    };

    return (
        <TelemetryContext.Provider
            value={{
                lastCorrelationId,
                lastStatusCode,
                logs,
                isDrawerOpen,
                setDrawerOpen,
                addLog,
                clearLogs,
                seqBaseUrl,
                getSeqUrlForCorrelation,
                serviceHealth,
                refreshHealth
            }}
        >
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error('useTelemetry must be used within a TelemetryProvider');
    }
    return context;
};
