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
  const [devTime, setDevTime] = useState(""); // ← テスト用時刻入力

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
    if (devTime) return devTime;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}${minutes}`;
  };

  const handleClockIn = () => {
    const current = getCurrentTimeHHmm();
    const currentInt = parseInt(current, 10);
    if (currentInt > 1100) {
      setIsLate(true);
      showToast("⚠️ 遅刻理由を入力してください");
    } else {
      sendToGAS("clock_in", current, "");
    }
  };

  const handleClockOut = () => {
    const current = getCurrentTimeHHmm();
    const currentInt = parseInt(current, 10);
    if (currentInt > 2015) {
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
      rest: type === "clock_out" ? "100" : "",
    };

    try {
      const res = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("🧾 GASレスポンスRaw:", text);

      if (!text) {
        showToast("⚠️ GASレスポンスが空です");
        return;
      }

      const result = JSON.parse(text);
      const actual = result?.result;

      if (actual?.result === "duplicate") {
        showToast(actual.message);
      } else if (actual?.result === "success" || result?.success === true) {
        showToast("✅ 打刻完了！");
      } else {
        showToast("⚠️ 予期せぬレスポンス形式です");
      }
    } catch (err) {
      showToast("❌ 通信エラー or JSON解析失敗");
      console.error("送信エラー:", err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 text-sm">
      <h1 className="text-center text-lg font-bold text-gray-800">
        LIFF 勤怠打刻
      </h1>

      {userId && (
        <p className="text-center text-xs text-gray-500">
          ユーザーID: {userId}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleClockIn}
          className="bg-blue-600 text-white py-3 rounded-md shadow-md text-base w-full"
        >
          🚪 出勤
        </button>
        <button
          onClick={handleClockOut}
          className="bg-green-600 text-white py-3 rounded-md shadow-md text-base w-full"
        >
          🏠 退勤
        </button>
      </div>

      {/* ✅ テスト用：手動で打刻時刻を入力（開発時のみ） */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-4">
          <label className="block font-semibold text-sm text-gray-600">
            ⏱ テスト用打刻時刻（例: 1101）
          </label>
          <input
            type="text"
            value={devTime}
            onChange={(e) => setDevTime(e.target.value)}
            className="border px-2 py-1 mt-1 w-full rounded text-sm"
            placeholder="HHmm形式で入力（例: 2050）"
          />
        </div>
      )}

      {(isLate || isOvertime) && (
        <div className="bg-white border rounded-md p-4 space-y-4 shadow-md">
          {isLate && (
            <div>
              <label className="block font-semibold mb-1">遅刻理由：</label>
              <input
                type="text"
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                className="border px-2 py-2 w-full rounded"
                placeholder="例: 電車遅延"
              />
            </div>
          )}
          {isOvertime && (
            <div>
              <label className="block font-semibold mb-1">残業理由：</label>
              <input
                type="text"
                value={overtimeReason}
                onChange={(e) => setOvertimeReason(e.target.value)}
                className="border px-2 py-2 w-full rounded"
                placeholder="例: 作業の遅れ"
              />
            </div>
          )}
          <button
            onClick={() =>
              handleSubmitReason(isLate ? "clock_in" : "clock_out")
            }
            className="bg-indigo-600 text-white py-3 px-4 rounded w-full"
          >
            送信する
          </button>
        </div>
      )}

      <Toast />
    </div>
  );
}
