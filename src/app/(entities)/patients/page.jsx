import Form from "@/app/components/Form";

export const metadata = {
  title: "Add/Update/Delete Patients",
};

const patientsFormFields = [
  { title: "ID", name: "id", type: "text", required: true },
  { title: "First Name", name: "first-name", type: "text", required: true },
  { title: "Last Name", name: "last-name", type: "text", required: true },
  {
    title: "Birth Date",
    name: "birth-date",
    type: "text",
    required: true,
    placeholder: "DD/MM/YYYY Ex: 11/03/2008",
  },
  { title: "Disease", name: "disease", type: "text", required: false },
];

export default function Patients() {
  return (
    <section className="mt-12 flex justify-center px-4 text-light">
      <Form fields={patientsFormFields} />
    </section>
  );
}
