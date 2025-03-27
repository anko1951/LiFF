"use client";

import liff from "@line/liff";
import { useEffect, useState } from "react";

export default function Attendance() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    liff.init({ liffId: "2006843239-jJzD9yPm" }).then(() => {
      if (liff.isLoggedIn()) {
        liff.getProfile().then((profile) => {
          setUserId(profile.userId);
        });
      } else {
        liff.login();
      }
    });
  }, []);

  const sendAttendance = async (type: "clockIn" | "clockOut") => {
    if (!userId) return;

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({ userId, type }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      alert(data.status === "success" ? "打刻成功！" : "エラー");
    } catch (error) {
      console.error("fetchエラー:", error);
      alert("通信エラー");
    }
  };

  return (
    <div>
      <h1>勤怠管理</h1>
      <button onClick={() => sendAttendance("clockIn")}>出勤</button>
      <button onClick={() => sendAttendance("clockOut")}>退勤</button>
    </div>
  );
}
