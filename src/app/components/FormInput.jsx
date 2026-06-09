export default function FormInput({title, name, type, required, placeholder }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name}>{title}:</label>
      <input
        className="outline-0 border rounded-sm p-1"
        type={type}
        name={name}
        required={required ? true : false}
        placeholder={placeholder}
      />
    </div>
  );
}
