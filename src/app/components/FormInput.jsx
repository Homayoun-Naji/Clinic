export default function FormInput({
  title,
  name,
  type,
  required,
  placeholder,
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
      />
    </div>
  );
}
