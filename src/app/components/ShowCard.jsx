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

  useEffect(() => {
    if (isEditing && Object.keys(editValues).length === 0) {
      const initial = {};
      dataKeys.forEach((key) => {
        initial[key] = rawItem[key] ?? "";
      });
      setEditValues(initial);
    }
  }, [isEditing, editValues, dataKeys, rawItem]);

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

  const cancelEdit = () => {
    onFinishEdit();
    setEditValues({});
  };

  const handleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

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
}