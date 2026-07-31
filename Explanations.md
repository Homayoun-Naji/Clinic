# Learn.md - Complete Implementation Guide

This document explains every important implementation detail of the Clinic project. It's designed for a Junior Frontend Developer who wants to become Senior.

---

# components/Form.jsx

## Purpose

This component is a **generic, reusable form** that handles creating new entities (Doctors, Patients, Medicines). It dynamically determines which entity type it's rendering based on the current URL path, fetches the appropriate configuration, handles form validation, and submits data to the correct API endpoint.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Form.jsx                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Reads URL path → determines entity (doctors/patients/meds) │
│  2. Loads entity config from ENTITY_CONFIG                      │
│  3. Renders FormInput components for each field                │
│  4. Handles validation (required fields)                       │
│  5. Maps form data (kebab-case) → model data (snake_case)      │
│  6. POSTs to correct API endpoint                               │
│  7. Shows toast notifications for success/error                │
└─────────────────────────────────────────────────────────────────┘
```

This follows the **Configuration-Driven UI** pattern - the form structure is defined in `entityConfig.js`, not hardcoded in the component.

## Code Walkthrough

### Block 1: Imports and Setup

```jsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FormInput from "./FormInput";
import { useToast } from "./ToastProvider";
import { ENTITY_CONFIG, getEntityKeyFromPath, mapFormDataToModel } from "@/app/lib/entityConfig";
import { createEntity } from "@/app/lib/api";
import { validateField } from "@/app/lib/validation";
```

**Explanation:**
|- `"use client"` - This directive tells Next.js this is a **Client Component**. It runs in the browser, can use hooks (`useState`, `useEffect`), browser APIs, and event handlers. Without this, it would be a Server Component by default (Next.js 13+ App Router default).
|- `usePathname()` - Next.js hook that returns the current URL pathname (e.g., `/doctors`, `/patients`). This is how we determine which entity the form belongs to.
|- `useToast()` - Custom hook from our ToastProvider context for showing notifications.
|- `ENTITY_CONFIG` - Central configuration object mapping entity keys to their API paths, field mappings, and rich field metadata.
|- `getEntityKeyFromPath()` - Extracts entity key from URL pathname.
|- `mapFormDataToModel()` - Maps form data (kebab-case keys) to model data (snake_case keys), normalizing whitespace and dropping empty values.
|- `validateField()` - Shared validation utility that checks required fields, types, patterns, and maxLength with entity-specific rules.

**Why this approach?** Instead of creating separate form components for each entity (DoctorForm, PatientForm, MedicineForm), we have ONE generic form driven by configuration. Adding a new entity = adding config, not writing new components.

### Block 2: State and Entity Detection

```jsx
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
```

**Explanation:**
- `fields` - Props passed from parent, an array of field configurations: `[{ name: "first-name", title: "First Name", type: "text", required: true, placeholder: "..." }, ...]`
- `formData` - Object holding current form values: `{ "first-name": "John", "last-name": "Doe", ... }`
- `isLoading` - Tracks submission state for disabling button and showing "Processing..."
- `entity` - The detected entity key (`doctors`, `patients`, `medicines`). This value is passed to `validateField` as the `entity` parameter, enabling entity-specific validation rules (e.g., medicine names allow numbers).

**The `useEffect` for entity detection:**
- Runs whenever `pathname` changes (navigation between /doctors, /patients, /medicines)
- `getEntityKeyFromPath("/doctors")` → `"doctors"`
- `getEntityKeyFromPath("/patients")` → `"patients"`
- This is a **side effect** - reading from the router and updating state - perfect for `useEffect`

**Why not use `usePathname` directly in render?** Because `usePathname` can return `null` during SSR, and we need to wait for client-side hydration. The `useEffect` runs only on client.

### Block 3: Form Initialization

```jsx
  // Initialize form data with empty values
  useEffect(() => {
    const initialData = {};
    fields.forEach((field) => {
      initialData[field.name] = "";
    });
    setFormData(initialData);
  }, [fields]);
```

**Explanation:**
- Runs when `fields` prop changes (e.g., if parent passes different fields for different entities)
- Creates an object with all field names as keys and empty strings as values
- This ensures the form is always in a clean state when fields change

**Why use `useEffect` instead of initial state?** Because `fields` comes from props - we don't know it at component creation time. The effect runs after first render with the actual props.

### Block 4: Input Change Handler

```jsx
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };
```

**Explanation:**
- Uses **functional state update** `setFormData(prev => ...)` - ensures we're working with latest state
- **Spread operator** `...prev` - copies all existing fields
- **Computed property name** `[name]` - uses the input's `name` attribute as the key
- **Number conversion** - HTML inputs always return strings. For `type="number"`, we convert to actual `Number` (but keep empty string as empty string for validation)

**Why this pattern?** Controlled components in React need to update state on every keystroke. Functional updates prevent stale closure bugs when multiple rapid updates happen.

### Block 5: Form Validation

```jsx
  const [errors, setErrors] = useState({});

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
```

**Explanation:**
- `errors` state stores per-field error messages for inline display
- Iterates over form fields (not all entity fields), calling `validateField(modelKey, raw, { required: field.required, entity })`
- The `entity` parameter enables entity-specific rules — medicine names allow numbers, doctor/patient names don't
- `modelKey` is derived from `ENTITY_CONFIG[entity].fieldMapping[field.name]` (maps kebab-case form key to snake_case model key)
- Returns `true` if all fields are valid, `false` otherwise
- No toast for individual validation failures — errors appear inline below each input
- `handleInputChange` clears a field's error as the user types

**Validation rules enforced:**
- Required fields (empty string, undefined, null)
- Email format (regex pattern)
- Number type + minimum value
- Text maxLength
- Date pattern (DD/MM/YYYY for birth_date)
- String trimming before comparison

### Block 6: API Path and Entity Name Helpers

```jsx
  const getApiPath = () => {
    if (!entity) return null;
    return ENTITY_CONFIG[entity].apiPath;
  };

  const getEntityName = () => {
    if (!entity) return "Record";
    return ENTITY_CONFIG[entity].entityName;
  };
```

**Explanation:**
- Simple getter functions that read from `ENTITY_CONFIG`
- `apiPath` → `/api/doctors`, `/api/patients`, `/api/medicines`
- `entityName` → "Doctor", "Patient", "Medicine" (for toast messages)

**Why separate functions?** Single responsibility, easy to test, easy to modify if API structure changes.

### Block 7: Form Submission

```jsx
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
        const reverseMapping = {};
        for (const [formKey, modelKey] of Object.entries(fieldMapping)) {
          reverseMapping[modelKey] = formKey;
        }
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
```

**Explanation - Step by Step:**

1. **`e.preventDefault()`** - Prevents default form submission (page reload). Essential for SPAs.

2. **Validation check** - Calls `validateForm()` which uses `validateField`, returns early if invalid.

3. **Entity check** - Guards against undefined entity (shouldn't happen but defensive).

4. **Loading state** - `setIsLoading(true)` disables submit button, shows "Processing..."

5. **Data mapping** - `mapFormDataToModel(formData, fieldMapping)` does three things in one pass:
   - Maps kebab-case form keys to snake_case model keys
   - Trims whitespace from strings
   - Drops empty values (optional fields left blank)

   ```js
   // Input: formData (kebab-case keys from form inputs)
   { "first-name": "John", "last-name": "Doe", specialization: "Cardiology", phone: "" }
   
   // fieldMapping (from ENTITY_CONFIG)
   { "first-name": "first_name", "last-name": "last_name", specialization: "specialization", phone: "phone" }
   
   // Output: apiData (snake_case keys matching Mongoose model)
   { first_name: "John", last_name: "Doe", specialization: "Cardiology" }
   // phone omitted (empty string)
   ```

6. **API call** - Uses `createEntity()` from `lib/api.js` (thin fetch wrapper).

7. **Success toast** - Shows success message with entity name.

8. **Form reset** - Recreates empty initial data and clears errors.

9. **Catch block** - Catches network errors or server validation errors (400 "Missing required fields"). Shows error toast.

10. **Finally block** - Always runs, resets loading state.

**Why `async/await`?** Cleaner than `.then()` chains. Makes asynchronous code read like synchronous code. The `try/catch/finally` handles all error paths.

**Why `createEntity` instead of raw `fetch`?** Consistent error handling via `parseResponse()` in `lib/api.js`. All CRUD operations share the same HTTP pattern.

### Block 8: Loading State Render

```jsx
  if (!entity) {
    return (
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-(color:--color-shadow) text-light">
        <p>Loading...</p>
      </div>
    );
  }
```

**Explanation:**
- Early return while entity is being detected (pathname not ready yet)
- Shows a styled loading card
- Uses CSS custom properties (`--color-border`, `--color-surface`) for theming

### Block 9: Form Render

```jsx
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
```

**Explanation:**
- **Controlled inputs** - `value={formData[field.name] || ""}` and `onChange={handleInputChange}` make FormInput controlled components
- **`key={index}`** - Using index as key is acceptable here because fields array is static (not reordered/filtered). For dynamic lists, use unique IDs.
- **Submit button** - `type="submit"` triggers form's `onSubmit`. Disabled during loading with visual feedback.
- **CSS custom properties** - `border-(--color-border)` uses Tailwind's arbitrary value syntax with CSS variables for theming.

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Client Components** | `"use client"` directive enables hooks, browser APIs, interactivity |
| **Configuration-Driven UI** | Form structure defined in config, not hardcoded - add entities without new components |
| **Controlled Components** | React state controls input values, `onChange` updates state |
| **Functional State Updates** | `setState(prev => ...)` prevents stale closure bugs |
| **Side Effects with useEffect** | URL reading, form initialization - runs after render |
| **Fetch API** | Native browser API for HTTP requests, no dependencies |
| **Async/Await + Try/Catch** | Synchronous-looking async code with proper error handling |
| **Early Returns** | Guard clauses reduce nesting, improve readability |
| **CSS Custom Properties** | `--color-border` enables theming without rebuilding CSS |

---

## Summary

**Form.jsx** is a **generic, reusable form component** that:
1. Detects entity type from URL
2. Renders fields from configuration
3. Validates using shared `validateField()` (required, types, patterns, maxLength, entity-specific rules)
4. Sanitizes and maps form data to API format via `mapFormDataToModel()`
5. Shows user feedback via toasts + inline field errors

**Why this architecture?** Adding a new entity (e.g., "Appointments") requires:
1. Add config to `entityConfig.js` (field metadata, API path, field mapping)
2. Create API route using `createPostHandler`
3. Add page that passes fields to `<Form fields={...} />`

**No new components or validation code needed.** The shared validation utility and configuration-driven design handle everything automatically.

---

# components/FormInput.jsx

## Purpose

A **primitive, reusable input component** that renders a label and input field with consistent styling. Used by `Form.jsx` to render each form field.

## High-Level Architecture

```
Form.jsx (parent)
    │
    ├──► maps over fields array
    │
    └──► <FormInput 
            title="First Name"
            name="first-name"
            type="text"
            required={true}
            placeholder="Enter first name"
            value={formData["first-name"]}
            onChange={handleInputChange}
         />
```

## Code Walkthrough

```jsx
export default function FormInput({
  title,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-sm font-medium text-light"
        htmlFor={name}
      >
        {title}:
      </label>
      <input
        className={`rounded-lg border bg-(--color-input-bg) px-3 py-2 text-light outline-none transition focus:border-secondary ${
          error ? "border-red-500" : "border-(--color-input-border)"
        }`}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  );
}
```

### Block-by-Block Explanation

**Props Destructuring:**
```jsx
function FormInput({ title, name, type, placeholder, value, onChange, error })
```
- Receives all necessary props from parent
- `error` - Optional string. When set, turns the input border red and shows an error message below
- No `required` prop — validation is handled entirely by `Form.jsx` via `validateField`, not by HTML5 constraint validation
- No internal state - **pure presentational component**

**Label:**
```jsx
<label className="text-sm font-medium text-light" htmlFor={name}>
  {title}:
</label>
```
- `htmlFor={name}` - Associates label with input (clicking label focuses input). Accessibility best practice.
- `title` prop used for display (e.g., "First Name"), `name` for HTML `id` and form submission.

**Input:**
```jsx
<input
  className={`rounded-lg border bg-(--color-input-bg) px-3 py-2 text-light outline-none transition focus:border-secondary ${
    error ? "border-red-500" : "border-(--color-input-border)"
  }`}
  type={type}
  name={name}
  placeholder={placeholder}
  value={value}
  onChange={onChange}
