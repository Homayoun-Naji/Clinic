import Image from "next/image";
import Accordion from "./components/Accordion";
import { Info } from "lucide-react";

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
      <div className="mx-auto mt-8 px-6 md:px-8">
        <div className="flex w-full max-w-3xl items-start gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface-muted) p-4 text-sm leading-6 text-light shadow-sm md:p-6 md:text-base md:leading-7">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-secondary md:h-6 md:w-6"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-semibold text-dark">
              You are viewing a live demo of this project.
            </p>
            <p>
              Users can create, edit, and delete data at any time, so the
              displayed information may change.
            </p>
            <p>
              None of the displayed data represents real people or real records.
            </p>
          </div>
        </div>
      </div>
      <header className="flex justify-center py-12">
        <Image
          src="/doctor-image.webp"
          className="rounded-2xl w-64 h-40 md:w-auto md:h-auto"
          width={600}
          height={400}
          alt="doctor image"
          priority
        />
      </header>
      <main className="flex flex-col items-center gap-16 p-8">
        <section className="flex max-w-3xl flex-col gap-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 md:p-8 text-center shadow-[0_18px_70px_var(--color-shadow)] md:gap-8 md:px-10 md:py-10">
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

        <section className="w-full max-w-3xl rounded-3xl border border-(--color-border) bg-(--color-surface-muted) p-6 md:p-12 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <p className="text-2xl uppercase tracking-[0.32em] text-secondary">
              FAQ
            </p>
            <h2 className="mt-3 text-xl md:text-3xl font-bold text-dark">
              Homayoun Clinic FAQ
            </h2>
            <p className="mx-auto mt-3 md:max-w-2xl text-sm md:leading-7 text-(--color-text-muted)">
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
