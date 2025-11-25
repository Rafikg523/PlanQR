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

    if (!deviceId || (loading && !status)) return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xl font-light tracking-wider animate-pulse">Initializing System...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="z-10 w-full max-w-4xl flex flex-col items-center">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 backdrop-blur-sm animate-fade-in">
                        {error}
                    </div>
                )}

                {status?.status === 'pending' && (
                    <div className="text-center w-full animate-fade-in-up">
                        <h1 className="text-3xl md:text-5xl font-thin mb-16 text-gray-400 tracking-[0.2em] uppercase">
                            Device Pairing
                        </h1>

                        <div className="relative group">
                            {/* Pulsing Diode Effect */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex justify-center">
                                <div className="relative">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,1)] animate-pulse"></div>
                                    <div className="absolute top-0 left-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur-xl p-16 md:p-24 rounded-[3rem] shadow-2xl border border-gray-800 relative overflow-hidden">
                                {/* Scanning line animation */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scan opacity-30"></div>

                                <p className="mb-8 text-xl text-blue-300/70 uppercase tracking-[0.3em] font-medium">
                                    Pairing Code
                                </p>

                                <div className="text-[8rem] md:text-[12rem] leading-none font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] select-all transition-all duration-300 group-hover:drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                                    {status.code}
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col items-center space-y-4">
                            <div className="flex items-center space-x-3 text-gray-400 bg-gray-900/30 px-6 py-3 rounded-full border border-gray-800/50 backdrop-blur-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm tracking-wide uppercase">Waiting for server response</span>
                            </div>
                            <p className="text-xs text-gray-600 font-mono tracking-widest opacity-50">
                                ID: {deviceId.substring(0, 8)}...
                            </p>
                        </div>
                    </div>
                )}

                {status?.status === 'assigned' && (
                    <div className="text-center animate-scale-in">
                        <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-green-500/30">
                            <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-light text-white mb-4">Successfully Paired</h2>
                        <p className="text-2xl text-gray-400 font-light">Assigned to <span className="text-blue-400 font-medium">{status.roomName}</span></p>
                        <div className="mt-12 flex justify-center">
                            <div className="flex space-x-1">
                                <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce delay-0"></div>
                                <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                                <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 0.5; }
                    90% { opacity: 0.5; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