/>
```
- **Controlled component** - `value` and `onChange` come from parent
- No `required` attribute — validation is handled via `validateField` in `Form.jsx`, giving consistent behavior between create and edit flows
- `outline-none` + `focus:border-secondary` - Custom focus ring using theme color
- Red border via `error` prop for inline validation feedback

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Presentational Component** | No state, no side effects, just renders UI based on props |
| **Controlled Input** | Parent owns state, input is "dumb" - enables validation, transformation |
| **htmlFor / id Association** | Accessibility: clicking label focuses input |
| **CSS Custom Properties** | `--color-input-border` allows theme changes without CSS rebuild |

---

## Summary

**FormInput.jsx** is a **dumb/presentational component**. It knows nothing about forms, validation, or entities. It just renders a styled label + input. This separation of concerns (Form handles logic, FormInput handles presentation) makes both components reusable and testable.

---

# components/ShowCard.jsx

## Purpose

A **smart display card** that shows entity data in read mode, switches to edit mode inline, handles updates and deletions with confirmation modals, and prevents concurrent edits.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ShowCard.jsx                             │
├─────────────────────────────────────────────────────────────────┤
│  Props from EntityShow:                                         │
│  - data: [{ title: "First Name", value: "John" }, ...]         │
│  - rawItem: { _id: "...", first_name: "John", ... }            │
│  - dataKeys: ["first_name", "last_name", ...]                  │
│  - requiredKeys: ["first_name", "last_name"]                   │
│  - apiPath: "/api/patients"                                     │
│  - entityName: "Patient"                                        │
│  - onChanged: callback to refetch list                          │
│  - editingId: currently editing item's _id (from parent)       │
│  - onStartEdit/onFinishEdit: callbacks to control edit state   │
│                                                                 │
│  Internal State:                                                │
│  - isEditing: derived from editingId === rawItem._id           │
│  - editValues: { first_name: "John", ... }                     │
│  - showDeleteModal, showBlockedModal                           │
│  - isSaving, isDeleting                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Code Walkthrough

### Block 1: Imports and Props

```jsx
"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "./ToastProvider";
import { updateEntity, deleteEntity } from "@/app/lib/api";
import { getFieldTitle } from "@/app/lib/entityConfig";
import { validateField } from "@/app/lib/validation";
import Tooltip from "./Tooltip";

export default function ShowCard({
  data,
  rawItem,
  dataKeys,
  requiredKeys = [],
  apiPath,
  entityName = "Record",
  onChanged,
  editingId,
  onStartEdit,
  onFinishEdit,
}) {
  const { showToast } = useToast();
  const isEditing = editingId === rawItem._id;
  const [editValues, setEditValues] = useState({});
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive entity key from apiPath (e.g. "/api/doctors" -> "doctors").
  // Use the last path segment so absolute URLs (http://host/api/medicines)
  // and relative paths resolve to the same entity key.
  const entityKey = apiPath.split("/").filter(Boolean).pop() || "";
```

**Explanation:**
- `"use client"` - Needs hooks, event handlers, lucide icons
- **New imports:** `getFieldTitle` (from entityConfig) and `validateField` (from validation) replace the old `validateEntityData`, `sanitizeFormData`, and `getFieldMetadata` imports. All validation now flows through the shared `validateField` function with an `entity` parameter for entity-specific rules.
- **Props breakdown:**
  - `data` - Array of `{ title, value }` for display (pre-formatted by parent)
  - `rawItem` - Original database document with `_id` and all fields
  - `dataKeys` - Array of field names in order: `["first_name", "last_name", ...]`
  - `requiredKeys` - Fields that must be filled for update validation
  - `apiPath` - API endpoint for this entity
  - `entityName` - Display name for toasts
  - `onChanged` - Callback to trigger parent refetch after changes
  - `editingId` - ID of item currently being edited (controlled by parent)
  - `onStartEdit` / `onFinishEdit` - Parent callbacks to set/clear editingId
- **Derived state:** `isEditing = editingId === rawItem._id` - No need for separate state, computed from props
- **Local state:** `errors` (per-field validation errors), `editValues` (form data during edit), modals visibility, loading states
- **Entity key:** Derived from `apiPath` using `.pop()` (last path segment) instead of `[1]` (second segment). This handles both relative paths (`/api/medicines`) and absolute URLs (`http://localhost:3000/api/medicines`) correctly — both yield `"medicines"`.

### Block 2: Edit Values Initialization

```jsx
  useEffect(() => {
    if (isEditing && Object.keys(editValues).length === 0) {
      const initial = {};
      dataKeys.forEach((key) => {
        initial[key] = rawItem[key] ?? "";
      });
      setEditValues(initial);
    }
  }, [isEditing, editValues, dataKeys, rawItem]);
```

**Explanation:**
- Runs when `isEditing` becomes true AND `editValues` is empty
- Populates `editValues` from `rawItem` using `dataKeys` as the field list
- `rawItem[key] ?? ""` - Nullish coalescing: use empty string if null/undefined
- **Dependency array** includes `editValues` - this effect runs again after `setEditValues`, but the `Object.keys(editValues).length === 0` check prevents infinite loop

**Why not initialize in onStartEdit?** Because `onStartEdit` is called by parent, but this component owns `editValues` state. The effect reacts to the prop change.

### Block 3: Edit/Delete Request Handlers

```jsx
  const requestEdit = () => {
    if (editingId !== null && editingId !== rawItem._id) {
      setShowBlockedModal(true);
      return;
    }
    onStartEdit(rawItem._id);
  };

  const requestDelete = () => {
    if (editingId !== null && editingId !== rawItem._id) {
      setShowBlockedModal(true);
      return;
    }
    setShowDeleteModal(true);
  };
```

**Explanation:**
- **Concurrent edit prevention** - If another item is being edited (`editingId !== null && editingId !== rawItem._id`), show "blocked" modal instead of allowing action
- This is a **business rule**: only one item can be edited at a time
- `requestEdit` calls parent's `onStartEdit(id)` which sets `editingId` in parent
- `requestDelete` just opens confirmation modal (actual delete happens in `handleDelete`)

### Block 4: Cancel Edit

```jsx
  const cancelEdit = () => {
    onFinishEdit();
    setEditValues({});
  };
```

**Explanation:**
- Calls parent's `onFinishEdit()` (sets `editingId = null`)
- Clears local `editValues`

### Block 5: Edit Input Change Handler

```jsx
  const handleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };
```

**Explanation:**
- Functional update with spread operator
- `key` is the field name (e.g., "first_name")
- Used by inline inputs in edit mode

### Block 6: Confirm Update (Save)

```jsx
  const handleConfirm = async () => {
    const newErrors = {};

    for (const key of requiredKeys) {
      const value = editValues[key];
      const result = validateField(key, value, { required: true, entity: entityKey });
      if (!result.ok) {
        const title = getFieldTitle(entityKey, key);
        newErrors[key] = `${title}: ${result.error}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = { _id: rawItem._id, ...editValues };
      await updateEntity(apiPath, payload);
      showToast("success", `${entityName} updated successfully`);
      onFinishEdit();
      setEditValues({});
      setErrors({});
      onChanged?.();
    } catch (error) {
      if (error.fieldErrors) {
        // Map server-side field errors to inline errors. ShowCard uses
        // model keys directly (no kebab-case mapping), so use them as-is.
        setErrors(error.fieldErrors);
      } else {
        showToast("error", error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };
```

**Explanation:**
1. **Per-field validation** - Iterates over `requiredKeys` (not all fields). Calls `validateField(key, value, { required: true, entity: entityKey })`. The `entity` parameter enables entity-specific rules — e.g., medicine names allow numbers when `entityKey === "medicines"`.
2. **Error prefix** - Uses `getFieldTitle(entityKey, key)` to prepend a human-readable title (e.g. `"Name: name must contain only letters..."` instead of just the raw error).
3. **Inline errors** - Sets per-field errors for inline display. No toast for individual validation failures — errors appear below the relevant input.
4. **Payload** - Uses `editValues` directly (already normalized by onChange → entityConfig normalization on the server). No separate `sanitizeFormData` pass needed.
5. **API call** - `updateEntity(apiPath, payload)` from `lib/api.js`.
6. **Success** - Toast, close edit mode, clear values and errors, call `onChanged?.()`.
7. **Server-side errors** - If the server returns `fieldErrors` (from Mongoose validation failures like invalid email format or phone pattern), they are mapped directly to inline errors. Otherwise, a toast shows the error message (already sanitized — never exposes raw DB internals).
8. **Finally** - Reset loading state.

### Block 7: Delete Handler

```jsx
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEntity(apiPath, rawItem._id);
      showToast("success", `${entityName} deleted successfully`);
      setShowDeleteModal(false);
      onChanged?.();
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsDeleting(false);
    }
  };
```

**Explanation:**
- Similar pattern to update
- Calls `deleteEntity(apiPath, id)` 
- On success: toast, close modal, refresh parent
- No need to call `onFinishEdit` - deleting removes the item entirely

### Block 8: Render - Data Display

```jsx
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      {data.map((item, index) => {
        const key = dataKeys[index];
        return (
          <div key={index} className="text-sm text-light">
            <span className="font-semibold text-dark">{item.title}</span>
            {isEditing ? (
              <input
                type="text"
                value={editValues[key] ?? ""}
                onChange={(e) => handleEditChange(key, e.target.value)}
                className={`mt-1 w-full rounded-md border bg-(--color-surface) px-2 py-1 text-dark outline-none focus:border-secondary ${
                  errors[key] ? "border-red-500" : "border-(--color-border)"
                }`}
              />
            ) : (
            <span>: {item.value === undefined || item.value === null || item.value === "" ? "__" : item.value}</span>
            )}
            {isEditing && errors[key] && (
              <span className="text-xs text-red-500 block mt-1">{errors[key]}</span>
            )}
          </div>
        );
      })}
```

**Explanation:**
- Maps over `data` (pre-formatted title/value pairs from parent)
- `key = dataKeys[index]` - Gets the actual field name for `editValues` lookup
- **Read mode:** Shows label + value. When the value is `undefined`, `null`, or empty string — common for optional fields such as email (model default `""`) or medicine stock (`0` when unset) — the display renders `"__"` instead of blank space.
- **Edit mode:** Shows label + input field bound to `editValues[key]`, with correct `type` from entity metadata (e.g., `type="number"` for price/stock), `maxLength` from config, and inline error display
- `errors[key]` shows per-field validation errors with red border and text
- Uses index as key because `data` is derived from `dataKeys` which is stable

### Block 9: Render - Action Buttons

```jsx
      <div className="mt-2 flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Confirm"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="rounded-md border border-(--color-border) px-3 py-1.5 text-sm font-medium text-light transition-colors hover:bg-(--color-border)"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <Tooltip label="Edit">
              <button
                onClick={requestEdit}
                aria-label="Edit"
                className="rounded-md p-2 text-(--color-dark) transition-colors hover:bg-(--color-border)"
              >
                <Pencil size={18} />
              </button>
            </Tooltip>
            <Tooltip label="Delete">
              <button
                onClick={requestDelete}
                aria-label="Delete"
                className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </Tooltip>
          </>
        )}
      </div>
```

**Explanation:**
- **Edit mode:** Confirm (save) + Cancel buttons
- **View mode:** Edit (pencil) + Delete (trash) icon buttons wrapped in Tooltip
- `disabled={isSaving}` prevents double-clicks
- Lucide React icons: `Pencil`, `Trash2`
- Tooltip component shows label on hover

### Block 10: Delete Confirmation Modal

```jsx
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-dark">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-light">
              Are you sure you want to delete this {entityName.toLowerCase()}? This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-md border border-(--color-border) px-4 py-2 text-sm font-medium text-light transition-colors hover:bg-(--color-border)"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
```

**Explanation:**
- **Portal-like modal** - Fixed position overlay covering viewport (`fixed inset-0`)
- `z-60` - Above other content
- `bg-black/40` - Semi-transparent backdrop
- Centered with `flex items-center justify-center`
- Two buttons: Cancel (closes modal) and Delete (calls `handleDelete`)
- Disabled states during deletion

### Block 11: Blocked Action Modal

```jsx
      {showBlockedModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-dark">Action Blocked</h3>
            <p className="mt-2 text-sm text-light">
              Another record is currently being edited. Please finish or cancel the
              current edit before performing another action.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowBlockedModal(false)}
                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
