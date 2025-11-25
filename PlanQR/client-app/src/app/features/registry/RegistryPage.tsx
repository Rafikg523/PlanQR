import { useEffect, useState } from 'react';
import { useDevice } from './useDevice';
import { getStatus, registerDevice, RegistryStatus } from '../../services/registryService';

export default function RegistryPage() {
    const deviceId = useDevice();
    const [status, setStatus] = useState<RegistryStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!deviceId) return;

        const checkStatus = async () => {
            try {
                const data = await getStatus(deviceId);
                setStatus(data);

                if (data.status === 'assigned') {
                    // Redirect to tablet view
                    window.location.href = `/tablet/${data.roomName}/${data.secretKey}`;
                } else if (data.status === 'unregistered') {
                    // Auto-register if unregistered
                    handleRegister();
                }
            } catch (err) {
                console.error(err);
                setError("Failed to connect to registry service.");
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [deviceId]);

    const handleRegister = async () => {
        if (!deviceId) return;
        try {
            await registerDevice(deviceId, "Generic Tablet", navigator.userAgent);
            // Status update will happen on next poll
        } catch (err) {
            console.error(err);
            setError("Failed to start registration.");
        }
    };

    if (!deviceId || loading && !status) return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="animate-pulse text-2xl">Initializing...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            {error && <div className="bg-red-500 p-4 rounded mb-4">{error}</div>}

            {status?.status === 'pending' && (
                <div className="text-center">
                    <h1 className="text-4xl font-light mb-12 text-gray-300">Tablet Registration</h1>

                    <div className="bg-gray-800 p-12 rounded-3xl shadow-2xl border border-gray-700">
                        <p className="mb-6 text-xl text-gray-400 uppercase tracking-widest">Registration Code</p>
                        <div className="text-9xl font-mono font-bold tracking-widest text-blue-400 mb-8 select-all">
                            {status.code}
                        </div>
                        <div className="flex justify-center items-center space-x-2 text-gray-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            <p className="text-sm">Waiting for administrator assignment...</p>
                        </div>
                    </div>

                    <p className="mt-12 text-sm text-gray-600 font-mono">
                        Device ID: {deviceId.substring(0, 8)}...
                    </p>
                </div>
            )}

            {status?.status === 'assigned' && (
                <div className="text-center text-green-400">
                    <div className="text-6xl mb-4">✓</div>
                    <p className="text-3xl font-light">Assigned to {status.roomName}</p>
                    <p className="mt-4 text-gray-500 animate-pulse">Redirecting...</p>
                </div>
            )}
        </div>
    );
}
