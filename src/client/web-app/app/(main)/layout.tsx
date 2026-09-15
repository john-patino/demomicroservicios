import { Metadata, Viewport } from 'next';
import Layout from '../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const viewport: Viewport = {
    initialScale: 1,
    width: 'device-width'
};

export const metadata: Metadata = {
    title: 'Microservices Demo Store',
    description: 'E-commerce microservices demo with .NET 8, YARP, Seq and PrimeReact',
    robots: { index: false, follow: false },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