```

**Explanation:**
- Similar modal structure
- Shown when user tries to edit/delete while another item is being edited
- Single "OK" button to dismiss

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Derived State** | `isEditing = editingId === rawItem._id` - computed from props, not stored |
| **Controlled by Parent** | `editingId`, `onStartEdit`, `onFinishEdit` - parent owns "which item is editing" state |
| **Concurrent Edit Prevention** | Business rule enforced in UI: only one edit at a time |
| **Optimistic UI Pattern** | Local `editValues` state during edit, sync to server on confirm |
| **Modal as Conditional Render** | `showDeleteModal && <Modal />` - simple React pattern for modals |
| **Fixed Position Overlay** | `fixed inset-0` creates full-screen backdrop for modals |
| **API Separation** | `updateEntity`, `deleteEntity` imported from `lib/api.js` - separation of concerns |
| **Optional Chaining** | `onChanged?.()` - safe callback invocation |

---

## Summary

**ShowCard.jsx** is a **feature-complete entity display card** that:
- Shows read-only data
- Switches to inline edit mode with correct input types from entity metadata
- Validates using shared `validateField()` (same rules as create form, entity-aware)
- Shows inline error messages with red borders under each input
- Sanitizes data via `mapFormDataToModel()` before update
- Confirms deletions with modal
- Prevents concurrent edits
- Communicates with parent via callbacks
- Uses API layer for server communication

It's a **smart component** (has state, effects, API calls) but receives configuration via props, making it reusable across Doctors, Patients, Medicines.

---

# components/EntityShow.jsx

## Purpose

A **generic list/view component** that fetches entities from an API, displays them in a paginated grid of `ShowCard` components, and handles loading/empty states.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EntityShow.jsx                             │
├─────────────────────────────────────────────────────────────────┤
│  Props:                                                         │
│  - apiPath: "/api/patients"                                     │
│  - dataTitles: ["First Name", "Last Name", "Birth Date"]       │
│  - dataKeys: ["first_name", "last_name", "birth_date"]         │
│  - requiredKeys: ["first_name", "last_name", "birth_date"]     │
│  - entityName: "Patient"                                        │
│  - itemsPerPage: 8                                              │
│  - searchKeys: ["first_name", "last_name"] (optional)          │
│  - searchPlaceholder: "Search by first or last name..."        │
│                                                                 │
│  Internal:                                                      │
│  - useEntities(apiPath) → { data, isLoading, refetch }         │
│  - useSearch(data, searchTerm, searchKeys) → filteredData     │
│  - Pagination state (currentPage)                               │
│  - Editing state (editingId)                                    │
│  - Transforms raw data → display data                           │
│  - Renders ShowCard grid + pagination controls                  │
└─────────────────────────────────────────────────────────────────┘
```

## Code Walkthrough

### Block 1: Imports and Props

```jsx
"use client";

import { useMemo, useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import SearchInput from "@/app/components/SearchInput";
import ShowCard from "@/app/components/ShowCard";
import { useEntities } from "@/app/lib/useEntities";
import { useSearch } from "@/app/lib/useSearch";

export default function EntityShow({
  apiPath,
  dataTitles,
  dataKeys,
  requiredKeys = [],
  entityName = "Record",
  loadingMessage = "Loading...",
  itemsPerPage = 8,
  searchKeys = [],
  searchPlaceholder = "Search...",
}) {
  const { data, isLoading, refetch: fetchData } = useEntities(apiPath);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
```

**Explanation:**
- `"use client"` - Uses hooks, interactivity
- `useEntities` - Custom hook from `lib/useEntities.js` that wraps `fetchEntities` with loading/error state
- `useMemo` - For expensive data transformation (memoizes `generatedData`)
- `useState` - For pagination and editing ID

### Block 2: Data Transformation with useMemo

```jsx
  const generatedData = useMemo(
    () =>
      data.map((item) =>
        dataKeys.map((key, index) => ({
          title: dataTitles[index],
          value: item[key],
        })),
      ),
    [data, dataKeys, dataTitles],
  );
```

**Explanation:**
- **Input:** Raw data from API: `[{ _id: "1", first_name: "John", last_name: "Doe", birth_date: "1990-01-01" }, ...]`
- **Output:** Formatted for ShowCard: `[[{ title: "First Name", value: "John" }, { title: "Last Name", value: "Doe" }, ...], ...]`
- `useMemo` - Only recomputes when `data`, `dataKeys`, or `dataTitles` change
- **Why?** This transformation runs on every render without memoization. With 100 items × 5 fields = 500 objects created per render. Memoization prevents this.

**How it works:**
```js
// For each item in data:
item = { _id: "1", first_name: "John", last_name: "Doe", birth_date: "1990-01-01" }
dataKeys = ["first_name", "last_name", "birth_date"]
dataTitles = ["First Name", "Last Name", "Birth Date"]

// Maps to:
[
  { title: "First Name", value: "John" },
  { title: "Last Name", value: "Doe" },
  { title: "Birth Date", value: "1990-01-01" }
]
```

### Block 3: Pagination Calculations

```jsx
  const totalPages = Math.ceil(generatedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = generatedData.slice(startIndex, endIndex);
```

**Explanation:**
- Simple math-based pagination
- `slice` creates new array with current page's items
- `generatedData.length` used for total pages (client-side pagination)

**Trade-off:** Client-side pagination loads all data upfront. Good for small datasets (<1000). For large datasets, need server-side pagination (API returns page + total count).

### Block 4: Page Reset Effect

```jsx
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
```

**Explanation:**
- When data changes (e.g., after delete), `totalPages` might decrease
- If current page > new total pages, reset to page 1
- Runs after every render where dependencies change

### Block 5: Pagination Handlers

```jsx
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };
```

**Explanation:**
- Functional updates `prev => ...` ensure latest state
- `Math.max/min` clamp values to valid range

### Block 6: Visible Pages Algorithm

```jsx
  const getVisiblePages = (pageCount, activePage, maxVisiblePages) => {
    if (pageCount <= maxVisiblePages) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const pages = [1];
    const middlePagesCount = Math.max(maxVisiblePages - 2, 1);
    const halfMiddleWindow = Math.floor(middlePagesCount / 2);

    let startPage = activePage - halfMiddleWindow;
    let endPage = startPage + middlePagesCount - 1;

    if (startPage < 2) {
      startPage = 2;
      endPage = startPage + middlePagesCount - 1;
    }

    if (endPage > pageCount - 1) {
      endPage = pageCount - 1;
      startPage = endPage - middlePagesCount + 1;
    }

    if (startPage > 2) {
      pages.push("ellipsis-left");
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    if (endPage < pageCount - 1) {
      pages.push("ellipsis-right");
    }

    pages.push(pageCount);

    return pages;
  };
```

**Explanation:**
- **Algorithm:** Shows first page, last page, and a window around current page
- **Example:** 20 pages, current page 10, max 9 visible → `[1, "...", 7, 8, 9, 10, 11, 12, 13, "...", 20]`
- **Ellipsis** represented as strings `"ellipsis-left"` / `"ellipsis-right"`
- **Desktop:** 9 visible pages, **Mobile:** 6 visible pages

### Block 7: Loading State

```jsx
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 mt-12">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }
```

**Explanation:**
- Early return while `useEntities` is fetching
- Shows `LoadingSpinner` component with custom message

### Block 8: Empty State

```jsx
  return (
    <div className="px-8 md:p-8 mt-12 flex-1">
      {generatedData.length === 0 ? (
        <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-10 text-center text-light shadow-xl shadow-(color:--color-shadow)">
          <p>No data available.</p>
        </div>
      ) : (
        <>
          {/* Grid of ShowCards */}
          <div className="grid md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {currentData.map((item, index) => (
              <ShowCard
                key={item._id ?? index}
                data={item}
                rawItem={data[startIndex + index]}
                dataKeys={dataKeys}
                requiredKeys={requiredKeys}
                apiPath={apiPath}
                entityName={entityName}
                onChanged={fetchData}
                editingId={editingId}
                onStartEdit={setEditingId}
                onFinishEdit={() => setEditingId(null)}
              />
            ))}
          </div>
```

**Explanation:**
- **Grid layout:** 1 col mobile, 4 col desktop (`md:grid-cols-4`)
- **Key:** Uses `item._id` if available, falls back to index
- **`rawItem`:** `data[startIndex + index]` - gets original item from full data array (needed for `_id` and all fields)
- **Props passed to ShowCard:** All configuration + callbacks

### Block 9: Desktop Pagination

```jsx
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mt-8 md:mt-12">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="hidden md:block rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Previous
              </button>

              <div className="hidden md:flex gap-2 order-first md:order-0">
                {desktopPageItems.map((pageItem, index) =>
                  pageItem === "ellipsis-left" || pageItem === "ellipsis-right" ? (
                    <span
                      key={`${pageItem}-${index}`}
                      className="rounded-lg px-3 py-2 text-light"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageItem}
                      onClick={() => handlePageClick(pageItem)}
                      className={`rounded-lg px-3 py-2 ${
                        currentPage === pageItem
                          ? "bg-secondary text-white"
                          : "bg-(--color-surface-muted) text-light hover:bg-(--color-border)"
                      }`}
                    >
                      {pageItem}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="hidden md:block rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Next
              </button>
```

**Explanation:**
- **Responsive:** `hidden md:block` - hides on mobile, shows on desktop
- **Order:** `order-first md:order-0` - on mobile, page numbers appear first (above Prev/Next)
- **Active page:** Different styling (`bg-secondary text-white`)
- **Ellipsis:** Rendered as `<span>...</span>`

### Block 10: Mobile Pagination

```jsx
              <div className="md:hidden w-full flex flex-col gap-2">
                <div className="flex gap-1.5 justify-center">
                  {mobilePageItems.map((pageItem, index) =>
                    pageItem === "ellipsis-left" || pageItem === "ellipsis-right" ? (
                      <span
                        key={`${pageItem}-${index}`}
                        className="rounded-lg px-3 py-2 text-light"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageItem}
                        onClick={() => handlePageClick(pageItem)}
                        className={`rounded-lg px-3 py-2 ${
                          currentPage === pageItem
                            ? "bg-secondary text-white"
                            : "bg-(--color-surface-muted) text-light hover:bg-(--color-border)"
                        }`}
                      >
                        {pageItem}
                      </button>
                    ),
                  )}
                </div>
                <div className="w-full flex justify-between gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="rounded-lg bg-secondary w-1/2 px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="rounded-lg bg-secondary w-1/2 px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Explanation:**
- **Mobile-first:** `md:hidden` shows only on mobile
- **Stacked layout:** Page numbers above Prev/Next buttons
- **Full-width buttons:** `w-1/2` each for thumb-friendly targets
- Same logic, different presentation

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Custom Hook (`useEntities`)** | Encapsulates data fetching logic, reusable across components |
| **useMemo for Transformations** | Avoids recomputing derived data on every render |
| **Client-Side Pagination** | All data loaded once, sliced for display - simple but not scalable |
| **Responsive Pagination** | Different UI for mobile vs desktop using Tailwind breakpoints |
| **Ellipsis Algorithm** | Shows first, last, and window around current page |
| **Prop Drilling for Callbacks** | `onChanged={fetchData}` passes refetch function down to ShowCard |
| **Controlled Editing State** | Parent (`EntityShow`) owns `editingId`, children request changes |

---

## Summary

**EntityShow.jsx** is a **generic, reusable list component** that:
1. Fetches data via `useEntities` hook
2. Transforms raw data to display format (memoized)
3. Handles pagination (client-side)
4. Renders grid of `ShowCard` components
5. Manages which card is being edited
6. Provides responsive pagination UI

**Configuration via props** makes it work for Doctors, Patients, Medicines without code changes.

## Search Feature

EntityShow supports an optional **client-side real-time search** via two new props:

| Prop | Type | Description |
|------|------|-------------|
| `searchKeys` | `string[]` | Field keys to search (e.g. `["first_name", "last_name"]`) |
| `searchPlaceholder` | `string` | Placeholder text for the search input |

### How it works

1. `SearchInput` (a shared component) renders above the card grid with a magnifying-glass icon and a clear (`×`) button that appears only when text is present.
2. On every `onChange`, the search term is stored in `searchTerm` state and the page resets to 1.
3. `useSearch` (in `lib/useSearch.js`) memoizes the filtered list — it only recomputes when `data`, `searchTerm`, or `searchKeys` change.
4. The filtered list feeds into the existing `generatedData` memo, so pagination and rendering work unchanged.

### Matching rules

- Case-insensitive (`toLowerCase()`).
- Leading/trailing whitespace trimmed.
- Uses `startsWith()` (not `includes()`).
- For multi-field entities (doctors/patients), the term is also compared against the normalized full name (`first_name + " " + last_name`), so `"ali mo"` matches `"Ali Mohammadi"`.

### Entity configuration

| Entity | `searchKeys` | `searchPlaceholder` |
|--------|-------------|---------------------|
| Doctors | `["first_name", "last_name"]` | `Search by first or last name...` |
| Patients | `["first_name", "last_name"]` | `Search by first or last name...` |
| Medicines | `["name"]` | `Search by medicine name...` |

---

# components/Toast.jsx

## Purpose

A **single toast notification** component with animated entrance/exit, icon support for different types, and auto-dismiss timer.

## High-Level Architecture

```
ToastProvider (manages queue)
    │
    └──► Renders multiple <Toast /> components
            │
            ├──► success: green, checkmark icon
            ├──► error: red, X icon
            ├──► warning: yellow, triangle icon
            └──► info: blue, info icon
