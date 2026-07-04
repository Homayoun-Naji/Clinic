import FormInput from "./FormInput";
import FormRadioBtn from "./FormRadioBtn";

export default function Form({ fields }) {
  return (
    <form
      className="flex w-full max-w-xl flex-col gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-(color:--color-shadow)"
      action=""
      method="GET"
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
          />
        );
      })}

      <div className="flex justify-between my-4">
        <FormRadioBtn title="Add" />
        <FormRadioBtn title="Update" />
        <FormRadioBtn title="Delete" />
      </div>
      <button
        className="cursor-pointer rounded-md bg-secondary px-4 py-2 font-medium text-white transition-transform hover:scale-[1.01]"
        type="submit"
      >
        Submit
      </button>
    </form>
  );
}
