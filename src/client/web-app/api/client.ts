import axios from 'axios';
import { OperationLog, LogLevel } from '../types/demo';

const BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5000/gateway';

type LogListener = (log: OperationLog) => void;
const listeners: Set<LogListener> = new Set();

export const subscribeToLogs = (listener: LogListener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const emitLog = (
    level: LogLevel,
    source: string,
    message: string,
    correlationId: string,
    statusCode?: number,
    details?: any
) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const log: OperationLog = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        timestamp,
        level,
        source,
        correlationId,
        message,
        statusCode,
        details
    };

    listeners.forEach((fn) => fn(log));
};

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 20000
});

apiClient.interceptors.request.use(
    (config) => {
        const correlationId =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : 'corr-' + Math.random().toString(36).substring(2, 15);

        config.headers['X-Correlation-ID'] = correlationId;

        const method = (config.method || 'GET').toUpperCase();
        const url = config.url || '';
        emitLog('INFO', 'Client', `Iniciando petición HTTP ${method} ${url}`, correlationId, undefined, config.data);

        return config;
    },
    (error) => {
        const correlationId = error.config?.headers?.['X-Correlation-ID'] || 'unknown';
        emitLog('ERROR', 'Client', `Error al configurar la petición: ${error.message}`, correlationId);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        const correlationId =
            response.headers['x-correlation-id'] ||
            response.config.headers['X-Correlation-ID'] ||
            'unknown';

        const method = (response.config.method || 'GET').toUpperCase();
        const url = response.config.url || '';
        const status = response.status;

        emitLog(
            'SUCCESS',
            'Gateway',
            `Respuesta exitosa HTTP ${status} desde ${method} ${url}`,
            correlationId,
            status,
            response.data
        );

        return response;
    },
    (error) => {
        const correlationId =
            error.response?.headers?.['x-correlation-id'] ||
            error.config?.headers?.['X-Correlation-ID'] ||
            'unknown';

        const method = (error.config?.method || 'GET').toUpperCase();
        const url = error.config?.url || '';
        const status = error.response?.status;
        const detail = error.response?.data?.detail || error.response?.data?.title || error.message;

        const level: LogLevel = status === 409 ? 'WARN' : 'ERROR';
        const msg = status === 409
            ? `Conflicto HTTP 409 en ${method} ${url}: ${detail}`
            : `Fallo HTTP ${status || 'NET_ERR'} en ${method} ${url}: ${detail}`;

        emitLog(level, 'Gateway', msg, correlationId, status, error.response?.data);

        return Promise.reject(error);
    }
);

export default apiClient;
