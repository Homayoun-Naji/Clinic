"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FormInput from "./FormInput";
import { useToast } from "./ToastProvider";
import { ENTITY_CONFIG, mapFormDataToModel, getEntityKeyFromPath } from "@/app/lib/entityConfig";
import { createEntity } from "@/app/lib/api";
import { validateField } from "@/app/lib/validation";

export default function Form({ fields }) {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
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
    const newFormData = {
      ...formData,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    };
    setFormData(newFormData);

    // Clear error for this field on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    for (const field of fields) {
      const raw = formData[field.name];
      const modelKey = ENTITY_CONFIG[entity]?.fieldMapping[field.name] || field.name;
      const result = validateField(modelKey, raw, { required: field.required, entity });
      if (!result.ok) {
        newErrors[field.name] = result.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      setErrors({});
    } catch (error) {
      if (error.fieldErrors) {
        // Map server-side field errors to form field names using the entity's
        // field mapping (model key -> form key).
        const fieldMapping = ENTITY_CONFIG[entity].fieldMapping;
        const reverseMapping = Object.fromEntries(
          Object.entries(fieldMapping).map(([formKey, modelKey]) => [
            modelKey,
            formKey,
          ]),
        );
        const serverErrors = {};
        for (const [modelKey, msg] of Object.entries(error.fieldErrors)) {
          const formKey = reverseMapping[modelKey] || modelKey;
          serverErrors[formKey] = msg;
        }
        setErrors(serverErrors);
      } else {
        showToast("error", error.message);
      }
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
      <h2 className="text-2xl font-semibold text-light">
        {`Add a ${getEntityName()}`}
      </h2>
      <p className="text-light/70">
        {`Fill out the form below to add a new ${getEntityName().toLowerCase()}.`}
      </p>
      {fields.map((field) => {
        return (
          <FormInput
            key={field.name}
            title={field.title}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            error={errors[field.name]}
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