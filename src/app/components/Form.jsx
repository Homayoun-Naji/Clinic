"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FormInput from "./FormInput";
import { useToast } from "./ToastProvider";
import { ENTITY_CONFIG, mapFormDataToModel, getEntityKeyFromPath } from "@/app/lib/entityConfig";
import { createEntity } from "@/app/lib/api";

export default function Form({ fields }) {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [entity, setEntity] = useState(null);

  // Determine entity from URL path
  useEffect(() => {
    const entityKey = getEntityKeyFromPath(pathname);
    if (entityKey) {
      setEntity(entityKey);
    }
  }, [pathname]);

  // Initialize form data with empty values
  useEffect(() => {
    const initialData = {};
    fields.forEach((field) => {
      initialData[field.name] = "";
    });
    setFormData(initialData);
  }, [fields]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const validateForm = () => {
    const requiredFields = fields.filter((f) => f.required);
    for (const field of requiredFields) {
      const value = formData[field.name];
      if (value === "" || value === undefined || value === null) {
        showToast("error", `${field.title} is required`);
        return false;
      }
    }
    return true;
  };

  const getApiPath = () => {
    if (!entity) return null;
    return ENTITY_CONFIG[entity].apiPath;
  };

  const getEntityName = () => {
    if (!entity) return "Record";
    return ENTITY_CONFIG[entity].entityName;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!entity) {
      showToast("error", "Could not determine entity type");
      return;
    }

    setIsLoading(true);

    try {
      const apiPath = getApiPath();
      const entityName = getEntityName();
      const fieldMapping = ENTITY_CONFIG[entity].fieldMapping;

      // Prepare data for API using the entity config mapping
      const apiData = mapFormDataToModel(formData, fieldMapping);

      await createEntity(apiPath, apiData);
      showToast("success", `${entityName} created successfully`);

      // Reset form on success
      const initialData = {};
      fields.forEach((field) => {
        initialData[field.name] = "";
      });
      setFormData(initialData);
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!entity) {
    return (
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-(color:--color-shadow) text-light">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-(color:--color-shadow)"
      onSubmit={handleSubmit}
    >
      {fields.map((field, index) => {
        return (
          <FormInput
            key={index}
            title={field.title}
            name={field.name}
            type={field.type}
            required={field.required}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
          />
        );
      })}

      <button
        className="cursor-pointer rounded-md bg-secondary px-4 py-2 mt-4 font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Submit"}
      </button>
    </form>
  );
}