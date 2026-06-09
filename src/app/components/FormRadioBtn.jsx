export default function FormRadioBtn({title}) {
  return (
    <span>
      <input type="radio" name="alts" value={title.toLowerCase()} />
      {title}
    </span>
  );
}
