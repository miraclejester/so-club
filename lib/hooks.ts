'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useClientValue<T>(getClient: () => T, getServer: () => T): T {
    return useSyncExternalStore<T>(emptySubscribe, getClient, getServer);
}
