import ShowCard from "@/app/components/ShowCard";

export const metadata = {
  title: "Show Medications",
};

const medicinesData = [
  [
    { title: "Name", value: "Cold Stop" },
    { title: "Description", value: "For disease" },
    { title: "Price", value: 150000 },
    { title: "Stock", value: 50 },
  ],
  [
    { title: "Name", value: "C Vitamin" },
    { title: "Description", value: "Vitamin" },
    { title: "Price", value: 50000 },
    { title: "Stock", value: 50 },
  ],
];

export default function MedicinesShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {medicinesData.map((medicine, index) => {
        return <ShowCard key={index} data={medicine} />;
      })}
    </div>
  );
}
