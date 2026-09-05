import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as studentService from "../services/studentService";
import { YEARS } from "../types/auth";

const Profile = () => {
  const { student, setStudent } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(student?.name || "");
  const [college, setCollege] = useState(student?.college || "");
  const [yearOfStudy, setYearOfStudy] = useState(student?.year_of_study || "");
  const [phone, setPhone] = useState(student?.phone || "");
  const [city, setCity] = useState(student?.city || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  if (!student) return null;

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await studentService.updateMe({ name, college, year_of_study: yearOfStudy, phone, city });
      setStudent(updated);
      showToast("Profile updated.", "success");
    } catch (err: any) {
      showToast(err.message || "Could not update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await studentService.changePassword(currentPassword, newPassword, confirmNewPassword);
      showToast("Password updated.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      showToast(err.message || "Could not update password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account details</p>
      </div>

      <form onSubmit={handleProfileSave} className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50 text-slate-400" value={student.email} disabled />
          </div>
          <div>
            <label className="label">College / University</label>
            <input className="input" value={college} onChange={(e) => setCollege(e.target.value)} />
          </div>
          <div>
            <label className="label">Branch</label>
            <input className="input bg-slate-50 text-slate-400" value={student.branch} disabled />
          </div>
          <div>
            <label className="label">Year of Study</label>
            <select className="input" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">City</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={savingProfile} className="btn-primary">
          {savingProfile ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Change Password</h2>

        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            required
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            required
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            required
            className="input"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={savingPassword} className="btn-primary">
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
