'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoUser } from '../types/demo';
import apiClient, { emitLog } from '../api/client';

interface DemoUserContextType {
    currentUser: DemoUser | null;
    users: DemoUser[];
    setCurrentUser: (user: DemoUser) => void;
    refreshUsers: () => Promise<void>;
    isLoading: boolean;
}

const FALLBACK_USERS: DemoUser[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Alice Smith (Demo User)',
        email: 'alice@example.com'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        fullName: 'Bob Jones (Demo User)',
        email: 'bob@example.com'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        fullName: 'Carol White (Demo User)',
        email: 'carol@example.com'
    }
];

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined);

export const DemoUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<DemoUser[]>(FALLBACK_USERS);
    const [currentUser, setCurrentUserState] = useState<DemoUser | null>(FALLBACK_USERS[0]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const setCurrentUser = (user: DemoUser) => {
        setCurrentUserState(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('demo_active_user', JSON.stringify(user));
        }
        emitLog('INFO', 'DemoUser', `Usuario activo cambiado a: ${user.fullName} (${user.email})`, 'system');
    };

    const refreshUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get<DemoUser[]>('/users');
            if (response.data && response.data.length > 0) {
                setUsers(response.data);
                // If current user is not in list or null, select first
                setCurrentUserState((prev) => {
                    if (!prev) return response.data[0];
                    const found = response.data.find((u) => u.id === prev.id);
                    return found || response.data[0];
                });
            }
        } catch (error) {
            console.warn('Could not fetch users from backend, using default demo users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('demo_active_user');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setCurrentUserState(parsed);
                } catch {
                    // ignore parse error
                }
            }
        }
        refreshUsers();
    }, []);

    return (
        <DemoUserContext.Provider
            value={{
                currentUser,
                users,
                setCurrentUser,
                refreshUsers,
                isLoading
            }}
        >
            {children}
        </DemoUserContext.Provider>
    );
};

export const useDemoUser = () => {
    const context = useContext(DemoUserContext);
    if (!context) {
        throw new Error('useDemoUser must be used within a DemoUserProvider');
    }
    return context;
};
