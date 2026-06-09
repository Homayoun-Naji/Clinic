import ShowCard from "@/app/components/ShowCard";

export const metadata = {
  title: "Show Patients",
};

// async function getData() {
//   const res = await fetch("http://localhost:3000/api/patients")  
//   console.log(res)
// }

// const patientsData = true;

const patientsData = [
  [
    { title: "First Name", value: "Ali" },
    { title: "Last Name", value: "Mohammadi" },
    { title: "Birth Date", value: "11/03/2008" },
    { title: "Disease", value: "Illness" },
  ],
  [
    { title: "First Name", value: "Ahmad" },
    { title: "Last Name", value: "Rezaei" },
    { title: "Birth Date", value: "05/29/2000" },
    { title: "Disease", value: "Illness" },
  ],
];

export default function PatientsShow() {
  return (
    <div className="grid grid-cols-4 gap-8 p-8 mt-12">
      {patientsData.map((patient, index) => {
        return <ShowCard key={index} data={patient} />;
      })}
    </div>
  );
}
