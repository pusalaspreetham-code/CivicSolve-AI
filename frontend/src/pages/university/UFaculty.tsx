import { useEffect, useState, FormEvent } from "react";
import { Plus, Pencil, Trash2, X, GraduationCap } from "lucide-react";
import * as universityService from "../../services/universityService";
import { Faculty } from "../../types/faculty";
import { useToast } from "../../context/ToastContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";

const emptyForm = { name: "", email: "", department: "", expertise: "" };

const UFaculty = () => {
  const { showToast } = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setFaculty(await universityService.getFaculty());
    } catch (err: any) {
      showToast(err.message || "Could not load faculty.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (f: Faculty) => {
    setEditingId(f.id);
    setForm({ name: f.name, email: f.email, department: f.department, expertise: f.expertise });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.department.trim() || !form.expertise.trim()) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await universityService.updateFaculty(editingId, form);
        showToast("Faculty member updated.", "success");
      } else {
        await universityService.addFaculty(form);
        showToast("Faculty member added.", "success");
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not save faculty member.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this faculty member? Students will no longer be able to request their guidance.")) return;
    try {
      await universityService.deleteFaculty(id);
      showToast("Faculty member removed.", "success");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not remove faculty member.", "error");
    }
  };

  if (loading) return <Loading label="Loading faculty..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Faculty Management</h1>
          <p className="text-slate-500 mt-1">
            Add faculty members who can guide students on civic problems. Faculty interact entirely through email — no
            separate login is required.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      {faculty.length === 0 ? (
        <EmptyState
          title="No faculty members yet"
          description="Add a faculty member so students can request their guidance on civic problems."
          icon={<GraduationCap size={22} />}
          action={
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Faculty
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Department / Field</th>
                <th className="px-4 py-2 font-medium">Expertise</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{f.name}</td>
                  <td className="px-4 py-2 text-slate-600">{f.email}</td>
                  <td className="px-4 py-2 text-slate-600">{f.department}</td>
                  <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={f.expertise}>
                    {f.expertise}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="text-slate-500 hover:text-brand-700" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="text-slate-500 hover:text-red-600" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <h3 className="font-semibold text-slate-900">{editingId ? "Edit Faculty Member" : "Add Faculty Member"}</h3>

            <div>
              <label className="label">Faculty Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Faculty Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Student guidance requests will be sent to this email.</p>
            </div>
            <div>
              <label className="label">Department / Field</label>
              <input
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Expertise</label>
              <textarea
                className="input min-h-[70px]"
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Faculty"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UFaculty;
