"use client";

import React, { useState } from "react";

interface QuizSelfAssessmentProps {
  onSubmit: (payload: any) => void;
  onCancel: () => void;
}

export const QuizSelfAssessment: React.FC<QuizSelfAssessmentProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    system_type: "",
    use_case: "",
    foundation_models: "",
    deployment_context: "",
    has_personal_data: false,
    has_biometric_data: false,
    has_human_oversight: true,
    data_types: [] as string[],
    risk_indicators: [] as string[],
    region_residency: "UK",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "radio") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "yes",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "data_types" | "risk_indicators"
  ) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentList = prev[field];
      if (checked) {
        return { ...prev, [field]: [...currentList, value] };
      } else {
        return { ...prev, [field]: currentList.filter((item) => item !== value) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      document_type: "ASSESSMENT",
      system_type: formData.system_type,
      use_case: formData.use_case,
      foundation_models: formData.foundation_models
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      deployment_context: formData.deployment_context,
      has_personal_data: formData.has_personal_data,
      has_biometric_data: formData.has_biometric_data,
      has_human_oversight: formData.has_human_oversight,
      data_types: formData.data_types,
      risk_indicators: formData.risk_indicators,
      region_residency: formData.region_residency,
      pii_categories: [], // default empty
      datasets: [], // default empty
    };
    onSubmit(payload);
  };

  const dataTypesOptions = [
    "Health Data",
    "Financial Data",
    "Criminal Records",
    "Employee Data",
    "Public Web Data",
    "Customer Data",
  ];

  const riskIndicatorsOptions = [
    "Automated Decision Making",
    "Profiling",
    "Critical Infrastructure",
    "Emotion Recognition",
    "Biometric Identification",
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        AI System Self-Assessment
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* System Name & Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Name & Type
          </label>
          <input
            type="text"
            name="system_type"
            value={formData.system_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Customer Service Chatbot"
            required
          />
        </div>

        {/* Use Case Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Use Case Description
          </label>
          <textarea
            name="use_case"
            value={formData.use_case}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            placeholder="Describe what the system does..."
            required
          />
        </div>

        {/* Foundation Models */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foundation Models Used (comma-separated)
          </label>
          <input
            type="text"
            name="foundation_models"
            value={formData.foundation_models}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., GPT-4, Claude 3.5, Llama 3"
          />
        </div>

        {/* Deployment Context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deployment Context
          </label>
          <input
            type="text"
            name="deployment_context"
            value={formData.deployment_context}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Internal Use, Public API, Consumer App"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Personal Data?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_personal_data"
                  value="yes"
                  checked={formData.has_personal_data === true}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_personal_data"
                  value="no"
                  checked={formData.has_personal_data === false}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Biometric Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Biometric Data?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_biometric_data"
                  value="yes"
                  checked={formData.has_biometric_data === true}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_biometric_data"
                  value="no"
                  checked={formData.has_biometric_data === false}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Human Oversight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Human Oversight?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_human_oversight"
                  value="yes"
                  checked={formData.has_human_oversight === true}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="has_human_oversight"
                  value="no"
                  checked={formData.has_human_oversight === false}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Types Involved
            </label>
            <div className="space-y-2">
              {dataTypesOptions.map((dt) => (
                <label key={dt} className="flex items-center">
                  <input
                    type="checkbox"
                    value={dt}
                    checked={formData.data_types.includes(dt)}
                    onChange={(e) => handleCheckboxChange(e, "data_types")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Indicators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Indicators
            </label>
            <div className="space-y-2">
              {riskIndicatorsOptions.map((ri) => (
                <label key={ri} className="flex items-center">
                  <input
                    type="checkbox"
                    value={ri}
                    checked={formData.risk_indicators.includes(ri)}
                    onChange={(e) => handleCheckboxChange(e, "risk_indicators")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">{ri}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Data Residency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Residency
          </label>
          <select
            name="region_residency"
            value={formData.region_residency}
            onChange={handleInputChange}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="UK">UK</option>
            <option value="EU">EU</option>
            <option value="US">US</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end space-x-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Generate Metadata Payload
          </button>
        </div>
      </form>
    </div>
  );
};
