const siteUrl = import.meta.env.VITE_SITE_URL;
const API_URL = siteUrl + ":5000/api/registry";

export interface RegistryStatus {
    status: "assigned" | "pending" | "unregistered";
    roomId?: string;
    roomName?: string;
    secretKey?: string;
    code?: string;
    expiresAt?: string;
}

export const getStatus = async (deviceId: string): Promise<RegistryStatus> => {
    const response = await fetch(`${API_URL}/status?deviceId=${deviceId}`);
    if (!response.ok) throw new Error("Failed to fetch status");
    return await response.json();
};

export const registerDevice = async (deviceId: string, manufacturer: string, model: string) => {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, manufacturer, model }),
    });
    if (!response.ok) throw new Error("Failed to register");
    return await response.json();
};

export const assignRoom = async (code: string, roomName: string) => {
    const response = await fetch(`${API_URL}/admin/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, roomName }),
    });
    if (!response.ok) throw new Error("Failed to assign room");
    return await response.json();
};

export const getPendingRequests = async () => {
    const response = await fetch(`${API_URL}/admin/requests`);
    if (!response.ok) throw new Error("Failed to fetch requests");
    return await response.json();
};

export const getRooms = async () => {
    const response = await fetch(`${API_URL}/rooms`);
    if (!response.ok) throw new Error("Failed to fetch rooms");
    return await response.json();
};
