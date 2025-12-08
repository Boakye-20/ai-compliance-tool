"use client";

export function EmptyState() {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload a Document to Begin</h3>
            <p className="text-gray-600">Select frameworks and upload a PDF to run compliance analysis</p>
        </div>
    );
}
