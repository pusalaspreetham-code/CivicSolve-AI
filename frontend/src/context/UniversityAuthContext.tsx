import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { University } from "../types/university";
import * as universityAuthService from "../services/universityAuthService";
import * as universityService from "../services/universityService";

interface UniversityAuthContextValue {
  university: University | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UniversityAuthContext = createContext<UniversityAuthContextValue | undefined>(undefined);

export const UniversityAuthProvider = ({ children }: { children: ReactNode }) => {
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("csai_university_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await universityService.getMe();
        setUniversity(me);
      } catch {
        localStorage.removeItem("csai_university_token");
        localStorage.removeItem("csai_university");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, university: u } = await universityAuthService.login(email, password);
    localStorage.setItem("csai_university_token", token);
    localStorage.setItem("csai_university", JSON.stringify(u));
    setUniversity(u);
  };

  const logout = async () => {
    await universityAuthService.logout();
    setUniversity(null);
  };

  return (
    <UniversityAuthContext.Provider value={{ university, loading, login, logout }}>
      {children}
    </UniversityAuthContext.Provider>
  );
};

export const useUniversityAuth = (): UniversityAuthContextValue => {
  const ctx = useContext(UniversityAuthContext);
  if (!ctx) throw new Error("useUniversityAuth must be used within UniversityAuthProvider");
  return ctx;
};
