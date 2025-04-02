"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import { useToast } from "@/hooks/useToast";

export default function Attendance() {
  const [userId, setUserId] = useState("");
  const { showToast, Toast } = useToast();

  const [lateReason, setLateReason] = useState("");
  const [overtimeReason, setOvertimeReason] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        const profile = await liff.getProfile();
        setUserId(profile.userId);
      }
    };
    initLiff();
  }, []);

  const getCurrentTimeHHmm = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}${minutes}`;
  };

  const handleClockIn = () => {
    const current = getCurrentTimeHHmm();
    if (parseInt(current) > 1100) {
      setIsLate(true);
      showToast("⚠️ 遅刻理由を入力してください");
    } else {
      sendToGAS("clock_in", current, "");
    }
  };

  const handleClockOut = () => {
    const current = getCurrentTimeHHmm();
    if (parseInt(current) > 2015) {
      setIsOvertime(true);
      showToast("⚠️ 残業理由を入力してください");
    } else {
      sendToGAS("clock_out", current, "");
    }
  };

  const handleSubmitReason = (type: "clock_in" | "clock_out") => {
    const current = getCurrentTimeHHmm();

    let message = "";
    if (isLate && lateReason) message += `${lateReason}の理由で遅刻 `;
    if (isOvertime && overtimeReason)
      message += `${overtimeReason}の理由で残業`;

    sendToGAS(type, current, message.trim());

    setIsLate(false);
    setIsOvertime(false);
    setLateReason("");
    setOvertimeReason("");
  };

  const sendToGAS = async (
    type: "clock_in" | "clock_out",
    time: string,
    comment: string
  ) => {
    showToast("送信中...", 99999);

    const payload = {
      userId,
      date: new Date().toISOString().slice(0, 10),
      type,
      time,
      comment,
      rest: type === "clock_out" ? "100" : "", // 🍱 退勤時のみ休憩時間100を送信
    };

    try {
      const res = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("🧾 GASレスポンス:", result);

      const actual = result.result;

      if (actual?.result === "duplicate") {
        showToast(actual.message);
      } else if (actual?.result === "success" || result.success === true) {
        showToast("✅ 打刻完了！");
      } else {
        showToast("⚠️ 予期せぬエラーが発生しました");
      }
    } catch (err) {
      showToast("❌ ネットワークエラー");
      console.error("送信エラー:", err);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-lg font-bold">LIFF 勤怠アプリ</h1>
      {userId && <p className="text-sm text-gray-600">ユーザーID: {userId}</p>}

      <div className="space-x-4 mt-2">
        <button
          onClick={handleClockIn}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          出勤
        </button>
        <button
          onClick={handleClockOut}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          退勤
        </button>
      </div>

      {(isLate || isOvertime) && (
        <div className="space-y-2 mt-6">
          {isLate && (
            <div>
              <label className="block font-semibold">遅刻理由：</label>
              <input
                type="text"
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                className="border px-2 py-1 w-full"
              />
            </div>
          )}
          {isOvertime && (
            <div>
              <label className="block font-semibold">残業理由：</label>
              <input
                type="text"
                value={overtimeReason}
                onChange={(e) => setOvertimeReason(e.target.value)}
                className="border px-2 py-1 w-full"
              />
            </div>
          )}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={() =>
              handleSubmitReason(isLate ? "clock_in" : "clock_out")
            }
          >
            送信する
          </button>
        </div>
      )}

      <Toast />
    </div>
  );
}
