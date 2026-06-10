import ShowCard from "@/app/components/ShowCard";
import axios from "axios";

export const metadata = {
  title: "Show Doctors",
};

const doctorsData = await axios
.get("http://localhost:3000/api/doctors")
.then((res) => res.data)
.catch((err) => {
  console.error(err);
  return [];
});

const doctorsTitle = [
  "First Name",
  "Last Name",
  "Specialization",
  "Phone",
  "Email",
];

const doctorsKeys = [
  "first_name",
  "last_name",
  "specialization",
  "phone",
  "email",
];

function doctorsDataGenerator(data) {
  return data.map((doctor) =>
    doctorsKeys.map((key, index) => ({
      title: doctorsTitle[index],
      value: doctor[key],
    }))
  );
}

const generatedDoctorsData = doctorsDataGenerator(doctorsData);

export default function DoctorsShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {generatedDoctorsData.map((doctor, index) => {
        return <ShowCard key={index} data={doctor} />;
      })}
    </div>
  );
}
