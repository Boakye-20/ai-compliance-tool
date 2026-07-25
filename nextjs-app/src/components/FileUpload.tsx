"use client";

import { useRef } from 'react';
import { Upload, X, FileText, FileJson } from 'lucide-react';

type UploadMode = 'pdf' | 'json';

interface FileUploadProps {
    file: File | null;
    onChange: (file: File | null) => void;
    mode?: UploadMode;
}

const MODE_CONFIG: Record<UploadMode, { accept: string; mime: string; label: string; hint: string }> = {
    pdf: { accept: '.pdf,application/pdf', mime: 'application/pdf', label: 'PDF', hint: 'PDF files only' },
    json: { accept: '.json,application/json', mime: 'application/json', label: 'JSON', hint: 'Anonymised metadata payload (.json)' },
};

export function FileUpload({ file, onChange, mode = 'pdf' }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cfg = MODE_CONFIG[mode];

    const isValid = (f: File) =>
        mode === 'pdf'
            ? f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
            : f.type === 'application/json' || f.name.toLowerCase().endsWith('.json');

    const accept = (selectedFile: File | null) => {
        if (selectedFile && isValid(selectedFile)) {
            onChange(selectedFile);
        } else if (selectedFile) {
            alert(`Please upload a ${cfg.label} file only.`);
            onChange(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        accept(e.target.files?.[0] || null);
    };

    const handleRemoveFile = () => {
        onChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        accept(e.dataTransfer.files[0] || null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-3">
            {!file ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{cfg.hint}</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={cfg.accept}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {mode === 'pdf' ? (
                                <FileText className="h-5 w-5 text-red-600" />
                            ) : (
                                <FileJson className="h-5 w-5 text-indigo-600" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
