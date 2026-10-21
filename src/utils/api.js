export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function getAuthHeaders() {
  const accessToken = localStorage.getItem("accessToken") || "";
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
