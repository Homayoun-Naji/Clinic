import ShowCard from "@/app/components/ShowCard";
import axios from "axios";

export const metadata = {
  title: "Show Medications",
};

const medicinesData = await axios
.get("http://localhost:3000/api/medicines")
.then((res) => res.data)
.catch((err) => {
  console.error(err);
  return [];
});

const medicinesTitle = [
  "Name",
  "Description",
  "Price",
  "Stock",
];

const medicinesKeys = [
  "name",
  "description",
  "price",
  "stock",
];

function medicinesDataGenerator(data) {
  return data.map((medicine) =>
    medicinesKeys.map((key, index) => ({
      title: medicinesTitle[index],
      value: medicine[key],
    }))
  );
}

const generatedMedicinesData = medicinesDataGenerator(medicinesData);


export default function MedicinesShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {generatedMedicinesData.map((medicine, index) => {
        return <ShowCard key={index} data={medicine} />;
      })}
    </div>
  );
}
