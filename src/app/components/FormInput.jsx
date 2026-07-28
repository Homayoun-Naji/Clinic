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