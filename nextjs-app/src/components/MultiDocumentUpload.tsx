"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, File as FileIcon } from "lucide-react";

interface MultiDocumentUploadProps {
  files: Array<{ file: File; docType: string }>;
  onChange: (files: Array<{ file: File; docType: string }>) => void;
}

const docTypes = [
  "UNKNOWN",
  "SYSTEM_SPEC",
  "DPIA",
  "MODEL_CARD",
  "TESTING_RESULTS",
  "CONTRACT_TERMS",
  "GUIDANCE",
];

export const MultiDocumentUpload: React.FC<MultiDocumentUploadProps> = ({
  files,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "application/json" ||
        f.name.endsWith(".pdf") ||
        f.name.endsWith(".json")
    );

    const newItems = validFiles.map((file) => ({
      file,
      docType: "UNKNOWN",
    }));

    onChange([...files, ...newItems]);
  };

  const removeFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  const updateDocType = (index: number, newType: string) => {
    const updated = [...files];
    updated[index].docType = newType;
    onChange(updated);
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          <span className="font-semibold text-blue-600">Click to upload</span> or drag
          and drop
        </p>
        <p className="text-sm text-gray-500">PDF or JSON files only</p>
        <input
          type="file"
          multiple
          accept=".pdf,.json,application/pdf,application/json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-700">Selected Files</h4>
          {files.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm gap-4"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-[300px]">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={item.docType}
                  onChange={(e) => updateDocType(index, e.target.value)}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
                >
                  {docTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-gray-400 hover:text-red-500 focus:outline-none flex-shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
