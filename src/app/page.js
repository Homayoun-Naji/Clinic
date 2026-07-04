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
        <section className="flex max-w-3xl flex-col gap-4 rounded-3xl border border-(--color-border) bg-(--color-surface) px-6 py-6 text-center shadow-[0_18px_70px_var(--color-shadow)] md:gap-8 md:px-10 md:py-10">
          <h2 className="text-2xl font-bold text-secondary md:text-4xl">
            Our vision
          </h2>
          <p className="leading-6 text-light md:leading-8 lg:leading-9">
            Our vision is to simplify clinic management through a modern and
            efficient digital platform. We aim to help healthcare providers
            manage patients, doctors, and medicines with greater accuracy and
            less administrative effort. By improving organization and
            accessibility, we strive to support better healthcare services for
            everyone.
          </p>
        </section>

        <section className="w-full max-w-3xl rounded-3xl border border-(--color-border) bg-(--color-surface-muted) p-12 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <p className="text-2xl uppercase tracking-[0.32em] text-secondary">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold text-dark">
              Homayoun Clinic FAQ
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-(--color-text-muted)">
              Answers to common questions about the clinic, medicine management,
              and patient data.
            </p>
          </div>
          <Accordion items={faqItems} />
        </section>
      </main>
    </>
  );
}
