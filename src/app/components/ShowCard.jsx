export default function ShowCard({ data }) {
  console.log(data)
  return (
    <div className="flex flex-col bg-secondary gap-2 p-4 rounded-2xl">
      
      {data.map((item, index) => {
        return (
          <p key={index}>
            {item.title}: {item.value}
          </p>
        );
      })}
    </div>
  );
}