```

## Code Walkthrough

### Block 1: Icon Definitions

```jsx
"use client";

import { useCallback, useEffect, useState } from "react";

const ICONS = {
  success: (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};
```

**Explanation:**
- **Inline SVG icons** - No external icon library needed for toasts
- `aria-hidden="true"` - Icons are decorative, screen readers read the message text
- `fill="currentColor"` - Inherits text color from parent (set by `ICON_STYLES`)
- `shrink-0` - Prevents icon from shrinking in flex container

### Block 2: Style Mappings

```jsx
const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_STYLES = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};
```

**Explanation:**
- **Tailwind color classes** for each toast type
- Background, border, and text colors coordinated
- Separate icon colors for visibility

### Block 3: Component Definition

```jsx
export default function Toast({ id, message, type = "success", onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
```

**Props:**
- `id` - Unique identifier for dismissal
- `message` - Text to display
- `type` - "success" | "error" | "warning" | "info"
- `onClose` - Callback when animation completes (removes from provider's array)
- `duration` - Auto-dismiss timeout (default 5s)

**State:**
- `isVisible` - Controls render (false = unmount)
- `isExiting` - Controls exit animation

### Block 4: Dismiss Function

```jsx
  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  }, [id, onClose]);
```

**Explanation:**
- `useCallback` - Stable reference for useEffect dependency
- **Two-phase exit:**
  1. `setIsExiting(true)` - Triggers CSS exit animation (slide out)
  2. After 300ms (animation duration): `setIsVisible(false)` + `onClose(id)` - Removes from DOM
- **Why 300ms?** Matches CSS `duration-300` transition

### Block 5: Auto-Dismiss Effect

```jsx
  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);
```

**Explanation:**
- Sets timer on mount
- **Cleanup function** clears timer if component unmounts early (prevents memory leaks)
- Dependencies: `dismiss` (stable from useCallback) and `duration`

### Block 6: Early Return

```jsx
  if (!isVisible) return null;
```

**Explanation:**
- After exit animation, `isVisible` becomes false
- Component returns `null` - removed from React tree
- `onClose` already called to remove from provider's state

### Block 7: Render

```jsx
  const Icon = ICONS[type] || ICONS.success;
  const containerStyle = STYLES[type] || STYLES.success;
  const iconStyle = ICON_STYLES[type] || ICON_STYLES.success;

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isExiting
          ? "translate-x-[-110%] opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={`${containerStyle} border shadow-lg rounded-xl px-4 py-3 min-w-75 max-w-md flex items-start gap-3`}>
        <span className={`${iconStyle} mt-0.5`} aria-hidden="true">
          {Icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity p-1 ml-2"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

**Explanation:**
- **Animation classes:** 
  - Enter: `translate-x-0 opacity-100 scale-100` (normal position)
  - Exit: `translate-x-[-110%] opacity-0 scale-95` (slides left, fades, shrinks)
- **Accessibility:**
  - `role="alert"` - Screen readers announce immediately
  - `aria-live="polite"` - Announces updates without interrupting
  - `aria-label="Dismiss"` on close button
- **Layout:** Flex container with icon, message (flex-1), dismiss button
- **`min-w-75 max-w-md`** - Constrains width (Tailwind arbitrary values)

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Inline SVGs** | No icon library dependency, styleable with `currentColor` |
| **Two-Phase Animation** | `isExiting` state triggers CSS transition, then unmount |
| **useCallback for Event Handlers** | Stable reference for useEffect dependencies |
| **useEffect Cleanup** | `clearTimeout` prevents memory leaks |
| **Accessibility (a11y)** | `role="alert"`, `aria-live`, `aria-label` |
| **CSS Transform Animations** | `translate-x`, `opacity`, `scale` for smooth transitions |

---

## Summary

**Toast.jsx** is a **polished, accessible notification component** with:
- 4 semantic types (success/error/warning/info)
- Smooth enter/exit animations
- Auto-dismiss with configurable duration
- Manual dismiss button
- Full keyboard/screen reader support

Used by `ToastProvider` which manages the queue.

---

# components/ToastProvider.jsx

## Purpose

A **React Context Provider** that manages a queue of toast notifications. Provides `showToast` function to any component in the tree.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ToastProvider                              │
├─────────────────────────────────────────────────────────────────┤
│  State:                                                         │
│  - toasts: [{ id, message, type, duration }, ...]              │
│  - toastIdCounter: ref (incrementing ID)                       │
│  - recentToasts: ref (Map for duplicate prevention)            │
│                                                                 │
│  Context Value: { showToast }                                   │
│                                                                 │
│  Render:                                                        │
│  - Children                                                     │
│  - Fixed position container (top-left)                         │
│  - Maps toasts array → <Toast /> components                    │
└─────────────────────────────────────────────────────────────────┘
```

## Code Walkthrough

### Block 1: Imports and Context Creation

```jsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
```

**Explanation:**
- `createContext(null)` - Default value null (will throw if used outside provider)
- `useToast()` - Custom hook that consumes context, throws helpful error if misused
- **Pattern:** Context + custom hook = clean API for consumers

### Block 2: Provider Component

```jsx
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const recentToasts = useRef(new Map());
```

**State/Refs:**
- `toasts` - Array of toast objects (triggers re-render when changed)
- `toastIdCounter` - `useRef` for unique IDs (doesn't trigger render)
- `recentToasts` - `useRef(Map)` for duplicate prevention (doesn't trigger render)

**Why refs for counter and map?** They're implementation details that don't need to trigger re-renders. Only `toasts` array changes should update UI.

### Block 3: showToast Function

```jsx
  const showToast = useCallback((type = "success", message, options = {}) => {
    const {
      duration = 5000,
      preventDuplicate = true,
      duplicateWindow = 3000,
    } = options;

    // Prevent duplicate toasts within a time window
    if (preventDuplicate) {
      const key = `${type}:${message}`;
      const now = Date.now();
      const lastShown = recentToasts.current.get(key);

      if (lastShown && now - lastShown < duplicateWindow) {
        return; // Skip duplicate
      }
      recentToasts.current.set(key, now);

      // Clean up old entries
      setTimeout(() => {
        recentToasts.current.delete(key);
      }, duplicateWindow);
    }

    const id = ++toastIdCounter.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);
```

**Explanation:**
- `useCallback` with empty deps - Stable reference, never recreated
- **Duplicate Prevention:**
  - Key = `"type:message"` (e.g., `"error:Failed to fetch"`)
  - Checks if same toast shown within `duplicateWindow` (3s default)
  - If duplicate, returns early (doesn't add to queue)
  - Stores timestamp in Map, cleans up after window expires
- **Adding Toast:**
  - Increments counter ref
  - Functional state update: `prev => [...prev, newToast]`
  - New toast object: `{ id, message, type, duration }`

**Why functional update?** `setToasts` might be called multiple times rapidly. Functional form ensures each update sees latest array.

### Block 4: removeToast Function

```jsx
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
```

**Explanation:**
- Called by `Toast` component's `onClose` after exit animation
- Filters out toast by ID
- Functional update for same reason as above

### Block 5: Render

```jsx
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

**Explanation:**
- **Provider** wraps children + toast container
- **Toast Container:** `fixed top-4 left-4 z-50` - Top-left corner, above everything
- `pointer-events-none` on container, `pointer-events-auto` on each toast - Allows clicks on toasts but not container
- **Maps toasts array** to `<Toast />` components
- Each toast gets unique `key={toast.id}`
- Passes `removeToast` as `onClose` callback

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **React Context** | Global state without prop drilling |
| **Custom Hook for Context** | `useToast()` provides clean API + error checking |
| **useRef for Non-Reactive State** | Counter and duplicate map don't need to trigger renders |
| **Duplicate Prevention** | Map with timestamps + setTimeout cleanup |
| **Functional State Updates** | `prev => ...` ensures consistency with rapid calls |
| **Portal-Like Pattern** | Fixed container at root level, not portal API but same effect |
| **z-index Management** | `z-50` ensures toasts above all content |

---

## Summary

**ToastProvider.jsx** implements a **toast notification system** using:
- **Context API** for global access
- **Refs** for internal bookkeeping (IDs, deduplication)
- **State** for the toast queue (triggers renders)
- **Callback pattern** for components to trigger toasts

Usage in components:
```jsx
const { showToast } = useToast();
showToast("success", "Saved!");
showToast("error", "Failed!", { duration: 10000 });
```

---

# components/Tooltip.jsx

## Purpose

A **simple, CSS-only tooltip** component that shows a label on hover. No JavaScript state needed.

## Code Walkthrough

```jsx
export default function Tooltip({ label, children, position = "top" }) {
  const posClasses =
    position === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs font-medium text-dark opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${posClasses}`}
      >
        {label}
      </span>
    </span>
  );
}
```

### Block-by-Block Explanation

**Props:**
- `label` - Tooltip text
- `children` - Element to wrap (button, icon, etc.)
- `position` - "top" (default) or "bottom"

**Position Classes:**
```jsx
position === "top"
  ? "bottom-full left-1/2 -translate-x-1/2 mb-2"   // Above, centered, 8px gap
  : "top-full left-1/2 -translate-x-1/2 mt-2";     // Below, centered, 8px gap
```
- `left-1/2 -translate-x-1/2` - Centers tooltip horizontally on parent
- `bottom-full` / `top-full` - Positions relative to parent's top/bottom edge

**Wrapper:**
```jsx
<span className="relative inline-flex group">
```
- `relative` - Tooltip positions absolutely relative to this
- `inline-flex` - Shrinks to fit content
- `group` - Tailwind group-hover parent

**Tooltip Element:**
```jsx
<span
  role="tooltip"
  className={`... opacity-0 ... group-hover:opacity-100 ${posClasses}`}
>
  {label}
</span>
```
- `role="tooltip"` - Accessibility
- `pointer-events-none` - Tooltip doesn't block mouse events
- `opacity-0` → `group-hover:opacity-100` - CSS-only show/hide
- `transition-opacity duration-150` - Smooth fade
- `z-50` - Above other content
- CSS variables for theming: `border-(--color-border)`, `bg-(--color-surface)`

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **CSS-Only Tooltip** | No JS state, uses `:hover` on parent (`group-hover`) |
| **Tailwind Group Hover** | `group` on parent, `group-hover:` on child |
| **Centering Technique** | `left-1/2 -translate-x-1/2` centers absolutely positioned element |
| **Accessibility** | `role="tooltip"` identifies purpose to screen readers |
| **CSS Variables in Tailwind** | `border-(--color-border)` uses arbitrary value syntax |

---

## Summary

**Tooltip.jsx** is a **zero-JS, pure CSS tooltip** using Tailwind's `group-hover`. Lightweight, accessible, themeable. Used in ShowCard for Edit/Delete button labels.

---

# lib/api.js

## Purpose

**Single source of truth for all API operations.** Contains:
1. **Client-side helpers** - `fetchEntities`, `createEntity`, `updateEntity`, `deleteEntity` (used by React components)
2. **Server-side handlers** - `createPostHandler`, `createPutHandler`, `createDeleteHandler` (used by Next.js route handlers)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        lib/api.js                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENT-SIDE (runs in browser)                                 │
│  ─────────────────────────────────                             │
│  fetchEntities(apiPath)     → GET  /api/xxx                    │
│  createEntity(apiPath, data) → POST /api/xxx                   │
│  updateEntity(apiPath, data) → PUT  /api/xxx                   │
│  deleteEntity(apiPath, id)   → DELETE /api/xxx                 │
│                                                                 │
│  SERVER-SIDE (runs in Next.js route handlers)                  │
│  ─────────────────────────────────────────────────             │
│  createPostHandler(Model, requiredFields, entityName)          │
│    → Returns POST handler with duplicate checking              │
│  createPutHandler(Model, requiredFields, entityName)           │
│    → Returns PUT handler with duplicate checking               │
│  createDeleteHandler(Model, entityName)                        │
│    → Returns DELETE handler                                    │
│                                                                 │
│  SHARED: parseResponse() - handles JSON parsing + errors       │
│  SHARED: extractValidationMessage() - maps Mongoose errors       │
│  SHARED: buildValidationBody() - converts to { fieldErrors }    │
│  SHARED: buildDuplicateQuery() - constructs duplicate query     │
└─────────────────────────────────────────────────────────────────┘
```

