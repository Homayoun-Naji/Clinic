import EcgLoader from "./components/EcgLoader";

export default function Loading() {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen flex flex-col items-center justify-center gap-4 bg-[#22252C]">
      <p className="text-white text-3xl mb-4">Homayoun Clinic</p>
      <EcgLoader />
    </div>
  );
}
