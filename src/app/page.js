import Image from "next/image";
import Accordion from "./components/Accordion";

const faqItems = [
  {
    question: "How can I add a new patient?",
    answer:
      "Hover on the Patients menu item, click Add, fill in the required information, and save the record.",
  },
  {
    question: "Can I update a doctor's information?",
    answer:
      "Yes. Open the Doctors section, select the doctor you want to edit, make the necessary changes, and save them.",
  },
  {
    question: "How do I manage medicine records?",
    answer:
      "Navigate to the Medicines section where you can add, edit, view, or remove medicine records.",
  },
  {
    question: "Is patient data stored securely?",
    answer:
      "Yes. The system is designed to store and manage patient information securely with controlled access.",
  },
  {
    question: "Can I search for specific patients or doctors?",
    answer:
      "Yes. Use the search feature in the relevant section to quickly find records by name or other details.",
  },
];

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
      <main className="flex flex-col items-center gap-16 p-8">
        <section className="flex flex-col gap-4 md:gap-8 max-w-3xl rounded-2xl py-6 md:py-10 px-6 md:px-10 bg-white text-dark text-center shadow-[0_18px_70px_rgba(4,5,46,0.12)]">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary">Our vision</h2>
          <p className="leading-6 md:leading-8 lg:leading-9">
            We are a pharmacy that provides affordable medicines to the people
            of Homayoun. We are committed to providing high-quality medicines
            and services to our customers.
          </p>
        </section>

        <section className="w-full max-w-3xl rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(73,63,187,0.08)] p-6 md:p-8 shadow-[0_20px_60px_rgba(4,5,46,0.12)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <p className="text-2xl uppercase tracking-[0.32em] text-secondary">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold text-light">
              Homayoun Clinic FAQ
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[rgba(255,255,255,0.85)]">
              Answers to common questions about the clinic, medicine management, and patient data.
            </p>
          </div>
          <Accordion items={faqItems} />
        </section>
      </main>
    </>
  );
}