## Code Walkthrough

### Block 1: Shared Response Parser

```jsx
async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      result.error ||
      result.message ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    if (result.fieldErrors) {
      err.fieldErrors = result.fieldErrors;
    }
    throw err;
  }
  return result;
}
```

**Explanation:**
- **Single responsibility** - All fetch calls use this
- `response.json().catch(() => ({}))` - Handles non-JSON responses gracefully
- Throws `Error` with server message or fallback
- **fieldErrors attachment** - When the server returns `{ fieldErrors }` (from Mongoose validation failures), the error object gets a `fieldErrors` property so the frontend can display inline messages instead of a generic toast
- Callers use `try/catch` to handle

### Block 2: Client-Side Helpers

```jsx
/** GET all records for an entity. */
export async function fetchEntities(apiPath) {
  const response = await fetch(apiPath);
  return parseResponse(response);
}

/** POST a new record. */
export async function createEntity(apiPath, payload) {
  const response = await fetch(apiPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

/** PUT (update) an existing record. */
export async function updateEntity(apiPath, payload) {
  const response = await fetch(apiPath, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

/** DELETE a record by id. */
export async function deleteEntity(apiPath, id) {
  const response = await fetch(apiPath, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _id: id }),
  });
  return parseResponse(response);
}
```

**Explanation:**
- **Thin wrappers** around `fetch` with consistent options
- All use `parseResponse` for error handling
- `deleteEntity` sends `_id` in body (not URL) - matches server handler expectation
- **No external dependencies** - Uses native `fetch`

**Why not axios?** Zero dependencies, native API, sufficient for this use case. Axios adds ~13kb.

### Block 3: Lazy DB Connection

```jsx
async function connectToDBSafe() {
  const { connectToDB } = await import("@/app/lib/mongodb");
  await connectToDB();
}
```

**Explanation:**
- **Dynamic import** (`import()`) - Loads module at runtime, not bundle time
- **Critical for Turbopack/Next.js** - Prevents Mongoose/Node builtins from entering client bundle
- Only called inside server route handlers (never in browser)
- Returns a promise that resolves when DB connected

**Why not top-level import?** `import "@/app/lib/mongodb"` at top level would pull Mongoose into client bundle, causing build errors (Node builtins like `crypto`, `fs` not available in browser).

### Block 4: Server-Side Validation and Error Helpers

```js
function extractValidationMessage(error) {
  // Mongoose ValidationError → 400 with field-level errors
  if (error?.name === "ValidationError") {
    const errors = error.errors || {};
    const fieldErrors = {};
    for (const [path, e] of Object.entries(errors)) {
      fieldErrors[path] = e.message;
    }
    return Object.keys(fieldErrors).length ? { fieldErrors } : null;
  }
  // Mongoose CastError → 400
  if (error?.name === "CastError") {
    return `Invalid value for ${error.path}: ${error.value}`;
  }
  // MongoDB duplicate key (code 11000) — translated to safe message
  // NEVER expose the raw E11000 text which leaks collection/db/index info.
  if (error?.code === 11000) {
    return "A record with these values already exists.";
  }
  return null;
}

function buildValidationBody(validationMessage) {
  if (typeof validationMessage === "string") {
    return { error: validationMessage };
  }
  if (validationMessage && typeof validationMessage === "object" && "fieldErrors" in validationMessage) {
    return { fieldErrors: validationMessage.fieldErrors };
  }
  return { error: "Invalid input data." };
}
```

**Explanation:**
- `extractValidationMessage` replaces the old inline Mongoose error handling. Centralizes all known-error-to-message mapping.
- **ValidationError** — Returns `{ fieldErrors }` (keyed by field path) instead of a joined string. This allows the frontend to display inline validation messages per field rather than a generic toast. The structure matches both Mongoose's native `ValidationError.errors` and the custom `ValidationError` thrown by `normalizeAndValidate`.
- **E11000 handling** — MongoDB duplicate-key errors are caught and translated to a clean message. The raw error text (which leaks the database name, collection name, index name and key values) is never returned to the client. The real error is logged server-side via `console.error()`.
- `buildValidationBody` — Converts the result of `extractValidationMessage` into a response body. `{ fieldErrors }` objects produce `{ fieldErrors }` in the JSON response; plain strings produce `{ error }`. This is used by all catch blocks in the POST/PUT/DELETE handlers.
- `buildDuplicateQuery` constructs a MongoDB query object from only the fields that have non-empty values. If no field is present, returns `undefined` to skip the duplicate check entirely — the model will reject the record via its own validators instead.

### Block 5: createPostHandler (Factory Function)

```jsx
export function createPostHandler(Model, requiredFields, entityName, normalize) {
  return async function POST(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? await normalize(body) : body;

      // Doctor-specific duplicate detection (phone-reuse rules)
      if (entityName === "Doctor") {
        const { first_name, last_name, specialization, phone } = data;
        if (phone) {
          const docsWithPhone = await Model.find({ phone });
          if (docsWithPhone.length > 0) {
            // Different person with same phone → reject
            const differentPerson = docsWithPhone.some(
              (d) => d.first_name !== first_name || d.last_name !== last_name,
            );
            if (differentPerson) {
              return Response.json(
                { error: "Phone number is already used by another doctor." },
                { status: 409 },
              );
            }
            // Same person, same specialization → exact duplicate
            const sameSpec = docsWithPhone.some((d) => d.specialization === specialization);
            if (sameSpec) {
              return Response.json(
                { error: "Doctor already exists with the same first name, last name, phone and specialization." },
                { status: 409 },
              );
            }
            // Same person, different specialization → allowed!
          }
        }
      } else {
        // Standard duplicate detection for other entities
        const duplicateQuery = buildDuplicateQuery(data, requiredFields);
        if (duplicateQuery) {
          const existing = await Model.findOne(duplicateQuery);
          if (existing) {
            return Response.json(
              { error: `${entityName} already exists with the same ${requiredFields.join(", ")}.` },
              { status: 409 },
            );
          }
        }
      }

      const doc = await Model.create(data);
      return Response.json(doc, { status: 201 });
    } catch (error) {
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(buildValidationBody(validationMessage), { status: 400 });
      }
      // Log the real error server-side, return a generic safe message.
      console.error(`POST ${entityName} failed:`, error);
      return Response.json(
        { error: `Error while creating ${entityName.toLowerCase()}. Please try again.` },
        { status: 500 },
      );
    }
  };
}
```

**Explanation:**
- **Factory function** — Returns a handler function (higher-order function)
- **Parameters:**
  - `Model` — Mongoose model (Doctor, Patient, Medicine)
  - `requiredFields` — Array used for standard duplicate detection
  - `entityName` — Human name for error messages and branching logic
  - `normalize` — Optional async function to transform/validate body before save
- **Doctor-specific duplicate logic** (only when `entityName === "Doctor"`):
  - Same name + same phone + same specialization → 409 (exact duplicate)
  - Same name + same phone + different specialization → allowed (one doctor with multiple specializations)
  - Different name + same phone → 409 (phone reuse by different people)
  - This logic replaces the old DB-level unique index on the phone field
- **Standard entities:** Uses `buildDuplicateQuery` to check exact match on provided fields
- **Error safety:** All 500-level errors are logged to server console but return a generic `. Please try again.` message. Known errors (ValidationError, CastError, E11000) are translated to friendly 400 responses.

### Block 6: createPutHandler

```jsx
export function createPutHandler(Model, requiredFields, entityName, normalize) {
  return async function PUT(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? normalize(body) : body;
      const { _id } = data;

      if (!_id) { ... }  // 400 if missing

      const existing = await Model.findById(_id);
      if (!existing) { ... }  // 404 if not found

      // Duplicate check (same Doctor-specific logic as POST)
      if (entityName === "Doctor") {
        // Same rules: find others with same phone, reject if wrong person
        // or same specialization, allow if different spec
        const others = await Model.find({ phone, _id: { $ne: _id } });
        // ... same logic as POST above ...
      } else {
        // Standard duplicate check excluding self
        const duplicateQuery = buildDuplicateQuery(data, requiredFields);
        if (duplicateQuery) {
          duplicateQuery._id = { $ne: _id };
          const duplicate = await Model.findOne(duplicateQuery);
          if (duplicate) { ... }  // 409
        }
      }

      // Remove _id from update data and save
      const { _id: omitted, ...updateData } = data;
      const updated = await Model.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });
      return Response.json(updated, { status: 200 });
    } catch (error) {
      // Same error handling pattern: extractKnown → 400, else log + generic
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(buildValidationBody(validationMessage), { status: 400 });
      }
      console.error(`PUT ${entityName} failed:`, error);
      return Response.json(
        { error: `Error while updating ${entityName.toLowerCase()}. Please try again.` },
        { status: 500 },
      );
    }
  };
}
```

**Explanation:**
- Identical Doctor-specific and standard duplicate logic as POST, but excludes the current document (`_id: { $ne: _id }`)
- Same error sanitization pattern — unknown errors are logged, not leaked

### Block 7: createDeleteHandler

```jsx
export function createDeleteHandler(Model, entityName) {
  return async function DELETE(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const { _id } = body;

      if (!_id) { ... }  // 400
      const existing = await Model.findById(_id);
      if (!existing) { ... }  // 404

      await Model.findByIdAndDelete(_id);
      return Response.json({ message: `${entityName} deleted successfully.` }, { status: 200 });
    } catch (error) {
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(buildValidationBody(validationMessage), { status: 400 });
      }
      console.error(`DELETE ${entityName} failed:`, error);
      return Response.json(
        { error: `Error while deleting ${entityName.toLowerCase()}. Please try again.` },
        { status: 500 },
      );
    }
  };
}
```

**Explanation:**
- Same error sanitization as POST/PUT
- The raw `error.message` is never returned to the client

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
|| **Factory Functions** | `createPostHandler` returns a handler - eliminates boilerplate |
|| **Dynamic Import** | `await import(...)` loads server-only code at runtime |
|| **Next.js Response** | `Response.json(data, { status })` - Web standard Response API |
|| **Mongoose Methods** | `findOne`, `create`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete` |
|| **Duplicate Detection** | Doctor-specific (phone-reuse rules via app logic) or standard query-based |
|| **Normalize Parameter** | Each route passes `normalizeAndValidate` for consistent validation |
|| **Error Sanitization** | Known errors (ValidationError, CastError, E11000) → 400 with fieldErrors; unknown → logged, generic 500 |
|| **buildValidationBody** | Converts extractValidationMessage result to response body: { fieldErrors } for ValidationError, { error } for strings |
|| **E11000 Mapping** | MongoDB duplicate-key errors are translated to a safe message, never leaked |
|| **Inline Validation** | Server returns { fieldErrors } keyed by field path; frontend maps to inline errors via reverse field mapping |
|| **$ne Operator** | MongoDB "not equal" - excludes current doc from duplicate check |
|| **runValidators** | Ensures schema validation runs on updates |
|| **Defense in Depth** | Four validation layers: client `validateField`, server `normalizeAndValidate`, app logic (doctor duplicates), Mongoose schema |

## Summary

**lib/api.js** is the **backbone of the API layer**:
- **Client side:** 4 simple fetch wrappers with `parseResponse` that attaches `fieldErrors` to thrown errors
- **Server side:** 3 factory functions that generate route handlers
- **Shared:** Response parsing, error extraction (`extractValidationMessage`), body building (`buildValidationBody`), and duplicate query building utilities
- **Architecture:** Separates HTTP concerns from business logic, enables reuse across entities, provides consistent error handling without leaking internal details

---

# lib/empty-stub.js

## Purpose

**Turbopack alias target** - An empty module that replaces `@/app/lib/mongodb` in the **browser bundle** to prevent server-only code (Mongoose, MongoDB driver, Node builtins) from being included in the client bundle.

## Code

```js
// Empty stub used to satisfy Turbopack's client bundle when the server-only
// `@/app/lib/mongodb` module is referenced through the lazily-imported path in
// `api.js`. This module is never executed in the browser — only inside server
// route handlers — so an empty module is safe for the client build.
const emptyStub = {};

