import universityApi from "./universityApi";

export const getMe = async () => {
  const { data } = await universityApi.get("/university/me");
  return data.university;
};

export const getDashboard = async () => {
  const { data } = await universityApi.get("/university/dashboard");
  return data;
};

export const getStudents = async () => {
  const { data } = await universityApi.get("/university/students");
  return data.students;
};
