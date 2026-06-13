export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/90 shadow-xl shadow-black/10 w-full max-w-md">
      <div className="h-14 w-14 rounded-full border-4 border-white/10 border-t-white animate-spin" />
      <p className="text-sm md:text-base">{message}</p>
    </div>
  );
}
