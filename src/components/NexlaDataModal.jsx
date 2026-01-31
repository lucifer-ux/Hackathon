import { X } from 'lucide-react';

export default function NexlaDataModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-[90vw] h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Nexla Connect</h2>
                        <div className="flex items-center">
                            <span className="text-xs font-medium px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-wide">
                                EMBEDDED VIEW
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all duration-200"
                    >
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 bg-white relative">
                    <iframe
                        src="https://dataops.nexla.io/"
                        className="w-full h-full border-none"
                        title="Nexla UI"
                        allow="clipboard-write; fullscreen"
                    />
                </div>
            </div>
        </div>
    );
}