export default emptyStub;
```

## Explanation

**The Problem:**
- `lib/api.js` is imported by **both** client components (for `fetchEntities`, etc.) AND server route handlers (for `createPostHandler`, etc.)
- Server handlers use `await import("@/app/lib/mongodb")` (dynamic import)
- Turbopack sees the import string and tries to include `mongodb` in the client bundle
- Mongoose depends on Node builtins (`crypto`, `fs`, `net`, etc.) → **Build fails**

**The Solution:**
- `next.config.mjs` aliases `@/app/lib/mongodb` → `./src/app/lib/empty-stub.js` **only for browser**
- Server build uses real module
- Client build gets empty object `{}`
- Dynamic import in server handler resolves to real module at runtime (Node.js)

**Why Empty Object?** The dynamic import is `const { connectToDB } = await import(...)`. In browser, this never executes (server-only code). But TypeScript/ESLint need the module to exist. Empty object satisfies imports without pulling dependencies.

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Turbopack Resolve Alias** | Redirects imports based on target (browser vs server) |
| **Dynamic Import** | `await import()` - runtime loading, not bundled statically |
| **Server-Only Code** | Code that only runs in Node.js environment |
| **Bundle Splitting** | Keeping server deps out of client bundle |
| **Empty Module Pattern** | Minimal stub to satisfy build-time resolution |

---

## Summary

**empty-stub.js** is a **build-time trick** that enables `lib/api.js` to be shared between client and server without pulling Mongoose into the browser bundle. It's never actually executed in the browser.

---

# lib/useEntities.js

## Purpose

A **custom React hook** that encapsulates data fetching logic for entity lists. Provides loading state, error handling, and refetch function.

## Code Walkthrough

```jsx
import { useCallback, useEffect, useState } from "react";
import { fetchEntities } from "./api";

/**
 * Reusable data-fetching hook for entity GET operations.
 * Encapsulates loading state, error handling, and refetch logic.
 *
 * @param {string} apiPath - The entity API endpoint.
 * @returns {{ data, isLoading, error, refetch }}
 */
export function useEntities(apiPath) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await fetchEntities(apiPath);
      setData(responseData);
    } catch (err) {
      console.error(err);
      setError(err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
```

### Block-by-Block Explanation

**State:**
```jsx
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
```
- `data` - Array of entities (empty initially)
- `isLoading` - True on initial load and refetch
- `error` - Error object if fetch fails

**Refetch Function:**
```jsx
const refetch = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const responseData = await fetchEntities(apiPath);
    setData(responseData);
  } catch (err) {
    console.error(err);
    setError(err);
    setData([]);
  } finally {
    setIsLoading(false);
  }
}, [apiPath]);
```
- `useCallback` - Stable reference (dependency for useEffect)
- **Dependency:** `[apiPath]` - Recreates if API path changes
- **Sequence:** Loading → Fetch → Success/Error → Not Loading
- **Error Handling:** Logs to console, sets error state, clears data
- **Finally:** Always resets loading

**Initial Fetch:**
```jsx
useEffect(() => {
  refetch();
}, [refetch]);
```
- Runs on mount and when `refetch` changes (i.e., `apiPath` changes)
- Triggers initial data load

**Return Value:**
```jsx
return { data, isLoading, error, refetch };
```
- Object with data, loading state, error, and refetch function
- Consumer (EntityShow) uses all four

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Custom Hook** | Reusable stateful logic extracted from components |
| **useCallback** | Memoizes function, stable reference for dependencies |
| **useEffect for Side Effects** | Data fetching on mount/dependency change |
| **Loading/Error/Data Pattern** | Standard async state management |
| **Functional Updates Not Needed** | Setters called once per fetch, no rapid updates |

---

## Summary

**useEntities.js** is a **specialized data fetching hook** that:
- Abstracts `fetchEntities` call
- Manages loading/error/data states
- Provides `refetch` for manual refresh
- Used by `EntityShow` to display entity lists

**Why not React Query / SWR?** Zero dependencies, simple needs, good learning exercise. For production apps with caching, deduplication, background refetch - use TanStack Query.

---

# lib/entityConfig.js

## Purpose

**Centralized configuration** for all entities. Defines API paths, field mappings, and rich field metadata (required, type, validation rules). Provides helpers for validation and required field lookups.

## Code Walkthrough

### Block 1: ENTITY_CONFIG Object

```js
export const ENTITY_CONFIG = {
  doctors: {
    apiPath: "/api/doctors",
    entityName: "Doctor",
    fieldMapping: {
      "first-name": "first_name",
      "last-name": "last_name",
      specialization: "specialization",
      phone: "phone",
      email: "email",
    },
    requiredFields: ["first_name", "last_name", "specialization", "phone"],
    duplicateFields: ["first_name", "last_name", "specialization"],
    requiredFieldTitles: {
      first_name: "First Name",
      last_name: "Last Name",
      specialization: "Specialization",
      phone: "Phone",
    },
  },
  medicines: {
    apiPath: "/api/medicines",
    entityName: "Medicine",
    fieldMapping: {
      name: "name",
      description: "description",
      price: "price",
      stock: "stock",
    },
    requiredFields: ["name", "description", "price"],
    duplicateFields: ["name", "description"],
    requiredFieldTitles: {
      name: "Name",
      description: "Description",
      price: "Price",
    },
  },
  patients: {
    apiPath: "/api/patients",
    entityName: "Patient",
    fieldMapping: {
      "first-name": "first_name",
      "last-name": "last_name",
      "birth-date": "birth_date",
      disease: "disease",
    },
    requiredFields: ["first_name", "last_name", "birth_date", "disease"],
    duplicateFields: ["first_name", "last_name", "birth_date", "disease"],
    requiredFieldTitles: {
      first_name: "First Name",
      last_name: "Last Name",
      birth_date: "Birth Date",
      disease: "Disease",
    },
  },
};
```

**Structure per entity:**
|- `apiPath` - REST endpoint
|- `entityName` - Display name (for toasts, modals)
|- `fieldMapping` - **Form key → Model key** (kebab-case → snake_case)
|- `requiredFields` - Model keys that must be non-empty before submit
|- `duplicateFields` - Model keys used for duplicate detection (backend)
|- `requiredFieldTitles` - Human-readable titles for required fields, used by inline edit validation to show friendly messages instead of raw snake_case keys

### Block 2: mapFormDataToModel

```js
import { normalizeWhitespace } from "./validation";

export function mapFormDataToModel(formData, mapping) {
  const mapped = {};
  for (const [formKey, modelKey] of Object.entries(mapping)) {
    if (formData[formKey] === undefined) continue;
    // Normalize strings: trim + collapse internal spaces
    const raw = formData[formKey];
    const normalized = typeof raw === "string" ? normalizeWhitespace(raw) : raw;
    // Skip empty strings after normalization
    if (normalized === "") continue;
    mapped[modelKey] = normalized;
  }
  return mapped;
}
```

**Explanation:**
- Iterates over `mapping` entries
- Only includes fields that have non-undefined values
- **Normalizes strings** before mapping: trims leading/trailing whitespace, collapses multiple consecutive spaces to a single space
- Strings that collapse to empty (e.g. `"   "`) are skipped
- Non-string values (e.g. number `0`) are passed through as-is
- The normalization is done **before saving** so the database stores the clean version, not the raw input

**Example:**
```js
formData = { "first-name": "  John  ", "last-name": "Doe", phone: "  0912  345  6789  " }
mapping = { "first-name": "first_name", "last-name": "last_name", phone: "phone" }

Result: { first_name: "John", last_name: "Doe", phone: "0912 345 6789" }
// Leading/trailing spaces removed, internal spaces collapsed
```

### Block 3: getEntityKeyFromPath and getFieldTitle

```js
export function getEntityKeyFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const key = segments[0];
  return ENTITY_CONFIG[key] ? key : null;
}

export function getFieldTitle(entityKey, modelKey) {
  const config = ENTITY_CONFIG[entityKey];
  if (config?.requiredFieldTitles?.[modelKey]) {
    return config.requiredFieldTitles[modelKey];
  }
  return modelKey.replace(/_/g, " ");
}
```

**Explanation:**
|- `getEntityKeyFromPath("/doctors")` → `"doctors"` - Splits pathname and returns the first segment if it matches a known entity
|- `getFieldTitle("doctors", "first_name")` → `"First Name"` - Resolves human-readable titles from `requiredFieldTitles` config, falling back to snake_case → Title Case
|- `getEntityKeyFromPath` is used by `Form.jsx` to detect the current entity from the URL
|- `getFieldTitle` is used by `ShowCard.jsx` to display friendly field names in inline validation errors

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Configuration-Driven Design** | Entity metadata in one place, not scattered across components |
| **Naming Convention Mapping** | Bridges frontend (kebab-case) and backend (snake_case) |
| **Single Source of Truth** | Adding entity = add config, not modify multiple files |
| **Utility Functions** | Pure functions for transformations, easy to test |

---

## Summary

**entityConfig.js** is the **configuration heart** of the entity system. It enables:
- Generic `Form` component (renders fields from config)
- Generic `EntityShow` component (reads required keys from config)
- Shared validation via `validation.js` (reads field metadata from config)
- Consistent API paths and field name translation
- Correct input types in ShowCard (reads `type` from config)

Adding a new entity (e.g., "Appointments") requires **only** adding a config entry here — validation, form rendering, and show pages all adapt automatically.

---

# lib/validation.js

## Purpose

**Shared validation utilities** used by both `Form.jsx` (create) and `ShowCard.jsx` (inline edit), and by the server-side API route handlers. Single source of truth for all validation rules. Replaces the previously duplicated inline validation in each component.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        validation.js                             │
├─────────────────────────────────────────────────────────────────┤
│  normalizeWhitespace(v)                                         │
│    → Trim + collapse consecutive spaces to single space        │
│                                                                 │
│  validateField(key, value, opts)                                │
│    → Single field validation (required, type, pattern, length)  │
│    → opts: { required, entity }                                 │
│    → entity parameter enables entity-specific rules             │
│                                                                 │
│  normalizeAndValidate(body, requiredKeys, entity)               │
│    → Server-side: validate + normalize, throws on failure       │
│    → Throws ValidationError with fieldErrors keyed by field     │
│                                                                 │
│  Validation Flow (entity-aware):                                │
│    - Medicines (entity="medicines"): name allows numbers        │
│    - Doctors/Patients: name fields reject numbers               │
└─────────────────────────────────────────────────────────────────┘
```

## Code Walkthrough

### Regex and Length Constants

```js
export const MAX_LENGTH = {
  name: 50,
  specialization: 100,
  phone: 11,
  email: 254,
  disease: 200,
  description: 500,
  birth_date: 10,
};

export const NAME_REGEX = /^[\p{L}\s'-]+$/u;        // letters only
export const NAME_WITH_NUMBERS_REGEX = /^[\p{L}\p{N}\s'-]+$/u;  // letters + numbers
export const PHONE_REGEX = /^09\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PRICE_REGEX = /^\d+(\.\d+)?$/;
export const STOCK_REGEX = /^[1-9]\d*$/;
export const BIRTH_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
```

**Key distinction:** Two name regexes exist because entity-specific validation differs:
- **`NAME_REGEX`** — letters, spaces, hyphens, apostrophes only. Used for doctor/patient names, specializations, and diseases.
- **`NAME_WITH_NUMBERS_REGEX`** — same as above plus numbers (`\p{N}`). Used for medicine names where values like "Vitamin B12" or "CoQ10" are natural.

### normalizeWhitespace

```js
export function normalizeWhitespace(v) {
  return v.trim().replace(/\s+/g, " ");
}
```

**Explanation:**
- Trims leading/trailing whitespace
- Collapses multiple consecutive spaces to a single space
- Applied **before saving** so the database stores the normalized version, not the raw input
- Used by `validateField` during validation, by `entityConfig.mapFormDataToModel` during form submission, and by `normalizeAndValidate` during server-side normalization

### Block 1: validateField

```js
export function validateField(key, value, opts = {}) {
  const { required = false, entity = undefined } = opts;

  // Type check
  if (value === null || value === undefined) {
    if (required) return { ok: false, error: `${key} is required` };
    return { ok: true };
  }
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, error: `${key} must be a string or number` };
  }

  const str = String(value);
  if (str === "") {
    if (required) return { ok: false, error: `${key} is required` };
    return { ok: true };
  }

  const normalized = normalizeWhitespace(str);

  // Reject boolean words ("true"/"false") for all fields
  if (normalized.toLowerCase() === "true" || normalized.toLowerCase() === "false") {
    return { ok: false, error: `${key} must not be a boolean value` };
  }

  // Length limit
  const maxLen = MAX_LENGTH[key] || 255;
  if (normalized.length > maxLen) {
    return { ok: false, error: `${key} must be at most ${maxLen} characters` };
  }

  // Per-field pattern checks (entity-aware for "name")
  switch (key) {
    case "first_name":
    case "last_name":
    case "specialization":
    case "disease": {
      if (!NAME_REGEX.test(normalized)) {
        return { ok: false, error: `${key} must contain only letters, spaces, hyphens, or apostrophes` };
      }
      break;
    }
    case "phone": ...
    case "email": ...
    case "price": ...
    case "stock": ...
    case "birth_date": ...
    case "name": {
      // Allow numbers only for medicines
      if (entity === "medicines") {
        if (!NAME_WITH_NUMBERS_REGEX.test(normalized)) {
          return { ok: false, error: `${key} must contain only letters, numbers, spaces, hyphens, or apostrophes` };
        }
      } else {
        if (!NAME_REGEX.test(normalized)) {
          return { ok: false, error: `${key} must contain only letters, spaces, hyphens, or apostrophes` };
        }
      }
      break;
    }
    case "description": ...
  }
  return { ok: true };
}
```

