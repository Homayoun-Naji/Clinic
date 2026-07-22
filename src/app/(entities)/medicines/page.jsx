import Form from "@/app/components/Form";

export const metadata = {
  title: "Add/Update/Delete Medicines",
};

const medicinesFormFields = [
  { title: "Name", name: "name", type: "text", required: true },
  { title: "Description", name: "description", type: "text", required: true },
  { title: "Price", name: "price", type: "number", required: true },
  { title: "Stock", name: "stock", type: "number", required: false },
];

export default function Medicines() {
  return (
    <section className="mt-12 flex justify-center px-4 text-light">
      <Form fields={medicinesFormFields} />
    </section>
  );
}
