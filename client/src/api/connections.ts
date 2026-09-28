import api from "./axios";

export const sendConnectionRequest = async (
  userId: string
) => {
  const response = await api.post("/connections/request", {
    userId,
  });

  return response.data;
};

export const acceptConnectionRequest = async (
  connectionId: string
) => {
  const response = await api.patch(
    `/connections/request/${connectionId}/accept`
  );

  return response.data;
};

export const rejectConnectionRequest = async (
  connectionId: string
) => {
  const response = await api.patch(
    `/connections/request/${connectionId}/reject`
  );

  return response.data;
};

export const getIncomingRequests = async () => {
  const response = await api.get("/connections/requests");

  return response.data;
};

export const getSentRequests = async () => {
  const response = await api.get("/connections/sent");

  return response.data;
};

export const getConnections = async () => {
  const response = await api.get("/connections");

  return response.data;
};

export const getRelationshipStatus = async (
  userId: string
) => {
  const response = await api.get(
    `/connections/status/${userId}`
  );

  return response.data;
};

export const removeConnection = async (
  userId: string
) => {
  const response = await api.delete(
    `/connections/${userId}`
  );

  return response.data;
};