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
import { ENTITY_CONFIG, mapFormDataToModel, getEntityKeyFromPath } from "@/app/lib/entityConfig";
```

**Explanation:**
- `"use client"` - This directive tells Next.js this is a **Client Component**. It runs in the browser, can use hooks (`useState`, `useEffect`), browser APIs, and event handlers. Without this, it would be a Server Component by default (Next.js 13+ App Router default).
- `usePathname()` - Next.js hook that returns the current URL pathname (e.g., `/doctors`, `/patients`). This is how we determine which entity the form belongs to.
- `useToast()` - Custom hook from our ToastProvider context for showing notifications.
- `ENTITY_CONFIG` - Central configuration object mapping entity keys to their API paths, field mappings, and required fields.
- `mapFormDataToModel()` - Utility that converts form field names (kebab-case like `first-name`) to model field names (snake_case like `first_name`).
- `getEntityKeyFromPath()` - Extracts entity key from URL pathname.

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
- `entity` - The detected entity key (`doctors`, `patients`, `medicines`)

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
```

**Explanation:**
- Filters `fields` to only required ones
- Checks each required field's value in `formData`
- Shows toast error on first missing field and returns `false`
- Returns `true` only if all required fields have values

**Why check `undefined` and `null`?** Form data might not have the key yet, or value could be explicitly set to null. Defensive coding.

**Alternative approach:** Could use a validation library (Zod, Yup) for complex validation, but for simple required-field checks, this vanilla approach is lightweight and has zero dependencies.

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

      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to create ${entityName}`);
      }
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
```

**Explanation - Step by Step:**

1. **`e.preventDefault()`** - Prevents default form submission (page reload). Essential for SPAs.

2. **Validation check** - Calls `validateForm()`, returns early if invalid.

3. **Entity check** - Guards against undefined entity (shouldn't happen but defensive).

4. **Loading state** - `setIsLoading(true)` disables submit button, shows "Processing..."

5. **Data mapping** - `mapFormDataToModel(formData, fieldMapping)` converts:
   ```js
   // formData (from form inputs, kebab-case keys)
   { "first-name": "John", "last-name": "Doe", specialization: "Cardiology" }
   
   // fieldMapping (from ENTITY_CONFIG)
   { "first-name": "first_name", "last-name": "last_name", specialization: "specialization" }
   
   // apiData (snake_case keys matching Mongoose model)
   { first_name: "John", last_name: "Doe", specialization: "Cardiology" }
   ```

6. **Fetch API call** - Standard `fetch` with POST, JSON headers, stringified body.

7. **Response handling** - `response.json()` parses body. `response.ok` checks HTTP status (200-299).

8. **Error throwing** - If not OK, throws error with server message or generic fallback.

9. **Success toast** - Shows success message with entity name.

10. **Form reset** - Recreates empty initial data and sets state.

11. **Catch block** - Catches network errors, JSON parse errors, or thrown errors. Shows error toast.

12. **Finally block** - Always runs, resets loading state.

**Why `async/await`?** Cleaner than `.then()` chains. Makes asynchronous code read like synchronous code. The `try/catch/finally` handles all error paths.

**Why `fetch` not `axios`?** `fetch` is native, no dependency needed. For simple CRUD, it's sufficient. Axios adds interceptors, automatic JSON parsing, but increases bundle size.

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
3. Handles validation, submission, loading states
4. Maps form data to API format
5. Shows user feedback via toasts

**Why this architecture?** Adding a new entity (e.g., "Appointments") requires:
1. Add config to `entityConfig.js`
2. Create API route using `createPostHandler`
3. Add page that passes fields to `<Form fields={...} />`

**No new components needed.** This is the power of configuration-driven design.

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
  required,
  placeholder,
  value,
  onChange,
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
        className="rounded-lg border border-(--color-input-border) bg-(--color-input-bg) px-3 py-2 text-light outline-none transition focus:border-secondary"
        type={type}
        name={name}
        required={required ? true : false}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
```

### Block-by-Block Explanation

**Props Destructuring:**
```jsx
function FormInput({ title, name, type, required, placeholder, value, onChange })
```
- Receives all necessary props from parent
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
  className="rounded-lg border border-(--color-input-border) bg-(--color-input-bg) px-3 py-2 text-light outline-none transition focus:border-secondary"
  type={type}
  name={name}
  required={required ? true : false}
  placeholder={placeholder}
  value={value}
  onChange={onChange}
/>
```
- **Controlled component** - `value` and `onChange` come from parent
- `required={required ? true : false}` - Normalizes prop to boolean (handles undefined)
- `outline-none` + `focus:border-secondary` - Custom focus ring using theme color
- CSS custom properties for theming: `--color-input-border`, `--color-input-bg`

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
```

**Explanation:**
- `"use client"` - Needs hooks, event handlers, lucide icons
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
- **Local state:** `editValues` (form data during edit), modals visibility, loading states

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
    for (const key of requiredKeys) {
      const value = editValues[key];
      if (value === "" || value === undefined || value === null) {
        showToast("error", `${key.replace(/_/g, " ")} is required`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = { _id: rawItem._id, ...editValues };
      await updateEntity(apiPath, payload);
      showToast("success", `${entityName} updated successfully`);
      onFinishEdit();
      setEditValues({});
      onChanged?.();
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsSaving(false);
    }
  };
```

**Explanation:**
1. **Validation** - Checks all `requiredKeys` have values in `editValues`
2. **Loading state** - `setIsSaving(true)`
3. **Payload** - Combines `_id` (for API to know which document) with `editValues`
4. **API call** - `updateEntity(apiPath, payload)` from `lib/api.js`
5. **Success** - Toast, close edit mode, clear values, call `onChanged()` to refresh parent list
6. **Error** - Toast with error message
7. **Finally** - Reset loading state

**Why `onChanged?.()`?** Optional chaining - `onChanged` might not be passed. Safe call.

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
                className="mt-1 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-dark outline-none focus:border-secondary"
              />
            ) : (
              <span>: {item.value}</span>
            )}
          </div>
        );
      })}
