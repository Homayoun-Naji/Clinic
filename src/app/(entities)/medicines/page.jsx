import Form from "../components/Form";

export const metadata = {
  title: "Add/Update/Delete Medicines",
};

const medicinesFormFields = [
  { title: "ID", name: "id", type: "text", required: true },
  { title: "Name", name: "name", type: "text", required: true },
  { title: "Description", name: "description", type: "text", required: true },
  { title: "Price", name: "price", type: "number", required: true },
  { title: "Stock", name: "stock", type: "number", required: false },
];

export default function Medicines() {
  return (
    <section className="flex justify-center mt-12 text-dark">
      <Form fields={medicinesFormFields} />
    </section>
  );
}
