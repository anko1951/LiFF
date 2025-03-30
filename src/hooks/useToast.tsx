import { useState } from "react";

export const useToast = () => {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const showToast = (msg: string, duration = 3000) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, duration);
  };

  const Toast = () =>
    visible ? (
      <div
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#333",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          zIndex: 9999,
        }}
      >
        {message}
      </div>
    ) : null;

  return { showToast, Toast };
};
