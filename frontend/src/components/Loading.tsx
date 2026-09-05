const Loading = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
    <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3" />
    <p className="text-sm">{label}</p>
  </div>
);

export default Loading;
