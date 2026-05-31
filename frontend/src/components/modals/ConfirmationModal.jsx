import React from "react";

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-300 dark:border-gray-600 p-4">
                
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4">
                    <div className="text-yellow-500 text-2xl">⚠️</div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-2 text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                    {message.map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-500 dark:hover:bg-green-600 transition shadow-sm hover:cursor-pointer"
                    >
                        Confirm
                    </button>

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition hover:cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;