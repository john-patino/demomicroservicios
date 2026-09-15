'use client';

import React, { ReactNode } from 'react';
import { TelemetryProvider } from './TelemetryContext';
import { DemoUserProvider } from './DemoUserContext';
import { CartProvider } from './CartContext';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <TelemetryProvider>
            <DemoUserProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </DemoUserProvider>
        </TelemetryProvider>
    );
};