```

**Explanation:**
- Maps over `data` (pre-formatted title/value pairs from parent)
- `key = dataKeys[index]` - Gets the actual field name for `editValues` lookup
- **Read mode:** Shows label + value
- **Edit mode:** Shows label + input field bound to `editValues[key]`
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
- Switches to inline edit mode
- Validates required fields on save
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
│                                                                 │
│  Internal:                                                      │
│  - useEntities(apiPath) → { data, isLoading, refetch }         │
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

import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ShowCard from "@/app/components/ShowCard";
import { useEntities } from "@/app/lib/useEntities";

export default function EntityShow({
  apiPath,
  dataTitles,
  dataKeys,
  requiredKeys = [],
  entityName = "Record",
  loadingMessage = "Loading...",
  itemsPerPage = 8,
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
    throw new Error(message);
  }
  return result;
}
```

**Explanation:**
- **Single responsibility** - All fetch calls use this
- `response.json().catch(() => ({}))` - Handles non-JSON responses gracefully
- Throws `Error` with server message or fallback
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

### Block 4: createPostHandler (Factory Function)

```jsx
export function createPostHandler(Model, requiredFields, entityName, normalize) {
  return async function POST(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? normalize(body) : body;

      // Build duplicate query from required fields only
      const duplicateQuery = {};
      for (const field of requiredFields) {
        duplicateQuery[field] = data[field];
      }

      const existing = await Model.findOne(duplicateQuery);
      if (existing) {
        return Response.json(
          { error: `${entityName} already exists with the same ${requiredFields.join(", ")}.` },
          { status: 409 }
        );
      }

      const doc = await Model.create(data);
      return Response.json(doc, { status: 201 });
    } catch (error) {
      return Response.json(
        { error: `Error while creating ${entityName.toLowerCase()}: ${error.message}` },
        { status: 500 }
      );
    }
  };
}
```

**Explanation:**
- **Factory function** - Returns a handler function (higher-order function)
- **Parameters:**
  - `Model` - Mongoose model (Doctor, Patient, Medicine)
  - `requiredFields` - Array of field names for duplicate detection
  - `entityName` - Human name for error messages
  - `normalize` - Optional function to transform body before save
- **Duplicate Check:**
  - Builds query from `requiredFields` only (not all fields)
  - `Model.findOne(duplicateQuery)` - Checks if document exists
  - Returns 409 Conflict if duplicate
- **Create:** `Model.create(data)` - Validates and saves
- **Response:** 201 Created with new document
- **Error Handling:** Try/catch wraps everything, returns 500 with message

**Why factory pattern?** DRY - Same logic for all entities. Route handlers just call:
```js
export const POST = createPostHandler(Doctor, ["first_name", "last_name", "specialization"], "Doctor");
```

### Block 5: createPutHandler

```jsx
export function createPutHandler(Model, requiredFields, entityName, normalize) {
  return async function PUT(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? normalize(body) : body;
      const { _id } = data;

      if (!_id) {
        return Response.json(
          { error: `${entityName} ID is required for update.` },
          { status: 400 }
        );
      }

      const existing = await Model.findById(_id);
      if (!existing) {
        return Response.json(
          { error: `${entityName} not found.` },
          { status: 404 }
        );
      }

      // Check for duplicate among OTHER documents
      const duplicateQuery = { _id: { $ne: _id } };
      for (const field of requiredFields) {
        duplicateQuery[field] = data[field];
      }

      const duplicate = await Model.findOne(duplicateQuery);
      if (duplicate) {
        return Response.json(
          { error: `Another ${entityName.toLowerCase()} already exists with the same ${requiredFields.join(", ")}.` },
          { status: 409 }
        );
      }

      // Remove _id from update data
      const { _id: omitted, ...updateData } = data;
      const updated = await Model.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });

      return Response.json(updated, { status: 200 });
    } catch (error) {
      return Response.json(
        { error: `Error while updating ${entityName.toLowerCase()}: ${error.message}` },
        { status: 500 }
      );
    }
  };
}
```

