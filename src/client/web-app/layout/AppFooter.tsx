/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { TelemetryBar } from '../components/TelemetryBar';

const AppFooter = () => {
    return (
        <footer className="mt-4">
            <TelemetryBar />
            <div className="layout-footer py-2 text-xs text-color-secondary">
                <span>Microservices SDD Demo &copy; 2026 — .NET 8 + YARP + Seq + Sakai React</span>
            </div>
        </footer>
    );
};

export default AppFooter;
