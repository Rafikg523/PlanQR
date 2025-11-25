import { useEffect, useState } from 'react';
import { getPendingRequests, assignRoom, getPairedDevices, unpairDevice, updateDeviceAssignment } from '../../services/registryService';

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

interface PairedDevice {
    id: string;
    deviceId: string;
    roomId: string;
    roomName: string;
    device: {
        manufacturer: string;
        model: string;
    };
}

export default function AdminRegistryPanel() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [editingDevice, setEditingDevice] = useState<PairedDevice | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [reqData, pairedData] = await Promise.all([
                getPendingRequests(),
                getPairedDevices()
            ]);
            setRequests(reqData);
            setPairedDevices(pairedData);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAssign = async () => {
        if (!selectedRequest || !selectedRoom) return;

        setLoading(true);
        try {
            await assignRoom(selectedRequest.code, selectedRoom);
            setMessage("Tablet assigned successfully!");
            setSelectedRequest(null);
            setSelectedRoom("");
            fetchData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to assign tablet.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingDevice || !selectedRoom) return;

        setLoading(true);
        try {
            await updateDeviceAssignment(editingDevice.deviceId, selectedRoom);
            setMessage("Device updated successfully!");
            setEditingDevice(null);
            setSelectedRoom("");
            fetchData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to update device.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnpair = async (deviceId: string) => {
        if (!confirm("Are you sure you want to unpair this device? It will return to the registration screen.")) return;

        try {
            await unpairDevice(deviceId);
            setMessage("Device unpaired successfully.");
            fetchData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to unpair device.");
        }
    };

    const openEditModal = (device: PairedDevice) => {
        setEditingDevice(device);
        setSelectedRoom(device.roomName);
    };

    return (
        <div className="mt-8 p-8 bg-gray-50 rounded-xl shadow-lg min-h-[600px]">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Device Management</h2>

            {message && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce z-50">
                    {message}
                </div>
            )}

            {/* Waiting Queue Section */}
            <div className="mb-12">
                <div className="flex items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-700 mr-3">Waiting Queue</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {requests.length} pending
                    </span>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                        No devices waiting for pairing
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {requests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => {
                                    setSelectedRequest(req);
                                    setSelectedRoom("");
                                }}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="text-4xl font-mono font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                                    {req.code}
                                </div>
                                <div className="text-sm text-gray-500 font-medium truncate">
                                    {req.device.manufacturer} {req.device.model}
                                </div>
                                <div className="text-xs text-gray-400 mt-2 font-mono">
                                    ID: ...{req.deviceId.substring(req.deviceId.length - 6)}
                                </div>
                                <div className="absolute bottom-2 right-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                                    Click to Pair →
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Paired Devices Section */}
            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-6">Paired Devices</h3>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pairedDevices.map(device => (
                                <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{device.roomName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{device.device.manufacturer} {device.device.model}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs font-mono text-gray-500">{device.deviceId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(device)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleUnpair(device.deviceId)}
                                            className="text-red-600 hover:text-red-900 font-bold"
                                        >
                                            Unpair
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pairedDevices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No devices currently paired.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment/Edit Modal */}
            {(selectedRequest || editingDevice) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingDevice ? 'Edit Device Assignment' : 'Assign Room'}
                        </h3>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                            {selectedRequest ? (
                                <>
                                    <div className="text-sm text-gray-500 mb-1">Pairing Code</div>
                                    <div className="text-3xl font-mono font-bold text-blue-600">{selectedRequest.code}</div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        {selectedRequest.device.manufacturer} {selectedRequest.device.model}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm text-gray-500 mb-1">Device</div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {editingDevice?.device.manufacturer} {editingDevice?.device.model}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-1">
                                        {editingDevice?.deviceId}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                            <input
                                type="text"
                                className="block w-full px-4 py-3 rounded-lg border-gray-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                placeholder="e.g. WI WI1-308"
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Enter the room identifier exactly as it appears in the schedule.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setEditingDevice(null);
                                }}
                                className="px-6 py-3 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingDevice ? handleUpdate : handleAssign}
                                disabled={loading || !selectedRoom}
                                className={`px-6 py-3 rounded-lg text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${loading || !selectedRoom
                                        ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'
                                    }`}
                            >
                                {loading ? 'Saving...' : (editingDevice ? 'Update' : 'Confirm Assignment')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