**Explanation:**
- **Similar structure** to POST handler
- **ID Validation:** Requires `_id` in body
- **Existence Check:** `findById` - returns 404 if not found
- **Duplicate Check:** Excludes current document with `_id: { $ne: _id }`
- **Update:** `findByIdAndUpdate` with:
  - `new: true` - Returns updated document
  - `runValidators: true` - Runs Mongoose validators on update
- **Destructuring:** `{ _id: omitted, ...updateData }` removes `_id` from update payload

### Block 6: createDeleteHandler

```jsx
export function createDeleteHandler(Model, entityName) {
  return async function DELETE(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const { _id } = body;

      if (!_id) {
        return Response.json(
          { error: `${entityName} ID is required for deletion.` },
          { status: 400 }
        );
      }

      const existing = await Model.findById(_id);
      if (!existing) {
        return Response.json(
          { error: `${entityName} not found.` },
          { status: 404 }
        );
      }

      await Model.findByIdAndDelete(_id);
      return Response.json(
        { message: `${entityName} deleted successfully.` },
        { status: 200 }
      );
    } catch (error) {
      return Response.json(
        { error: `Error while deleting ${entityName.toLowerCase()}: ${error.message}` },
        { status: 500 }
      );
    }
  };
}
```

**Explanation:**
- **Simplest handler** - No duplicate check needed
- **ID Required** - 400 if missing
- **Existence Check** - 404 if not found
- **Delete:** `findByIdAndDelete`
- **Response:** 200 with success message

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Factory Functions** | `createPostHandler` returns a handler - eliminates boilerplate |
| **Dynamic Import** | `await import(...)` loads server-only code at runtime |
| **Next.js Response** | `Response.json(data, { status })` - Web standard Response API |
| **Mongoose Methods** | `findOne`, `create`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete` |
| **Duplicate Detection** | Query built from required fields only |
| **$ne Operator** | MongoDB "not equal" - excludes current doc from duplicate check |
| **runValidators** | Ensures schema validation runs on updates |
| **Error Boundaries** | Try/catch at handler level, consistent error responses |

---

## Summary

**lib/api.js** is the **backbone of the API layer**:
- **Client side:** 4 simple fetch wrappers
- **Server side:** 3 factory functions that generate route handlers
- **Shared:** Response parsing utility
- **Architecture:** Separates HTTP concerns from business logic, enables reuse across entities

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

**Centralized configuration** for all entities. Maps form fields (kebab-case) to model fields (snake_case), defines API paths, required fields, and provides utility functions.

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
    requiredFields: ["first_name", "last_name", "specialization"],
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
    requiredFields: ["first_name", "last_name", "birth_date"],
  },
};
```

**Structure per entity:**
- `apiPath` - REST endpoint
- `entityName` - Display name (for toasts, modals)
- `fieldMapping` - **Form key → Model key** (kebab-case → snake_case)
- `requiredFields` - Model field names for duplicate detection

**Why separate mapping?** HTML form `name` attributes use kebab-case (`first-name`). MongoDB/Mongoose models use snake_case (`first_name`). This maps between them.

### Block 2: mapFormDataToModel

```js
export function mapFormDataToModel(formData, mapping) {
  const mapped = {};
  for (const [formKey, modelKey] of Object.entries(mapping)) {
    if (formData[formKey] !== undefined && formData[formKey] !== "") {
      mapped[modelKey] = formData[formKey];
    }
  }
  return mapped;
}
```

**Explanation:**
- Iterates over `mapping` entries
- Only includes fields that have values (not undefined, not empty string)
- Returns object with model field names

**Example:**
```js
formData = { "first-name": "John", "last-name": "Doe", specialization: "Cardio", phone: "" }
mapping = { "first-name": "first_name", "last-name": "last_name", specialization: "specialization", phone: "phone" }

Result: { first_name: "John", last_name: "Doe", specialization: "Cardio" }
// phone omitted (empty string)
```

### Block 3: getEntityKeyFromPath

```js
export function getEntityKeyFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const key = segments[0];
  return ENTITY_CONFIG[key] ? key : null;
}
```

