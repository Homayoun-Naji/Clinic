import ShowCard from "@/app/components/ShowCard";

export const metadata = {
  title: "Show Doctors",
};

const doctorsData = [
  [
    { title: "First Name", value: "Homayoun" },
    { title: "Last Name", value: "Naji" },
    { title: "Specialization", value: "Doctor" },
    { title: "Phone", value: "09010644801" },
    { title: "Email", value: "hjnrokhi@gmail.com" },
  ],
  [
    { title: "First Name", value: "Marjan" },
    { title: "Last Name", value: "Dehghan" },
    { title: "Specialization", value: "Professor" },
    { title: "Phone", value: "09151097687" },
    { title: "Email", value: "bidad.zaman12@gmail.com" },
  ],
];

export default function DoctorsShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {doctorsData.map((doctor, index) => {
        return <ShowCard key={index} data={doctor} />;
      })}
    </div>
  );
}
