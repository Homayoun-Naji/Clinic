export const normalizeString = (value) => {
  if (typeof value !== "string") return "Unknown";
  const normalized = value.trim();
  return normalized.length ? normalized : "Unknown";
};

export const groupCounts = (items, fieldName) => {
  return items.reduce((acc, item) => {
    const key = normalizeString(item[fieldName]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export const buildDashboardStats = (patients = [], doctors = [], medicines = []) => {
  const uniqueDiseases = new Set(
    patients.map((patient) => normalizeString(patient.disease)),
  );

  return {
    totalPatients: patients.length,
    totalDoctors: doctors.length,
    totalMedicines: medicines.length,
    totalDiseases: uniqueDiseases.has("Unknown") ? uniqueDiseases.size - 1 : uniqueDiseases.size,
  };
};

export const buildDiseaseChartData = (patients = []) => {
  const counts = groupCounts(patients, "disease");
  return Object.entries(counts)
    .filter(([disease]) => disease !== "Unknown")
    .map(([disease, count]) => ({ disease, count }))
    .sort((a, b) => b.count - a.count);
};

export const buildSpecializationChartData = (doctors = []) => {
  const counts = groupCounts(doctors, "specialization");
  return Object.entries(counts)
    .filter(([specialization]) => specialization !== "Unknown")
    .map(([specialization, value]) => ({ specialization, value }))
    .sort((a, b) => b.value - a.value);
};

export const fetchApiResource = async (path) => {
  const response = await fetch(path, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${path}: ${response.status}`);
  }

  return response.json();
};