**Explanation:**
- Splits pathname: `/doctors` → `["doctors"]`
- `/patients/123` → `["patients", "123"]` → returns `"patients"`
- Returns `null` if not a known entity
- Used by `Form.jsx` to detect current entity from URL

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
- Generic `Form` component
- Generic `EntityShow` component
- Consistent API paths
- Duplicate detection fields
- Field name translation

Adding a new entity (e.g., "Appointments") requires **only** adding a config entry here.

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
import { connectToDB } from "@/app/lib/mongodb";
import Doctor from "@/app/models/Doctor";
import { NextResponse } from "next/server";
import {
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export async function GET() {
  try {
    await connectToDB();
    const doctors = await Doctor.find({});
    return NextResponse.json(doctors, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch doctors: ${error.message}` },
      { status: 500 }
    );
  }
}

export const POST = createPostHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor"
);

export const PUT = createPutHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor"
);

export const DELETE = createDeleteHandler(Doctor, "Doctor");
```

### Block-by-Block Explanation

**GET Handler (Custom):**
```js
export async function GET() {
  try {
    await connectToDB();
    const doctors = await Doctor.find({});
    return NextResponse.json(doctors, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch doctors: ${error.message}` },
      { status: 500 }
    );
  }
}
```
- **Manual implementation** (not using factory) - Simple fetch all
- `connectToDB()` - Establishes Mongoose connection
- `Doctor.find({})` - Returns all documents
- `NextResponse.json()` - Next.js wrapper for Response

**POST/PUT/DELETE (Factory Functions):**
```js
export const POST = createPostHandler(
  Doctor,                                    // Mongoose Model
  ["first_name", "last_name", "specialization"], // Required fields for duplicate check
  "Doctor"                                   // Entity name for messages
);
```
- **One-liner** - Factory returns handler function
- `createPostHandler` - Handles creation with duplicate detection
- `createPutHandler` - Handles updates with duplicate detection (excludes self)
- `createDeleteHandler` - Handles deletion

**Why GET is manual but others use factory?**
- GET is simple and identical for all entities (just `find({})`)
- POST/PUT/DELETE have complex logic (duplicates, validation) that benefits from reuse
- Could also make `createGetHandler` but not necessary

---

## Key Concepts Learned

| Concept | Explanation |
|---------|-------------|
| **Next.js Route Handlers** | `export async function GET/POST/PUT/DELETE` in `route.js` |
| **NextResponse** | Next.js wrapper for Web Response API |
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
import { connectToDB } from "@/app/lib/mongodb";
import Medicine from "@/app/models/Medicine";
import { NextResponse } from "next/server";
import {
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export async function GET() {
  try {
    await connectToDB();
    const medicines = await Medicine.find({});
    return NextResponse.json(medicines, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch medicines: ${error.message}` },
      { status: 500 }
    );
  }
}

export const POST = createPostHandler(
  Medicine,
  ["name", "description", "price"],
  "Medicine"
);

export const PUT = createPutHandler(
  Medicine,
  ["name", "description", "price"],
  "Medicine"
);

export const DELETE = createDeleteHandler(Medicine, "Medicine");
```

**Differences from doctors:**
- Model: `Medicine`
- Required fields: `["name", "description", "price"]`
- Entity name: `"Medicine"`

---

# api/patients/route.js

## Purpose

Route handler for `/api/patients` - Same pattern.

## Code Walkthrough

```js
import { connectToDB } from "@/app/lib/mongodb";
import Patient from "@/app/models/Patient";
import { NextResponse } from "next/server";
import {
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export async function GET() {
  try {
    await connectToDB();
    const patients = await Patient.find({});
    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch patients: ${error.message}` },
      { status: 500 }
    );
  }
}

export const POST = createPostHandler(
  Patient,
  ["first_name", "last_name", "birth_date"],
  "Patient"
);

export const PUT = createPutHandler(
  Patient,
  ["first_name", "last_name", "birth_date"],
  "Patient"
);

export const DELETE = createDeleteHandler(Patient, "Patient");
```

**Differences:**
- Model: `Patient`
- Required fields: `["first_name", "last_name", "birth_date"]`
- Entity name: `"Patient"`

---

## Summary for All API Routes

All three route files (`doctors`, `medicines`, `patients`) follow **identical structure**:
1. Import model and factory functions
2. GET: Manual `find({})` with error handling
3. POST/PUT/DELETE: One-line factory calls with model, required fields, entity name

**This is the payoff of the factory pattern** - Adding a new entity's API route takes ~10 lines of code.

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

---

# Possible Improvements

| Area | Suggestion |
|------|------------|
| **Server-Side Pagination** | `EntityShow` loads all data; add `page`/`limit` params to API |
| **Validation Library** | Use Zod for schema validation (client + server) |
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