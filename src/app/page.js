import Image from "next/image";

export default function Home() {
  return (
    <>
      <header className="flex justify-center py-12">
        <Image
          src="/doctor-image.png"
          className="rounded-2xl w-64 h-40 md:w-150 md:h-100"
          width={600}
          height={400}
          alt="doctor image"
        />
      </header>
      <main className="flex justify-center p-8">
        <div className="flex flex-col gap-4 md:gap-8 max-w-md rounded-2xl py-4 md:py-8 px-4 md:px-10 bg-white text-dark text-center">
          <h2 className="text-2xl md:text-4xl font-bold">Our vision</h2>
          <p className="leading-6 md:leading-8 lg:leading-9">
            We are a pharmacy that provides affordable medicines to the people
            of Homayoun. We are committed to providing high-quality medicines
            and services to our customers.
          </p>
        </div>
      </main>
    </>
  );
}
