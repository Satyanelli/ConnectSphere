
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export const connectSocket = () => {
  const accessToken = localStorage.getItem(
    "connectsphere_access_token"
  );

  socket.auth = {
    token: accessToken,
  };

  socket.connect();
};

export default socket;

