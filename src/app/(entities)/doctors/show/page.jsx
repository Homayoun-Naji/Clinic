import EntityShow from "@/app/components/EntityShow";

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

export default function DoctorsShow() {
  return (
    <EntityShow
      apiPath="http://localhost:3000/api/doctors"
      dataTitles={doctorsTitle}
      dataKeys={doctorsKeys}
      requiredKeys={["first_name", "last_name", "specialization"]}
      entityName="Doctor"
      loadingMessage="Loading doctors..."
      itemsPerPage={8}
    />
  );
}
