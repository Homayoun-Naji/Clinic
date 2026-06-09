import FormInput from "./FormInput";
import FormRadioBtn from "./FormRadioBtn";

export default function Form({ fields }) {
  return (
    <form
      className="flex flex-col w-1/4 gap-2 bg-white p-6 rounded-2xl"
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
        className="bg-primary text-light py-2 rounded-md cursor-pointer"
        type="submit"
      >
        Submit
      </button>
    </form>
  );
}
