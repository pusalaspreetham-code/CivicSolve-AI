interface Props {
  severity: string;
}

const styles: Record<string, string> = {
  critical: "bg-red-100 text-red-800 ring-1 ring-red-300 font-semibold",
  high: "bg-orange-100 text-orange-800 ring-1 ring-orange-300 font-semibold",
  medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const SeverityBadge = ({ severity }: Props) => {
  const key = (severity || "").toLowerCase();
  const cls = styles[key] || styles.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide ${cls}`}>
      {severity || "Unknown"}
    </span>
  );
};

export default SeverityBadge;