**Explanation:**
- Accepts `opts.required` (boolean) and `opts.entity` (string, used for entity-specific rules)
- Returns `{ ok: true }` or `{ ok: false, error: string }`
- Always normalizes whitespace on the value BEFORE validating (consistent with save)
- **Boolean word rejection**: `"true"` / `"false"` (case-insensitive) are rejected for every field — nobody's name is literally "true" and no medicine should be named "false"
- **Entity-specific name validation** — the `case "name"` branch checks the entity parameter:
  - `entity === "medicines"` → uses `NAME_WITH_NUMBERS_REGEX` (allows digits)
  - Otherwise → uses `NAME_REGEX` (letters only)
- This means the **same field key** (`name`) behaves differently depending on which entity is being validated
- The entity parameter is passed through the call chain: `Form.jsx` → `validateField`, `ShowCard.jsx` → `validateField`, and server-side API routes → `normalizeAndValidate` → `validateField`

### Block 2: normalizeAndValidate

```js
export function normalizeAndValidate(body, requiredKeys, entity = undefined) {
  const errors = {};
  const data = {};

  for (const [key, value] of Object.entries(body)) {
    const required = requiredKeys.includes(key);
    const result = validateField(key, value, { required, entity });
    if (!result.ok) {
      errors[key] = { message: result.error };
    } else {
      data[key] = typeof value === "string" ? normalizeWhitespace(value) : value;
    }
  }

  for (const key of requiredKeys) {
    if (!(key in body) || body[key] === "" || body[key] === null || body[key] === undefined) {
      errors[key] = { message: `${key} is required` };
    }
  }

  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.name = "ValidationError";
    err.errors = errors;
    throw err;
  }

  return data;
}
```

**Explanation:**
- Server-side function used by API route handlers via the `normalize` parameter
- Validates each field using `validateField` (entity-aware), normalizes whitespace on passing values
- Collects errors as `{ [fieldKey]: { message: string } }` — matching Mongoose's `ValidationError.errors` structure so `extractValidationMessage` can process both uniformly
- Checks that all `requiredKeys` are present and non-empty
- When errors exist, throws a `ValidationError` with `err.errors` keyed by field path — the API handlers use `extractValidationMessage` to extract these into a `{ fieldErrors }` response body for inline display
|- Returns normalized data ready for saving to the database

## Validation Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        CREATE FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│  User types → Form.jsx handleInputChange (clears error)        │
│         ↓                                                        │
│  Submit → validateField(modelKey, raw, { required, entity })   │
│  (Form.jsx iterates fields, passes entity="doctors"/etc.)       │
│         ↓                                                        │
│  Errors? → show inline → STOP                                  │
│         ↓                                                        │
│  mapFormDataToModel → strips empty, normalizes whitespace      │
│         ↓                                                        │
│  POST /api/:entity                                              │
│         ↓                                                        │
│  Server: normalizeAndValidate → 400 if invalid                 │
│  (returns { fieldErrors } keyed by field path)                  │
│         ↓                                                        │
│  Duplicate check → 409 if exists                                │
│         ↓                                                        │
│  Model.create() → Mongoose validators run (final safety net)   │
│  (Mongoose ValidationError → extractValidationMessage →          │
│   { fieldErrors } → 400)                                         │
│         ↓                                                        │
│  201 Created                                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        INLINE EDIT FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│  User clicks Edit → ShowCard loads rawItem into editValues     │
│         ↓                                                        │
│  User types → handleEditChange (clears error on input)         │
│         ↓                                                        │
│  Confirm → validateField(key, value, { required: true,         │
│            entity: entityKey })                                  │
│         ↓                                                        │
│  Errors? → show inline → STOP                                  │
│         ↓                                                        │
│  PUT /api/:entity (payload = { _id, ...editValues })            │
│         ↓                                                        │
│  Server: same validation pipeline as create                     │
│  (Mongoose ValidationError → { fieldErrors } → 400)             │
│         ↓                                                        │
│  Server-side field errors → setErrors(fieldErrors) → inline     │
│  (e.g., invalid email, phone pattern)                           │
└─────────────────────────────────────────────────────────────────┘
```

### How entity is passed through the call chain

| Layer | Where entity is set | Value |
|-------|-------------------|-------|
| **Form.jsx** | `useEffect` from pathname via `getEntityKeyFromPath` → `validateField(modelKey, raw, { entity })` | `"doctors"`, `"medicines"`, `"patients"` |
| **ShowCard.jsx** | Derived from `apiPath` last segment (`.pop()`) → `validateField(key, value, { entity: entityKey })` | same |
| **API routes** | `normalizeAndValidate(body, keys, "medicines")` explicitly passed | `"medicines"` for medicines route, else skipped |

## What Was NOT Added (Intentionally)

| Feature | Reason |
|---------|--------|
| Zod / Yup / Joi | Overkill for 3 entities / 15 fields. Shared vanilla utility is ~80 lines, zero deps. |
| React Hook Form / Formik | Current controlled-components pattern is simple and works. |
| Cross-field validation | Not needed for current domain (no "password confirm", "date range" etc). |
| i18n error messages | Not in scope. English-only for now. |

---

# next.config.mjs

## Purpose

**Next.js configuration** with Turbopack alias to exclude server-only modules (Mongoose) from client bundle.

## Code Walkthrough

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "@/app/lib/mongodb": { browser: "./src/app/lib/empty-stub.js" },
    },
  },
};

export default nextConfig;
```

### Block-by-Block Explanation

**`reactCompiler: true`**
- Enables **React Compiler** (formerly React Forget)
- Automatic memoization - no need for `useMemo`, `useCallback`, `React.memo`
- Compiles components to optimized JavaScript
- Experimental but stable in Next.js 15+

**`turbopack.resolveAlias`**
- **Turbopack** = Next.js's new Rust-based bundler (replaces Webpack)
- `resolveAlias` - Redirects imports
- `"@/app/lib/mongodb": { browser: "./src/app/lib/empty-stub.js" }`
  - **In browser build:** Import `@/app/lib/mongodb` → resolves to `empty-stub.js`
  - **In server build:** Uses actual `mongodb.js` (no alias)

**Why this works:**
1. `lib/api.js` has `await import("@/app/lib/mongodb")` (dynamic import)
2. Turbopack sees this import string
3. For client bundle, substitutes empty stub
4. For server bundle, uses real module
5. At runtime in server handler, dynamic import loads real module

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **React Compiler** | Automatic optimization, removes need for manual memoization |
| **Turbopack** | Next.js's fast Rust bundler, replaces Webpack |
| **Resolve Alias** | Redirects module imports at build time |
| **Browser/Server Alias** | Different resolution for client vs server bundles |
| **Dynamic Import + Alias** | Runtime loading of real module, build-time stub for client |

---

## Summary

**next.config.mjs** enables **shared code between client and server** by aliasing server-only dependencies to empty stubs in the browser build. Critical for the `lib/api.js` architecture.

---

# api/doctors/route.js

## Purpose

**Next.js Route Handler** for `/api/doctors` - Handles GET, POST, PUT, DELETE for Doctor entity.

## Code Walkthrough

```js
import Doctor from "@/app/models/Doctor";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Doctor, "Doctor");

export const POST = createPostHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "specialization", "phone"]),
);

export const PUT = createPutHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "specialization", "phone"]),
);

export const DELETE = createDeleteHandler(Doctor, "Doctor");
```

### Block-by-Block Explanation

**GET Handler:** Uses `createGetHandler` factory (not manual). Handles fetch plus error sanitization.

**POST/PUT handlers** now pass a `normalize` parameter — a lambda that calls `normalizeAndValidate` with the expected required keys. This ensures:
1. Whitespace is normalized (trim, collapse internal spaces) before saving
2. Validation rules match the frontend (entity-specific name validation)
3. Empty strings are rejected before reaching the database
4. The doctor route validates 4 required fields (`first_name`, `last_name`, `specialization`, `phone`) even though duplicate detection only uses 3 fields

**Doctor-specific duplicate detection** is handled in `api.js` via the `entityName === "Doctor"` branch:
- Same name + same phone + same specialization → 409
- Same name + same phone + different specialization → allowed
- Different name + same phone → 409
- This logic replaces the old DB-level unique index on phone (removed from schema) and a `syncIndexes()` call drops any leftover index from the database

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Next.js Route Handlers** | `export async function GET/POST/PUT/DELETE` in `route.js` |
| **Web Response API** | `Response.json(data, { status })` - standard Web API, no Next.js wrapper needed |
| **Mongoose Model Methods** | `find`, `create`, `findByIdAndUpdate`, `findByIdAndDelete` |
| **Factory Pattern for Routes** | Reusable handler generators eliminate boilerplate |
| **Named Exports** | Each HTTP method exported separately |

---

## Summary

**api/doctors/route.js** is a **minimal route handler** that:
- Implements GET manually (simple case)
- Uses factory functions for POST/PUT/DELETE (complex cases)
- Demonstrates the power of `lib/api.js` factories

---

# api/medicines/route.js

## Purpose

Route handler for `/api/medicines` - Identical structure to doctors, different model and fields.

## Code Walkthrough

```js
import Medicine from "@/app/models/Medicine";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Medicine, "Medicine");

export const POST = createPostHandler(
  Medicine,
  ["name", "description"],
  "Medicine",
  (body) => normalizeAndValidate(body, ["name", "description", "price"], "medicines"),
);

export const PUT = createPutHandler(
  Medicine,
  ["name", "description"],
  "Medicine",
  (body) => normalizeAndValidate(body, ["name", "description", "price"], "medicines"),
);

export const DELETE = createDeleteHandler(Medicine, "Medicine");
```

**Differences from doctors:**
- Model: `Medicine`
- Required fields: `["name", "description", "price"]`
- Entity name: `"Medicine"`
- **Entity-aware validation:** The 3rd argument `"medicines"` is passed to `normalizeAndValidate`, which forwards it to `validateField`. This enables the `case "name"` branch to use `NAME_WITH_NUMBERS_REGEX` (allowing numbers like "Vitamin B12") instead of the letters-only `NAME_REGEX`. Without this parameter, medicine names would incorrectly reject numbers.

---

# api/patients/route.js

## Purpose

Route handler for `/api/patients` - Same pattern.

## Code Walkthrough

```
import Patient from "@/app/models/Patient";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Patient, "Patient");

export const POST = createPostHandler(
  Patient,
  ["first_name", "last_name", "birth_date", "disease"],
  "Patient",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "birth_date", "disease"]),
);

export const PUT = createPutHandler(
  Patient,
  ["first_name", "last_name", "birth_date", "disease"],
  "Patient",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "birth_date", "disease"]),
);

export const DELETE = createDeleteHandler(Patient, "Patient");
```

**Differences:**
- Model: `Patient`
- Required fields: `["first_name", "last_name", "birth_date", "disease"]`
- Entity name: `"Patient"`
- Same pattern: GET/POST/PUT/DELETE all use factories with `normalizeAndValidate` for consistent server-side validation

---

## Summary for All API Routes

All three route files (`doctors`, `medicines`, `patients`) follow **identical structure**:
1. Import model and factory functions plus `normalizeAndValidate`
2. GET: `createGetHandler(Model, entityName)` — factory function, not manual
3. POST/PUT/DELETE: Factory calls with model, duplicate fields, entity name, and a `normalize` lambda that calls `normalizeAndValidate` with the required validation keys
4. Medicines additionally passes `"medicines"` as the entity parameter to `normalizeAndValidate` for entity-specific name validation

---

# models/ (Doctor.js, Patient.js, Medicine.js)

## Purpose

**Mongoose schemas** with validation constraints. Database is the ultimate source of truth
these validators run when `Model.create()` or `findByIdAndUpdate({ runValidators: true })` is called.

## Example: Patient Schema

