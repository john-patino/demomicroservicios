'use client';

import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTelemetry } from '../context/TelemetryContext';
import { LogLevel } from '../types/demo';

export const LiveLogDrawer: React.FC = () => {
    const { logs, isDrawerOpen, setDrawerOpen, clearLogs, getSeqUrlForCorrelation } = useTelemetry();
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const levelOptions = [
        { label: 'Todos los Niveles', value: 'ALL' },
        { label: 'INFO', value: 'INFO' },
        { label: 'SUCCESS', value: 'SUCCESS' },
        { label: 'WARN', value: 'WARN' },
        { label: 'ERROR', value: 'ERROR' }
    ];

    const filteredLogs = logs.filter((log) => {
        const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
        const matchesSearch =
            searchTerm === '' ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.correlationId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getSeverity = (level: LogLevel): 'success' | 'info' | 'warning' | 'danger' => {
        switch (level) {
            case 'SUCCESS':
                return 'success';
            case 'INFO':
                return 'info';
            case 'WARN':
                return 'warning';
            case 'ERROR':
                return 'danger';
            default:
                return 'info';
        }
    };

    const customHeader = (
        <div className="flex align-items-center justify-content-between w-full pr-3">
            <div className="flex align-items-center gap-2">
                <i className="pi pi-terminal text-xl text-primary font-bold"></i>
                <span className="font-bold text-lg">Consola de Operaciones en Vivo</span>
                <Tag value={`${logs.length} eventos`} severity="info" rounded></Tag>
            </div>
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-secondary p-button-sm"
                tooltip="Limpiar consola"
                onClick={clearLogs}
                disabled={logs.length === 0}
            />
        </div>
    );

    return (
        <Sidebar
            visible={isDrawerOpen}
            position="right"
            onHide={() => setDrawerOpen(false)}
            header={customHeader}
            style={{ width: '42rem', maxWidth: '100vw' }}
        >
            <div className="flex flex-column h-full">
                {/* Search & Filters */}
                <div className="flex flex-wrap gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                    <Dropdown
                        value={selectedLevel}
                        options={levelOptions}
                        onChange={(e) => setSelectedLevel(e.value)}
                        className="p-inputtext-sm w-12rem"
                    />
                    <span className="p-input-icon-left flex-1">
                        <i className="pi pi-search" />
                        <InputText
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar en logs o CorrelationId..."
                            className="p-inputtext-sm w-full"
                        />
                    </span>
                </div>

                {/* Log Stream Terminal */}
                <div
                    className="flex-1 overflow-y-auto surface-900 border-round p-3 text-white font-monospace text-xs"
                    style={{ minHeight: '300px', backgroundColor: '#1e1e2e' }}
                >
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <i className="pi pi-info-circle text-2xl mb-2"></i>
                            <p>No hay eventos registrados que coincidan con el filtro.</p>
                            <span className="text-xs text-gray-400">
                                Realiza peticiones, agrega productos o efectúa checkout para ver la trazabilidad en vivo.
                            </span>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="mb-3 pb-2 border-bottom-1 border-gray-800 line-height-3"
                                style={{ borderBottomColor: '#2b2b3b' }}
                            >
                                <div className="flex align-items-center justify-content-between mb-1">
                                    <div className="flex align-items-center gap-2">
                                        <span className="text-gray-400">[{log.timestamp}]</span>
                                        <Tag value={log.level} severity={getSeverity(log.level)} style={{ fontSize: '10px', padding: '2px 6px' }} />
                                        <span className="text-blue-300 font-bold">[{log.source}]</span>
                                        {log.statusCode && (
                                            <span className={log.statusCode < 400 ? 'text-green-400' : 'text-orange-400'}>
                                                HTTP {log.statusCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-gray-100 my-1 font-semibold">{log.message}</div>

                                {log.correlationId && log.correlationId !== 'system' && (
                                    <div className="flex align-items-center gap-2 mt-1 surface-800 px-2 py-1 border-round" style={{ backgroundColor: '#282a36' }}>
                                        <span className="text-gray-400">CorrId:</span>
                                        <span className="text-yellow-300 select-all">{log.correlationId}</span>
                                        <Button
                                            icon={copiedId === log.correlationId ? 'pi pi-check text-green-400' : 'pi pi-copy'}
                                            className="p-button-text p-button-secondary p-button-sm py-0 px-1 ml-auto"
                                            tooltip={copiedId === log.correlationId ? '¡Copiado!' : 'Copiar CorrelationId'}
                                            onClick={() => copyToClipboard(log.correlationId)}
                                        />
                                        <a
                                            href={getSeqUrlForCorrelation(log.correlationId)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-button p-button-text p-button-info p-button-sm py-0 px-1 text-xs"
                                            title="Ver traza completa en Seq"
                                        >
                                            <i className="pi pi-external-link mr-1"></i>Seq
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Sidebar>
    );
};
