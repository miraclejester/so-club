export const SIGN_IN_URL = '/signin';
export const GROUPS_URL = '/groups';

export function groupPath(groupId: string): string {
    return `${GROUPS_URL}/${groupId}`;
}

export function sessionPath(groupId: string, sessionId: string): string {
    return `${groupPath(groupId)}/sessions/${sessionId}`;
}

export function schedulePath(groupId: string, backlogItemId: string): string {
    return `${groupPath(groupId)}/schedule/${backlogItemId}`;
}

export function invitePath(token: string): string {
    return `/invite/${token}`;
}
