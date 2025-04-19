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
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const initLiff = async () => {
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        const profile = await liff.getProfile();
        setUserId(profile.userId);
        setDisplayName(profile.displayName); // ← 追加！！
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

      let result = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch (err) {
        showToast("⚠️ GASレスポンスが不正です");
        console.error("JSONパース失敗:", err);
        return;
      }

      const actual = result?.result;

      if (actual?.result === "duplicate") {
        showToast(actual.message);
      } else if (actual?.result === "success" || result?.success === true) {
        showToast("✅ 打刻完了！");
      } else {
        showToast("⚠️ 予期せぬエラーが発生しました");
      }
    } catch (err) {
      showToast("❌ 通信エラー");
      console.error("送信エラー:", err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 text-sm">
      <h1 className="text-center text-lg font-bold text-gray-800">
        LIFF 勤怠打刻
      </h1>

      {displayName && (
        <p className="text-sm text-gray-600">こんにちは、{displayName} さん</p>
      )}

      {/* ✅ 横並びボタン（出勤・退勤） */}
      <div className="grid grid-cols-2 gap-4 mt-6">
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
