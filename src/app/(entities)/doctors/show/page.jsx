import EntityShow from "@/app/components/EntityShow";

export const metadata = {
  title: "Clinic Doctors",
};

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
      apiPath="/api/doctors"
      dataTitles={doctorsTitle}
      dataKeys={doctorsKeys}
      requiredKeys={["first_name", "last_name", "specialization"]}
      entityName="Doctor"
      loadingMessage="Loading doctors..."
      itemsPerPage={8}
      searchKeys={["first_name", "last_name"]}
      searchPlaceholder="Search by first or last name..."
    />
  );
}
