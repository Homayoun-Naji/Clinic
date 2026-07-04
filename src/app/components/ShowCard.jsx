export default function ShowCard({ data }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      {data.map((item, index) => {
        return (
          <p key={index} className="text-sm text-light">
            <span className="font-semibold text-dark">
              {item.title}
            </span>
            : {item.value}
          </p>
        );
      })}
    </div>
  );
}
