import EntityShow from "@/app/components/EntityShow";

const medicinesTitle = ["Name", "Description", "Price", "Stock"];
const medicinesKeys = ["name", "description", "price", "stock"];

export default function MedicinesShow() {
  return (
    <EntityShow
      apiPath="/api/medicines"
      dataTitles={medicinesTitle}
      dataKeys={medicinesKeys}
      requiredKeys={["name", "description", "price"]}
      entityName="Medicine"
      loadingMessage="Loading medicines..."
      itemsPerPage={8}
      searchKeys={["name"]}
      searchPlaceholder="Search by medicine name..."
    />
  );
}
