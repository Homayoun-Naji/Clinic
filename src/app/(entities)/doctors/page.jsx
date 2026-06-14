import Form from "@/app/components/Form";

export const metadata = {
  title: "Add/Update/Delete Doctors",
};

const doctorsFormFields = [
  { title: "ID", name: "id", type: "text", required: true },
  { title: "First Name", name: "first-name", type: "text", required: true },
  { title: "Last Name", name: "last-name", type: "text", required: true },
  { title: "Specialization", name: "specialization", type: "text", required: true },
  { title: "Phone", name: "phone", type: "text", required: false },
  { title: "Email", name: "email", type: "email", required: false },
];

export default function Doctors() {
  return (
    <section className="flex justify-center mt-12 text-dark">
      <Form fields={doctorsFormFields} />
    </section>
  );
}
