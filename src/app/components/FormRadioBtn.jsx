export default function FormRadioBtn({ title }) {
  return (
    <label className="flex items-center gap-2 text-sm text-light">
      <input type="radio" name="alts" value={title.toLowerCase()} />
      <span>{title}</span>
    </label>
  );
}
