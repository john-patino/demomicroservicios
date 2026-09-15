export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    imageUrl: string;
}

export interface DemoUser {
    id: string;
    fullName: string;
    email: string;
    createdAt?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface OrderLineItem {
    id: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
    createdAt: string;
    items: OrderLineItem[];
}

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';

export interface OperationLog {
    id: string;
    timestamp: string;
    level: LogLevel;
    source: string;
    correlationId: string;
    message: string;
    statusCode?: number;
    details?: any;
}
