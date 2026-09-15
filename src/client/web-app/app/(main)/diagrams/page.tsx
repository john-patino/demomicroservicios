'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

interface DiagramInfo {
    id: string;
    title: string;
    category: string;
    file: string;
    description: string;
    badgeSeverity: 'info' | 'success' | 'warning' | 'danger';
    icon: string;
}

const DIAGRAMS: DiagramInfo[] = [
    {
        id: 'arch',
        title: '01. Topología General de Microservicios',
        category: 'Architecture Diagram',
        file: '/diagrams/microservices-architecture-dark.html',
        description: 'Mapeo completo de borde: Cliente React, YARP API Gateway, Microservicios de dominio (.NET 8), bases de datos PostgreSQL aisladas y sumidero de Seq.',
        badgeSeverity: 'info',
        icon: 'pi pi-server'
    },
    {
        id: 'seq',
        title: '02. Propagación de X-Correlation-ID',
        category: 'Sequence Diagram',
        file: '/diagrams/correlation-id-sequence-dark.html',
        description: 'Trazabilidad distribuida desde la emisión del UUID v4 en el navegador, paso por middlewares Serilog, HTTP delegators y correlación en Seq.',
        badgeSeverity: 'success',
        icon: 'pi pi-arrows-h'
    },
    {
        id: 'deploy',
        title: '03. Despliegue de Red Docker Compose',
        category: 'Deployment Diagram',
        file: '/diagrams/docker-deployment-dark.html',
        description: 'Aislamiento de la red virtual microservices-net, mapeo de puertos host vs puertos internos, y persistencia en volúmenes Docker.',
        badgeSeverity: 'warning',
        icon: 'pi pi-box'
    },
    {
        id: 'state',
        title: '04. Máquina de Estados del Pedido',
        category: 'State Machine Diagram',
        file: '/diagrams/order-state-machine-dark.html',
        description: 'Ciclo de vida transaccional de una orden (Draft → Placed → Processing → Completed / Cancelled) con eventos de compensación.',
        badgeSeverity: 'info',
        icon: 'pi pi-sync'
    },
    {
        id: 'db',
        title: '05. Esquema Físico Database-per-Service',
        category: 'Database Schema Diagram',
        file: '/diagrams/database-schema-dark.html',
        description: 'Modelo relacional de datos por servicio (UsersDb, ProductsDb, OrdersDb), claves primarias UUID y desacoplamiento de llaves foráneas.',
        badgeSeverity: 'success',
        icon: 'pi pi-database'
    },
    {
        id: 'resilience',
        title: '06. Lógica de Resiliencia y Circuit Breaker',
        category: 'Flowchart Diagram',
        file: '/diagrams/resilience-flowchart-dark.html',
        description: 'Flujo de decisión de YARP API Gateway ante peticiones entrantes, sondeos activos a /health, conmutación de circuito y respuesta RFC 7807.',
        badgeSeverity: 'danger',
        icon: 'pi pi-shield'
    }
];

export default function DiagramsViewerPage() {
    const [selectedDiagram, setSelectedDiagram] = useState<DiagramInfo>(DIAGRAMS[0]);

    return (
        <div className="surface-ground">
            {/* Header */}
            <div className="surface-card p-4 shadow-2 border-round mb-4">
                <div className="flex flex-column md:flex-row justify-content-between md:align-items-center gap-3">
                    <div>
                        <div className="text-3xl font-bold text-900 mb-2">🏛️ Visor de Diagramas de Arquitectura</div>
                        <span className="text-600">
                            Colección visual de diagramas técnicos interactivos en modo oscuro según el estándar formal de arquitectura.
                        </span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <a href="/diagrams/index.html" target="_blank" rel="noopener noreferrer">
                            <Button
                                icon="pi pi-external-link"
                                label="Portal Hub Externo"
                                className="p-button-outlined p-button-secondary p-button-sm"
                            />
                        </a>
                        <a href={selectedDiagram.file} target="_blank" rel="noopener noreferrer">
                            <Button
                                icon="pi pi-window-maximize"
                                label="Maximizar Diagrama Actual"
                                className="p-button-primary p-button-sm"
                            />
                        </a>
                    </div>
                </div>
            </div>

            {/* Selector Grid */}
            <div className="grid mb-4">
                {DIAGRAMS.map((diag) => {
                    const isSelected = selectedDiagram.id === diag.id;
                    return (
                        <div key={diag.id} className="col-12 md:col-4 lg:col-2 p-2">
                            <div
                                onClick={() => setSelectedDiagram(diag)}
                                className={`p-3 border-round cursor-pointer transition-all transition-duration-200 h-full flex flex-column justify-content-between ${
                                    isSelected
                                        ? 'surface-card border-2 border-primary shadow-3'
                                        : 'surface-card border-1 border-200 hover:surface-hover shadow-1'
                                }`}
                            >
                                <div>
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <i className={`${diag.icon} text-xl ${isSelected ? 'text-primary' : 'text-500'}`}></i>
                                        <Tag severity={diag.badgeSeverity} value={diag.id.toUpperCase()} />
                                    </div>
                                    <div className="font-bold text-sm text-900 mb-1">{diag.title.split('. ')[1]}</div>
                                </div>
                                <span className="text-xs text-500 mt-2">{diag.category}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Diagram Details */}
            <div className="surface-card p-3 border-round shadow-1 mb-3 flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-2">
                <div className="flex align-items-center gap-3">
                    <Tag severity={selectedDiagram.badgeSeverity} value={selectedDiagram.category} />
                    <span className="font-bold text-lg text-900">{selectedDiagram.title}</span>
                </div>
                <div className="text-600 text-sm max-w-30rem">
                    {selectedDiagram.description}
                </div>
            </div>

            {/* Diagram Frame */}
            <div className="surface-card p-2 border-round shadow-2 overflow-hidden" style={{ minHeight: '800px' }}>
                <iframe
                    key={selectedDiagram.file}
                    src={selectedDiagram.file}
                    title={selectedDiagram.title}
                    style={{
                        width: '100%',
                        height: '820px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#0a0d14'
                    }}
                />
            </div>
        </div>
    );
}
