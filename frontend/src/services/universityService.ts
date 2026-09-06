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

export const getFaculty = async () => {
  const { data } = await universityApi.get("/university/faculty");
  return data.faculty;
};

export const addFaculty = async (payload: { name: string; email: string; department: string; expertise: string }) => {
  const { data } = await universityApi.post("/university/faculty", payload);
  return data.faculty;
};

export const updateFaculty = async (
  id: number,
  payload: Partial<{ name: string; email: string; department: string; expertise: string }>
) => {
  const { data } = await universityApi.put(`/university/faculty/${id}`, payload);
  return data.faculty;
};

export const deleteFaculty = async (id: number) => {
  const { data } = await universityApi.delete(`/university/faculty/${id}`);
  return data;
};
