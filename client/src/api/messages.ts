import api from "./axios";

export const sendMessage = async (
  receiverId: string,
  text: string
) => {
  const response = await api.post("/messages", {
    receiverId,
    text,
  });

  return response.data;
};

export const getConversation = async (
  userId: string
) => {
  const response = await api.get(
    `/messages/${userId}`
  );

  return response.data;
};

export const getConversations = async () => {
  const response = await api.get("/messages");

  return response.data;
};