import ShowCard from "@/app/components/ShowCard";
import axios from "axios";

export const metadata = {
  title: "Show Patients",
};

const patientsData = await axios
.get("http://localhost:3000/api/patients")
.then((res) => res.data)
.catch((err) => {
  console.error(err);
  return [];
});

const patientsTitle = [
  "First Name",
  "Last Name",
  "Birth Date",
  "Disease",
];

const patientsKeys = [
  "first_name",
  "last_name",
  "birth_date",
  "disease",
];

function patientsDataGenerator(data) {
  return data.map((patient) =>
    patientsKeys.map((key, index) => ({
      title: patientsTitle[index],
      value: patient[key],
    }))
  );
}

const generatedPatientsData = patientsDataGenerator(patientsData);

export default function PatientsShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {generatedPatientsData.map((patient, index) => (
        <ShowCard key={index} data={patient} />
      ))}
    </div>
  );
}
