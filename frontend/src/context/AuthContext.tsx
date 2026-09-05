import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Student } from "../types/student";
import * as authService from "../services/authService";
import * as studentService from "../services/studentService";

interface AuthContextValue {
  student: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
  setStudent: (s: Student) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudentState] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("csai_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await studentService.getMe();
        setStudentState(me);
      } catch {
        localStorage.removeItem("csai_token");
        localStorage.removeItem("csai_student");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, student: s } = await authService.login(email, password);
    localStorage.setItem("csai_token", token);
    localStorage.setItem("csai_student", JSON.stringify(s));
    setStudentState(s);
  };

  const logout = async () => {
    await authService.logout();
    setStudentState(null);
  };

  const refreshStudent = async () => {
    const me = await studentService.getMe();
    setStudentState(me);
  };

  const setStudent = (s: Student) => setStudentState(s);

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, refreshStudent, setStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
