import EntityShow from "@/app/components/EntityShow";

const patientsTitle = ["First Name", "Last Name", "Birth Date", "Disease"];
const patientsKeys = ["first_name", "last_name", "birth_date", "disease"];

export default function PatientsShow() {
  return (
    <EntityShow
      apiPath="http://localhost:3000/api/patients"
      dataTitles={patientsTitle}
      dataKeys={patientsKeys}
      loadingMessage="Loading patients..."
      itemsPerPage={8}
    />
  );
}
