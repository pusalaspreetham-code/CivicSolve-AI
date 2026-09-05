import { Link } from "react-router-dom";
import CaseTracker from "../components/CaseTracker";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Flag,
  GraduationCap,
  Landmark,
  Lightbulb,
  LockKeyhole,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const roles = [
  {
    title: "Student",
    description: "Discover civic problems and contribute practical solutions.",
    icon: GraduationCap,
    href: "/student/login",
    available: true,
    tone: "blue",
  },
  {
    title: "University",
    description: "Track student registrations, engagement, and teams from your institution.",
    icon: Building2,
    href: "/university/login",
    available: true,
    tone: "violet",
  },
  {
    title: "Industry",
    description: "Bring expertise, technology, and measurable implementation support.",
    icon: Wrench,
    href: "#future-access",
    available: false,
    tone: "amber",
  },
  {
    title: "Government",
    description: "Track recurring problems and connect them to accountable action.",
    icon: Landmark,
    href: "#future-access",
    available: false,
    tone: "emerald",
  },
] as const;

const steps = [
  { number: "01", title: "Report clearly", text: "Share the problem in your own words, language, and location." },
  { number: "02", title: "Review with AI", text: "Check the generated summary and classification before anything is saved." },
  { number: "03", title: "Connect people", text: "Students find verified problem statements and work on what matters." },
];

function RoleCard({ role }: { role: (typeof roles)[number] }) {
  const Icon = role.icon;
  const toneClasses = {
    blue: "bg-blue-50 text-blue-900 border-blue-100",
    violet: "bg-violet-50 text-violet-900 border-violet-100",
    amber: "bg-amber-50 text-amber-900 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-100",
  } as const;

  return (
    <Link
      to={role.href}
      className={`group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        role.available ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50/70"
      }`}
      aria-disabled={!role.available}
      onClick={(event) => {
        if (!role.available) event.preventDefault();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClasses[role.tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {role.available ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Open
          </span>
        ) : (
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950">{role.title}</h3>
      <p className="mt-1 min-h-[42px] text-xs leading-5 text-slate-500">{role.description}</p>
      <div className={`mt-4 flex items-center gap-1 text-xs font-bold ${role.available ? "text-blue-900" : "text-slate-400"}`}>
        {role.available ? "Enter portal" : "Access will be enabled later"}
        {role.available && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.15),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.14),transparent_30%)]" />
      <header className="relative z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="CivicSolve home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm">
              <Building2 className="h-5 w-5 text-orange-400" />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight text-slate-950">Civic<span className="text-blue-800">Solve</span></span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">Civic intelligence network</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-blue-900">How it works</a>
            <a href="#access" className="transition-colors hover:text-blue-900">Portals</a>
            <Link to="/find-problem" className="transition-colors hover:text-blue-900">Find a problem</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/find-problem" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:inline-flex">Browse problems</Link>
            <Link to="/citizen" className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-900">
              <Flag className="h-4 w-4 text-orange-400" />
              <span className="hidden sm:inline">Report a problem</span>
              <span className="sm:hidden">Report</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-900 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Public civic problem registry
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Better problems lead to <span className="text-blue-800">better solutions.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              CivicSolve turns everyday observations into clear, structured problem statements so citizens, students, and institutions can move from reporting to responsible action.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/citizen" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900">
                <MessageSquareText className="h-4 w-4 text-orange-400" /> Report a problem <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/find-problem" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-900">
                <FileSearch className="h-4 w-4 text-blue-800" /> Find a problem
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Review before saving</span>
              <span className="inline-flex items-center gap-2"><Network className="h-4 w-4 text-blue-700" /> Duplicate-aware registry</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-slate-500" /> No login to report</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-600/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">CivicSolve workflow</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-950">From voice to verified action</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Sparkles className="h-5 w-5" /></div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["01", "Citizen report", "Original words and location captured"],
                  ["02", "AI-generated draft", "Summary, domain, severity, and likely field"],
                  ["03", "Human confirmation", "Citizen edits anything that is not right"],
                  ["04", "Deduplication", "Similar existing problems are checked before save"],
                ].map(([number, title, text], index) => (
                  <div key={number} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ${index === 3 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-900"}`}>{number}</span>
                    <div className="min-w-0"><p className="text-sm font-bold text-slate-900">{title}</p><p className="truncate text-xs text-slate-500">{text}</p></div>
                    {index === 3 ? <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" /> : <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300" />}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
                <div><p className="text-xl font-black text-slate-950">24/7</p><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Open intake</p></div>
                <div><p className="text-xl font-black text-slate-950">12+</p><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Languages</p></div>
                <div><p className="text-xl font-black text-slate-950">1</p><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Shared registry</p></div>
              </div>
            </div>
          </div>
        </section>

        <CaseTracker />

        <section id="how-it-works" className="mt-20 border-t border-slate-200/80 pt-12">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Designed for trust</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">A clearer path from observation to opportunity.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Every report stays understandable to the person who submitted it and useful to the people who can work on it.</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black tracking-[0.18em] text-blue-700">{step.number}</p><h3 className="mt-4 text-base font-extrabold text-slate-950">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p></div>)}
          </div>
        </section>

        <section id="access" className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Choose your role</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">One network, different ways to contribute.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Student access is available now. The University, Industry, and Government spaces are visible here so the future network is clear from day one.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{roles.map((role) => <RoleCard key={role.title} role={role} />)}</div>
        </section>

        <section id="future-access" className="mt-16 rounded-2xl border border-blue-100 bg-blue-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-300"><Lightbulb className="h-4 w-4" /> Building the civic network</div><h2 className="mt-2 text-2xl font-black tracking-tight">Start where you are. Connect when you are ready.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Citizens can report without signing in. Students can browse problem statements without signing in, and sign in only when they want to work on one.</p></div><Link to="/citizen" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-950 transition hover:bg-blue-50">Start a report <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {new Date().getFullYear()} CivicSolve. A public civic problem registry.</p><div className="flex gap-4 font-semibold"><Link to="/citizen" className="hover:text-blue-900">Report</Link><Link to="/find-problem" className="hover:text-blue-900">Find problems</Link><Link to="/student/login" className="hover:text-blue-900">Student login</Link></div></div></footer>
    </div>
  );
}
