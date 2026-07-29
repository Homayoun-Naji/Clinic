import EntityShow from "@/app/components/EntityShow";

const patientsTitle = ["First Name", "Last Name", "Birth Date", "Disease"];
const patientsKeys = ["first_name", "last_name", "birth_date", "disease"];

export default function PatientsShow() {
  return (
    <EntityShow
      apiPath="/api/patients"
      dataTitles={patientsTitle}
      dataKeys={patientsKeys}
      requiredKeys={["first_name", "last_name", "birth_date"]}
      entityName="Patient"
      loadingMessage="Loading patients..."
      itemsPerPage={8}
      searchKeys={["first_name", "last_name"]}
      searchPlaceholder="Search by first or last name..."
    />
  );
}
