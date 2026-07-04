import EcgLoader from "./components/EcgLoader";

export default function Loading() {
  return (
    <div className="absolute inset-0 flex h-screen w-screen flex-col items-center justify-center gap-4 bg-(--color-bg) text-light">
      <p className="mb-4 text-3xl font-semibold">Homayoun Clinic</p>
      <EcgLoader />
    </div>
  );
}
