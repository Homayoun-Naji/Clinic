import SubmenuItem from "./SubmenuItem";

export default function NavbarDropdown({ title, entity }) {
  return (
    <li className="group relative flex justify-center">
      <p className="cursor-pointer select-none rounded-full px-3 py-2 text-lg font-medium transition-colors hover:bg-(--color-surface-muted) hover:text-dark">
        {title}
      </p>
      <div className="invisible absolute top-[150%] flex flex-col gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center text-light opacity-0 shadow-lg shadow-(color:--color-shadow) transition-all duration-300 group-hover:visible group-hover:opacity-100">
        <SubmenuItem title="Add" route={`${entity}`} />
        <SubmenuItem title="Update" route={`${entity}`} />
        <SubmenuItem title="Delete" route={`${entity}`} />
        <SubmenuItem title="Show" route={`${entity}/show`} />
      </div>
    </li>
  );
}
