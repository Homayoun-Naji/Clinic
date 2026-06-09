import SubmenuItem from "./SubmenuItem";

export default function NavbarDropdown({ title, entity }) {
  return (
    <>
      <li className="relative flex justify-center group">
        <p className="select-none cursor-pointer hover:underline">{title}</p>
        <div className="flex flex-col gap-4 text-dark bg-white invisible absolute text-center opacity-0 top-[210%] transition-all duration-300 px-4 py-2 group-hover:opacity-100 group-hover:visible">
          <SubmenuItem title="Add" route={`/${entity}`} />
          <SubmenuItem title="Update" route={`/${entity}`} />
          <SubmenuItem title="Delete" route={`/${entity}`} />
          <SubmenuItem title="Show" route={`/${entity}/show`} />
        </div>
      </li>
    </>
  );
}
