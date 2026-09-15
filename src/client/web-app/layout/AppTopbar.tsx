/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { useDemoUser } from '../context/DemoUserContext';
import { useCart } from '../context/CartContext';
import { useTelemetry } from '../context/TelemetryContext';
import { LiveLogDrawer } from '../components/LiveLogDrawer';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const { currentUser, users, setCurrentUser } = useDemoUser();
    const { totalItems } = useCart();
    const { setDrawerOpen } = useTelemetry();

    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const userOptionTemplate = (option: any) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-user text-primary"></i>
                <div className="flex flex-column">
                    <span className="font-semibold text-xs">{option.fullName}</span>
                    <span className="text-gray-500" style={{ fontSize: '10px' }}>{option.email}</span>
                </div>
            </div>
        );
    };

    const selectedUserTemplate = (option: any) => {
        if (!option) {
            return <span>Seleccionar Usuario</span>;
        }
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-user text-primary"></i>
                <span className="font-semibold text-xs">{option.fullName}</span>
            </div>
        );
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo flex align-items-center gap-2">
                <i className="pi pi-box text-primary text-3xl"></i>
                <span className="font-bold text-xl tracking-wider">MICROSERVICES DEMO</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu align-items-center gap-3', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                {/* Live Logs Quick Action Button */}
                <Button
                    icon="pi pi-terminal"
                    label="Logs en Vivo"
                    className="p-button-outlined p-button-sm p-button-secondary"
                    onClick={() => setDrawerOpen(true)}
                />

                {/* Shopping Cart Icon with Badge */}
                <Link href="/cart" className="p-link layout-topbar-button relative flex align-items-center justify-content-center">
                    <i className="pi pi-shopping-cart text-xl"></i>
                    {totalItems > 0 && (
                        <Badge
                            value={totalItems}
                            severity="danger"
                            className="absolute"
                            style={{ top: '2px', right: '2px' }}
                        ></Badge>
                    )}
                </Link>

                {/* Demo User Selector Dropdown in Top-Right */}
                <div className="flex align-items-center gap-2">
                    <span className="text-xs text-color-secondary font-semibold hidden md:inline">Usuario Activo:</span>
                    <Dropdown
                        value={currentUser}
                        options={users}
                        optionLabel="fullName"
                        placeholder="Usuario Demo"
                        itemTemplate={userOptionTemplate}
                        valueTemplate={selectedUserTemplate}
                        onChange={(e) => setCurrentUser(e.value)}
                        className="p-inputtext-sm w-15rem"
                    />
                </div>
            </div>

            {/* Live Event Log Drawer */}
            <LiveLogDrawer />
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
