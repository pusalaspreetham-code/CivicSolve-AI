import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Industry } from "../types/industry";
import * as industryAuthService from "../services/industryAuthService";
import * as industryService from "../services/industryService";

interface IndustryAuthContextValue {
  industry: Industry | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const IndustryAuthContext = createContext<IndustryAuthContextValue | undefined>(undefined);

export const IndustryAuthProvider = ({ children }: { children: ReactNode }) => {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const me = await industryService.getMe();
      setIndustry(me);
      localStorage.setItem("csai_industry", JSON.stringify(me));
    } catch {
      localStorage.removeItem("csai_industry_token");
      localStorage.removeItem("csai_industry");
      setIndustry(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("csai_industry_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await industryService.getMe();
        setIndustry(me);
      } catch {
        localStorage.removeItem("csai_industry_token");
        localStorage.removeItem("csai_industry");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, industry: ind } = await industryAuthService.login(email, password);
    localStorage.setItem("csai_industry_token", token);
    localStorage.setItem("csai_industry", JSON.stringify(ind));
    setIndustry(ind);
  };

  const logout = async () => {
    await industryAuthService.logout();
    setIndustry(null);
  };

  return (
    <IndustryAuthContext.Provider value={{ industry, loading, login, logout, refreshProfile }}>
      {children}
    </IndustryAuthContext.Provider>
  );
};

export const useIndustryAuth = (): IndustryAuthContextValue => {
  const ctx = useContext(IndustryAuthContext);
  if (!ctx) throw new Error("useIndustryAuth must be used within IndustryAuthProvider");
  return ctx;
};
