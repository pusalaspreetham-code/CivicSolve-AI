import api from "./api";

export const getMe = async () => {
  const { data } = await api.get("/students/me");
  return data.student;
};

export const updateMe = async (payload: Partial<{ name: string; college: string; year_of_study: string; phone: string; city: string }>) => {
  const { data } = await api.put("/students/me", payload);
  return data.student;
};

export const changePassword = async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
  const { data } = await api.put("/students/change-password", {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });
  return data;
};
