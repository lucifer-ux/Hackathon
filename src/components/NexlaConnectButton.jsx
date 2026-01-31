import { useState } from 'react';
import NexlaDataModal from './NexlaDataModal';

/**
 * NexlaConnectButton - A button component that triggers connection to Nexla SDK via the backend.
 */
export default function NexlaConnectButton() {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'connected' | 'error'
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleConnect = async () => {
        if (status === 'connected') {
            setShowModal(true);
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/nexla/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('connected');
                setMessage(data.message || 'Connected to Nexla');
                setShowModal(true);
            } else {
                setStatus('error');
                setMessage(data.detail || 'Connection failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Failed to connect to backend. Is the Python server running?');
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4 w-full px-2">
                <button
                    onClick={handleConnect}
                    disabled={status === 'loading'}
                    className={`
                        group relative w-full flex items-center justify-center gap-3 px-4 py-3 
                        rounded-xl font-medium text-sm transition-all duration-200
                        border hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${status === 'loading'
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : status === 'connected'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500'
                                : status === 'error'
                                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 focus:ring-red-500'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 focus:ring-indigo-500'
                        }
                    `}
                >
                    {status === 'loading' && (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}

                    {status === 'idle' && (
                        <>
                            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                            Connect Nexla
                        </>
                    )}

                    {status === 'connected' && (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Open Nexla Connect
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <span className="h-2 w-2 rounded-full bg-red-400"></span>
                            Retry Connection
                        </>
                    )}
                </button>

                {message && (
                    <div className={`text-xs px-2 text-center font-medium ${status === 'connected' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                        {message}
                    </div>
                )}
            </div>

            {showModal && <NexlaDataModal onClose={() => setShowModal(false)} />}
        </>
    );
}
