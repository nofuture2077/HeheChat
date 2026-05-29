import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import PubSub from 'pubsub-js';

export type ConnectionStateName = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionStatus {
    state: ConnectionStateName;
    reconnectAttempts: number;
    lastHeartbeat: number;
    /** Milliseconds since we left the `connected` state; 0 when connected. */
    disconnectedSinceMs: number;
    forceReconnect: () => void;
}

export const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
    state: 'connecting',
    reconnectAttempts: 0,
    lastHeartbeat: 0,
    disconnectedSinceMs: 0,
    forceReconnect: () => {}
};

export const ConnectionStatusContext = createContext<ConnectionStatus>(DEFAULT_CONNECTION_STATUS);

export function useConnectionStatus(): ConnectionStatus {
    return useContext(ConnectionStatusContext);
}

interface ProviderProps {
    forceReconnect: () => void;
    children: ReactNode;
}

interface RawStatus {
    state: ConnectionStateName;
    reconnectAttempts: number;
    lastHeartbeat: number;
}

export function ConnectionStatusProvider({ forceReconnect, children }: ProviderProps) {
    const [raw, setRaw] = useState<RawStatus>({
        state: 'connecting',
        reconnectAttempts: 0,
        lastHeartbeat: 0
    });
    const [now, setNow] = useState(Date.now());
    const disconnectedSinceRef = useRef<number>(0);

    useEffect(() => {
        const token = PubSub.subscribe('WS-connectionStatus', (_msg: string, data: RawStatus) => {
            if (!data) return;
            setRaw(prev => {
                if (
                    prev.state === data.state &&
                    prev.reconnectAttempts === data.reconnectAttempts &&
                    prev.lastHeartbeat === data.lastHeartbeat
                ) {
                    return prev;
                }
                return data;
            });
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, []);

    // Track the moment we left the connected state.
    useEffect(() => {
        if (raw.state === 'connected') {
            disconnectedSinceRef.current = 0;
        } else if (disconnectedSinceRef.current === 0) {
            disconnectedSinceRef.current = Date.now();
        }
    }, [raw.state]);

    // While disconnected, tick once a second so consumers re-render
    // and can react to crossing thresholds (e.g. show banner after 5s).
    useEffect(() => {
        if (raw.state === 'connected') return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [raw.state]);

    const value = useMemo<ConnectionStatus>(() => {
        const disconnectedSinceMs = raw.state === 'connected' || disconnectedSinceRef.current === 0
            ? 0
            : Math.max(0, now - disconnectedSinceRef.current);
        return {
            state: raw.state,
            reconnectAttempts: raw.reconnectAttempts,
            lastHeartbeat: raw.lastHeartbeat,
            disconnectedSinceMs,
            forceReconnect
        };
    }, [raw, now, forceReconnect]);

    return (
        <ConnectionStatusContext.Provider value={value}>
            {children}
        </ConnectionStatusContext.Provider>
    );
}
