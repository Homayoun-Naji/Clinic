import EntityShow from "@/app/components/EntityShow";

const medicinesTitle = ["Name", "Description", "Price", "Stock"];
const medicinesKeys = ["name", "description", "price", "stock"];

export default function MedicinesShow() {
  return (
    <EntityShow
      apiPath="http://localhost:3000/api/medicines"
      dataTitles={medicinesTitle}
      dataKeys={medicinesKeys}
      loadingMessage="Loading medicines..."
      itemsPerPage={8}
    />
  );
}
