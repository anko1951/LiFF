"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";

export default function Attendance() {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const { showToast, Toast } = useToast();

  const [lateReason, setLateReason] = useState("");
  const [overtimeReason, setOvertimeReason] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [devTime, setDevTime] = useState("");

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          setUserId(profile.userId);
        }
      } catch (err) {
        console.error("LIFF初期化エラー:", err);
      }
    };
    initLiff();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUserName = async () => {
      try {
        const res = await fetch("/api/proxyToNameGAS", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.name) setUserName(data.name);
      } catch (err) {
        console.error("名前取得失敗:", err);
      }
    };

    fetchUserName();
  }, [userId]);

  const getCurrentTimeHHmm = (): string => {
    if (devTime) return devTime;
    const now = new Date();
    now.setHours(now.getHours() + 9);
    return now.toISOString().slice(11, 16).replace(":", "");
  };

  const getTodayDateJST = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 9);
    return now.toISOString().slice(0, 10);
  };

  const handleClockIn = () => {
    const current = getCurrentTimeHHmm();
    if (parseInt(current, 10) > 1100) {
      setIsLate(true);
      showToast("⚠️ 遅刻理由を入力してください");
    } else {
      sendToGAS("clock_in", current, "");
    }
  };

  const handleClockOut = () => {
    const current = getCurrentTimeHHmm();
    if (parseInt(current, 10) > 2015) {
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
      date: getTodayDateJST(),
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
      const result = JSON.parse(text);
      console.log("GASレスポンス:", result);

      const isWrapped = result?.result?.result !== undefined;
      const actualResult = isWrapped ? result.result.result : result.result;
      const actualMessage = isWrapped ? result.result.message : result.message;

      if (actualResult === "duplicate") {
        showToast(actualMessage || "この日は既に打刻されています");
      } else if (actualResult === "success") {
        showToast("✅ 打刻完了！");
      } else if (actualResult === "error") {
        showToast(`❌ エラー: ${actualMessage}`);
      } else {
        showToast("⚠️ 予期せぬレスポンス形式です");
      }
    } catch (err) {
      showToast("❌ 通信エラー or JSON解析失敗");
      console.error("送信エラー:", err);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-cyan-100 px-4">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          勤怠管理
        </h1>
        <p className="text-center text-sm text-gray-600">
          {userName ? `${userName} : ${userId}` : `UID: ${userId}`}
        </p>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={handleClockIn}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md text-lg shadow-md"
          >
            出勤
          </button>
          <button
            onClick={handleClockOut}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-md text-lg shadow-md"
          >
            退勤
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ⏱ テスト用時刻（例: 1101）
            </label>
            <input
              type="text"
              value={devTime}
              onChange={(e) => setDevTime(e.target.value)}
              className="border px-3 py-2 w-full rounded text-sm"
              placeholder="例: 2050"
            />
          </div>
        )}

        {(isLate || isOvertime) && (
          <div className="bg-gray-50 border rounded-md p-4 mt-4 space-y-4">
            {isLate && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">
                  遅刻理由：
                </label>
                <input
                  type="text"
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  className="border px-3 py-2 w-full rounded text-sm bg-white placeholder-gray-500 text-gray-900"
                  placeholder="例: 電車遅延"
                />
              </div>
            )}
            {isOvertime && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">
                  残業理由：
                </label>
                <input
                  type="text"
                  value={overtimeReason}
                  onChange={(e) => setOvertimeReason(e.target.value)}
                  className="border px-3 py-2 w-full rounded text-sm bg-white placeholder-gray-500 text-gray-900"
                  placeholder="例: 作業遅れ"
                />
              </div>
            )}
            <button
              onClick={() =>
                handleSubmitReason(isLate ? "clock_in" : "clock_out")
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 w-full rounded-md text-lg"
            >
              送信する
            </button>
          </div>
        )}
      </div>

      <Toast />
    </div>
  );
}
