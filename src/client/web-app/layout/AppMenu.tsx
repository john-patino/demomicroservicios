/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const model: AppMenuItem[] = [
        {
            label: 'E-Commerce Demo',
            items: [
                { label: 'Catálogo de Productos', icon: 'pi pi-fw pi-th-large', to: '/' },
                { label: 'Carrito & Checkout', icon: 'pi pi-fw pi-shopping-cart', to: '/cart' },
                { label: 'Historial de Pedidos', icon: 'pi pi-fw pi-box', to: '/orders' }
            ]
        },
        {
            label: 'Observabilidad & Trazabilidad',
            items: [
                { label: 'Consola de Operaciones', icon: 'pi pi-fw pi-terminal', to: '/logs' },
                { label: 'Servidor Seq (Logs)', icon: 'pi pi-fw pi-external-link', url: 'http://localhost:5341', target: '_blank' }
            ]
        },
        {
            label: 'Arquitectura & Sistema',
            items: [
                { label: 'Visor de Diagramas', icon: 'pi pi-fw pi-sitemap', to: '/diagrams' },
                { label: 'Topología General', icon: 'pi pi-fw pi-server', url: '/diagrams/microservices-architecture-dark.html', target: '_blank' },
                { label: 'Trazabilidad X-Correlation-ID', icon: 'pi pi-fw pi-arrows-h', url: '/diagrams/correlation-id-sequence-dark.html', target: '_blank' },
                { label: 'Despliegue Docker Compose', icon: 'pi pi-fw pi-box', url: '/diagrams/docker-deployment-dark.html', target: '_blank' },
                { label: 'Máquina de Estados Pedidos', icon: 'pi pi-fw pi-sync', url: '/diagrams/order-state-machine-dark.html', target: '_blank' },
                { label: 'Esquema PostgreSQL', icon: 'pi pi-fw pi-database', url: '/diagrams/database-schema-dark.html', target: '_blank' },
                { label: 'Resiliencia & Fallos', icon: 'pi pi-fw pi-shield', url: '/diagrams/resilience-flowchart-dark.html', target: '_blank' }
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