```js
const patientSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    validate: {
      validator: (v) => /^[\p{L}\s'-]+$/u.test(v.trim()),
      message: "First name must contain only letters, spaces, hyphens, or apostrophes",
    },
  },
  last_name: { ... same pattern ... },
  birth_date: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: isValidBirthDate,
      message: "Birth date must be a valid date in DD/MM/YYYY format",
    },
  },
  disease: { ... same pattern ... },
});
```

**Before:** `first_name: String` -- bare strings, zero validation at DB level.

**After:** Full constraints -- `required`, `trim`, `maxlength`, `validate` (custom regex functions).

**Model-specific differences:**

| Feature | Doctor | Patient | Medicine |
|---------|--------|---------|----------|
| Name validator | `isValidName` (letters only) | `isValidName` (letters only) | `isValidMedicineName` (letters + numbers) |
| Phone unique index | **Removed** — handled in app logic | N/A | N/A |
| `syncIndexes()` on startup | Drops legacy phone unique index | N/A | N/A |

**Doctor schema changed the most:**
- **Unique index on phone removed** — The `DoctorSchema.index({ phone: 1 }, { unique: true })` line was deleted. Duplicate detection for phone numbers is now handled entirely in application logic within `api.js`'s Doctor-specific duplicate check.
- **`syncIndexes()` on connection open** — `mongoose.connection.once("open", () => { Doctor.syncIndexes().catch(() => {}); })` ensures any leftover legacy unique index on phone from a previous schema version is dropped from the database.
- **Rules**: Same name + same phone + same specialization → 409. Same name + different specialization + same phone → allowed. Different name + same phone → 409.

**Medicine validator renamed:**
- `isValidName` was renamed to `isValidMedicineName` and now uses `NAME_WITH_NUMBERS_REGEX` (`[\p{L}\p{N}\s'-]+`) to allow natural characters like "Vitamin B12" or "CoQ10".

**Boolean word rejection:**
- All three schemas now reject `"true"` and `"false"` as name values (case-insensitive) in their respective validators.

**Why this matters:**
- Client-side validation can be bypassed (browser DevTools, direct API calls)
- `runValidators: true` in `api.js` ensures these constraints are enforced even on updates
- `trim: true` automatically strips whitespace on save
- `validate` / `match` catch format errors (invalid dates, bad emails) at the database layer

**Validation layers (defense in depth):**
1. Client-side: `validation.js` uses `validateField` with entity parameter — immediate UX feedback, entity-specific rules (medicine names allow numbers, doctors/patients don't, boolean words rejected)
2. Server-side: `normalizeAndValidate` in route handlers normalizes whitespace and rejects invalid payloads before any DB operation, returning `{ fieldErrors }` for inline display
3. Application logic: Doctor-specific duplicate detection in `api.js` enforces phone-reuse rules without DB-level unique indexes
4. Database: Mongoose schema validators catch anything that slips through, plus `syncIndexes()` keeps the DB index in sync with the schema

---

# lib/useMediaQuery.js

## Purpose

A tiny SSR-safe media-query hook used by the Reports charts to detect narrow
viewports. It wraps `window.matchMedia` in a `false`-initial-state
`useState`/`useEffect` pair so the server-rendered markup and the first client
render never mismatch.

## Code Walkthrough

```jsx
import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    update();

    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
```

**Explanation:**
- `useState(false)` — starts `false` during SSR so the initial render matches
  what the server produced. The real value is set inside `useEffect`
  (client-only), avoiding hydration mismatches.
- `window.matchMedia(query)` — evaluates the CSS media query string.
- `update()` — reads the *current* match value and calls `setMatches`.
  Wrapped in a named function so it doubles as the `"change"` listener — this
  avoids calling `setState` directly in the effect body (which triggers the
  `react-hooks/set-state-in-effect` lint rule) while still syncing on mount.
- `addEventListener("change", update)` — listens for viewport breakpoints
  being crossed (resize, orientation change, device fold).
- Cleanup removes the listener on unmount.

**Why not just use Tailwind's `sm:` classes?** Recharts renders an SVG canvas
where element props (legend position, label rotation, tick font size) must be
*numbers*, not CSS values. Those props can't be set from a stylesheet, so we
need JS-level breakpoint detection for chart-specific geometry. The Tailwind
`sm:` classes handle the surrounding layout; `useMediaQuery` handles the chart
internals.

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **SSR safety** | `useState(false)` initial + `useEffect` set avoids hydration mismatch |
| **Media Query API** | `window.matchMedia` + `addEventListener("change", …)` for responsive JS logic |
| **Composition** | Reused by every chart that needs breakpoint-aware geometry |

---

# components/Reports/DiseaseBarChart.jsx

## Purpose

Renders a horizontal-bar-style disease prevalence chart using Recharts
`BarChart`. Data is built by `buildDiseaseChartData` in `lib/reportUtils.js`
and passed in as `{ disease, count }[]` sorted by count descending.

## Responsive Problem

On narrow viewports (< 768 px) the chart suffered from three issues:
1. **Cramped margins** — the desktop margin `{ left: -12, right: 12 }`
   clipped the leftmost disease labels on a 320 px-wide screen.
2. **Label overlap** — the `-30°` rotated XAxis ticks ran into each other
   because there wasn't enough `height` room allocated under the axis.
3. **Small tick font** — `fontSize: 12` on a 360 px screen left labels
   barely legible.

## Responsive Solution

A single `useMediaQuery("(max-width: 767px)")` call computes mobile-aware
props; the desktop values are left untouched so desktop appearance is
identical to before.

```jsx
const isMobile = useMediaQuery("(max-width: 767px)");

const tick = {
  fill: "var(--color-text-muted)",
  fontSize: isMobile ? 10 : 12,
};

const margin = isMobile
  ? { top: 16, right: 4, left: -8, bottom: 20 }
  : { top: 16, right: 12, left: -12, bottom: 12 };

<XAxis
  dataKey="disease"
  tick={tick}
  angle={isMobile ? -25 : -30}
  height={isMobile ? 90 : 75}
/>
```

**What changed (mobile only):**
- `fontSize` 12 → 10 — matches the smaller screen pixel density.
- `angle` `-30` → `-25` — shallower rotation needs less vertical clearance
  so labels have more breathing room.
- `height` 75 → 90 — extra space under the axis prevents label clipping.
- `margin.bottom` 12 → 20 and `margin.right` 12 → 4 — rebalances the
  chart area so the bars don't get squeezed against the right edge.
- `tickCount={5}` on `YAxis` — caps Y-axis ticks at 5 so the axis isn't
  crowded with too many gridlines on mobile.

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **ResponsiveContainer** | Sets width to 100% of parent; height stays fixed via the wrapper div |
| **JS breakpoint detection** | `useMediaQuery` drives numeric chart props (angle, fontSize, margin) that CSS can't touch |
| **Desktop preservation** | Mobile values are conditionals; desktop path is a no-op |

---

# components/Reports/SpecializationPieChart.jsx

## Purpose

Renders a donut-style specialization distribution chart using Recharts
`PieChart`. Data is built by `buildSpecializationChartData` in
`lib/reportUtils.js` and passed in as `{ specialization, value }[]`. The
color palette is a fixed array mapped by index.

## Responsive Problem

On narrow viewports the legend overlapped the pie:
- Desktop legend: `layout="vertical"`, `verticalAlign="middle"`,
  `align="right"` — this places the legend *inside* the right edge of the
  chart. When the container shrinks below ~560 px the legend items wrap onto
  the donut segments, making both unreadable.
- The pie radii (`innerRadius={66}`, `outerRadius={118}`) were also too large
  for a narrow container — the donut consumed almost all available width,
  leaving no room for a horizontal legend.

## Responsive Solution

```jsx
const isMobile = useMediaQuery("(max-width: 767px)");

const innerRadius = isMobile ? 50 : 66;
const outerRadius = isMobile ? 94 : 118;

<Legend
  layout={isMobile ? "horizontal" : "vertical"}
  verticalAlign={isMobile ? "bottom" : "middle"}
  align={isMobile ? "center" : "right"}
  wrapperStyle={{
    color: "var(--color-text-muted)",
    fontSize: isMobile ? 12 : 13,
    paddingTop: isMobile ? 16 : 0,
  }}
/>
```

**What changed (mobile only):**
- **Legend repositioned** — moves from right-aligned-vertical to
  bottom-centered-horizontal, stacking below the pie where there's always
  enough room regardless of how many specialties exist.
- **Pie radii reduced** — `innerRadius` 66 → 50, `outerRadius` 118 → 94 —
  leaves a horizontal gutter for the legend without the pie touching the
  edges.
- **`fontSize` 13 → 12** and `paddingTop: 16`** — tighter legend rows and a
  little top padding when the legend sits below the chart.

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Legend reflow** | `layout`/`verticalAlign`/`align` props change the legend box model completely |
| **Proportional radii** | Smaller inner/outer radius on mobile keeps the donut centered with room for a horizontal legend |
| **Desktop preservation** | Mobile values are conditionals; desktop path is a no-op |

---

# Key Architectural Patterns Summary

## 1. Configuration-Driven UI
- `entityConfig.js` defines everything about an entity
- Components (`Form`, `EntityShow`, `ShowCard`) are generic
- Adding entity = config only

## 2. Factory Functions for API Handlers
- `createPostHandler`, `createPutHandler`, `createDeleteHandler` in `lib/api.js`
- Route handlers become one-liners
- Consistent behavior, centralized logic

## 3. Shared Client/Server Module with Alias
- `lib/api.js` used by both React components and route handlers
- Turbopack alias excludes Mongoose from client bundle
- Dynamic import loads real module at runtime on server

## 4. Custom Hooks for Data Fetching
- `useEntities` encapsulates fetch + loading + error + refetch
- Reusable across components

## 5. Context for Global UI State
- `ToastProvider` manages notification queue
- `useToast` hook for easy access

## 6. Controlled Components Pattern
- Forms: Parent owns state, inputs are controlled
- ShowCard: Parent owns `editingId`, card requests changes via callbacks

## 7. Derived State Over Sync State
- `isEditing = editingId === rawItem._id` (not separate state)
- `generatedData` from `useMemo` (not separate state)

## 8. CSS-Only Interactions Where Possible
- `Tooltip` uses `group-hover` - no JS state
- `Toast` uses CSS transitions for animations

## 9. Four-Layer Validation
- Client: `validation.js` uses entity-aware `validateField` for immediate UX feedback (medicine names allow numbers, doctors/patients don't, boolean words rejected)
- Server: `normalizeAndValidate` in route handlers normalizes whitespace and rejects invalid payloads before any DB operation, returning `{ fieldErrors }` for inline display
- Application logic: Doctor-specific duplicate detection in `api.js` enforces phone-reuse rules without DB-level unique indexes
- Database: Mongoose schema validators catch anything that slips through, plus `syncIndexes()` keeps DB indexes in sync with schema

---

# Best Practices Demonstrated

| Practice | Where Used |
|----------|------------|
| **Single Responsibility** | Each file has one clear purpose |
| **DRY (Don't Repeat Yourself)** | Factory functions, generic components |
| **Separation of Concerns** | API logic in `lib/api.js`, UI in components |
| **Type Safety (JSDoc)** | Function signatures documented |
| **Error Boundaries** | Try/catch in all async operations |
| **Accessibility** | ARIA roles, labels, live regions |
| **Performance** | `useMemo`, `useCallback`, memoization |
| **Bundle Optimization** | Turbopack alias for server-only code |
| **Zero Unnecessary Dependencies** | Native `fetch`, inline SVGs, no icon lib |
|| **Defense in Depth** | Four validation layers (client, server, app logic, DB) with entity-aware rules and field-level error responses |

---

# Possible Improvements

| Area | Suggestion |
|------|------------|
| **Server-Side Pagination** | `EntityShow` loads all data; add `page`/`limit` params to API |
| **Async Validation** | Unique field checks (e.g., email uniqueness) via `validateAsync` in validation.js |
| **Optimistic Updates** | Update UI immediately, rollback on error |
| **React Query / SWR** | Replace `useEntities` for caching, deduping, background refetch |
| **Error Boundaries** | Catch render errors in component tree |
| **Tests** | Unit tests for utilities, integration tests for API |
| **TypeScript** | Add type safety across the codebase |
| **Database Indexes** | Add MongoDB indexes on `requiredFields` for duplicate checks |

---

# Conclusion

This codebase demonstrates **senior-level frontend architecture**:
- **Reusability** through configuration and generics
- **Separation of concerns** (API, UI, State, Config)
- **Performance awareness** (memoization, bundle splitting)
- **Developer experience** (clear patterns, minimal boilerplate)
- **Production readiness** (error handling, accessibility, animations)

Each pattern serves a purpose. The best way to learn is to **trace a feature request** (e.g., "Add Appointments entity") through the codebase and see how few files need to change.