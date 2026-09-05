import { useEffect, useState } from "react";
import * as universityService from "../../services/universityService";
import { useToast } from "../../context/ToastContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";

interface UniversityStudent {
  id: number;
  name: string;
  email: string;
  college: string;
  branch: string;
  year_of_study: string;
  city: string;
  created_at: string;
}

const UStudents = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStudents(await universityService.getStudents());
      } catch (err: any) {
        showToast(err.message || "Could not load students.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading label="Loading students..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Students from your university</h1>
        <p className="text-slate-500 mt-1">{students.length} student(s) registered with your institutional email domain.</p>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Students who register using your verified .edu.in domain will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Year</th>
                <th className="px-4 py-2 font-medium">City</th>
                <th className="px-4 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-2 text-slate-600">{s.email}</td>
                  <td className="px-4 py-2 text-slate-600">{s.branch}</td>
                  <td className="px-4 py-2 text-slate-600">{s.year_of_study}</td>
                  <td className="px-4 py-2 text-slate-600">{s.city}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UStudents;
