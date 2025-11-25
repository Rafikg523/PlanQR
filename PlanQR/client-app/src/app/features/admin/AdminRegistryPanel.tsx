import { useEffect, useState } from 'react';
import { getPendingRequests, assignRoom } from '../../services/registryService';

interface Request {
    id: string;
    deviceId: string;
    code: string;
    expiresAt: string;
    device: {
        manufacturer: string;
        model: string;
    };
}

export default function AdminRegistryPanel() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const reqData = await getPendingRequests();
            setRequests(reqData);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAssign = async (code: string) => {
        if (!selectedRoom) {
            alert("Please enter a room name.");
            return;
        }

        setLoading(true);
        try {
            await assignRoom(code, selectedRoom);
            setMessage("Tablet assigned successfully!");
            fetchData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to assign tablet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Tablet Registration Requests</h2>

            {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Room Name (e.g., "WI WI1-308")</label>
                <input
                    type="text"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    placeholder="Enter room name..."
                />
            </div>

            {requests.length === 0 ? (
                <p className="text-gray-500">No pending requests.</p>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="border p-4 rounded flex justify-between items-center bg-gray-50">
                            <div>
                                <div className="text-xl font-mono font-bold text-blue-600">{req.code}</div>
                                <div className="text-sm text-gray-600">{req.device.manufacturer} {req.device.model}</div>
                                <div className="text-xs text-gray-400">Expires: {new Date(req.expiresAt).toLocaleTimeString()}</div>
                            </div>
                            <button
                                onClick={() => handleAssign(req.code)}
                                disabled={loading || !selectedRoom}
                                className={`px-4 py-2 rounded text-white font-bold ${loading || !selectedRoom ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Assign
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
