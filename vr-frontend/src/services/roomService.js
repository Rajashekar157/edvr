
const API_BASE_URL = "http://localhost:8000/api";

export const uploadRoom = async ({
  projectName,
  roomType,
  description,
  files
}) => {
  const formData = new FormData();

  formData.append("project_name", projectName);
  formData.append("room_type", roomType);
  formData.append("description", description);

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/rooms/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Upload failed with status ${response.status}`
    );
  }

  return data;
};
