"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import { useToast } from "@/hooks/useToast";
import { parseISO, differenceInMinutes } from "date-fns";

type AttendanceRecord = {
  timestamp: string;
  userId: string;
  type: "clock_in" | "clock_out";
  message?: string;
};

type MonthlyAttendance = {
  [month: string]: AttendanceRecord[];
};

type Summary = {
  count: number; // 出勤回数
  days: number; // 出勤日数
  totalMinutes: number; // 勤務時間（分）
};

export default function Attendance() {
  const [userId, setUserId] = useState("");
  const [groupedHistory, setGroupedHistory] = useState<MonthlyAttendance>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { showToast, Toast } = useToast();

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

  const groupByMonth = (records: AttendanceRecord[]): MonthlyAttendance => {
    return records.reduce((acc, record) => {
      const month = record.timestamp.slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = [];
      acc[month].push(record);
      return acc;
    }, {} as MonthlyAttendance);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch("/api/attendance/history");
      const all: AttendanceRecord[] = await res.json();
      const ownHistory = all.filter((entry) => entry.userId === userId);

      const grouped = groupByMonth(ownHistory);
      setGroupedHistory(grouped);
    };

    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const sendRequest = async (type: "clock_in" | "clock_out") => {
    showToast(`${type === "clock_in" ? "出勤" : "退勤"}打刻中...`, 99999);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type }),
    });

    const result = await res.json();

    if (result.result === "duplicate") {
      showToast(result.message);
    } else if (result.result === "success") {
      showToast(`${type === "clock_in" ? "出勤" : "退勤"}打刻しました！`);
    } else {
      showToast("エラーが発生しました🥲");
    }
  };

  const allMonths = Object.keys(groupedHistory).sort().reverse();

  const calculateSummary = (records: AttendanceRecord[]): Summary => {
    const clockIns: { [date: string]: string[] } = {};
    const clockOuts: { [date: string]: string[] } = {};

    for (const rec of records) {
      const dateKey = rec.timestamp.slice(0, 10);
      const ts = rec.timestamp;

      if (rec.type === "clock_in") {
        if (!clockIns[dateKey]) clockIns[dateKey] = [];
        clockIns[dateKey].push(ts);
      }

      if (rec.type === "clock_out") {
        if (!clockOuts[dateKey]) clockOuts[dateKey] = [];
        clockOuts[dateKey].push(ts);
      }
    }

    let totalMinutes = 0;
    const uniqueDates = new Set<string>();

    for (const date of Object.keys(clockIns)) {
      const ins = clockIns[date]?.sort()[0]; // 最初の出勤
      const outs = clockOuts[date]?.sort().reverse()[0]; // 最後の退勤

      if (ins && outs) {
        const start = parseISO(ins);
        const end = parseISO(outs);
        let minutes = differenceInMinutes(end, start);

        if (minutes >= 360) {
          minutes -= 60; // 6時間以上 → 1時間休憩
        }

        totalMinutes += minutes;
        uniqueDates.add(date);
      }
    }

    const count = records.filter((r) => r.type === "clock_in").length;

    return {
      count,
      days: uniqueDates.size,
      totalMinutes,
    };
  };

  const selectedRecords = groupedHistory[selectedMonth] || [];
  const summary = calculateSummary(selectedRecords);
  const totalHours = Math.floor(summary.totalMinutes / 60);
  const totalRemainMinutes = summary.totalMinutes % 60;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-lg font-bold">LIFF 勤怠アプリ</h1>
      {userId && <p className="text-sm text-gray-600">ユーザーID: {userId}</p>}

      <div className="space-x-4 mt-2">
        <button onClick={() => sendRequest("clock_in")}>出勤</button>
        <button onClick={() => sendRequest("clock_out")}>退勤</button>
      </div>

      {/* 月選択 */}
      {allMonths.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">表示する月：</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">月を選択してください</option>
            {allMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 勤怠サマリー */}
      {selectedMonth && (
        <div className="mt-6 space-y-2">
          <p>
            📌 出勤回数: <strong>{summary.count}</strong> 回
          </p>
          <p>
            📌 出勤日数: <strong>{summary.days}</strong> 日
          </p>
          <p>
            📌 勤務時間合計:{" "}
            <strong>
              {totalHours}時間 {totalRemainMinutes}分
            </strong>
          </p>
        </div>
      )}

      {/* 出退勤履歴 */}
      {selectedMonth && selectedRecords.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">
            {selectedMonth} の出退勤履歴
          </h2>
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">日付</th>
                <th className="border px-4 py-2">種別</th>
                <th className="border px-4 py-2">メッセージ</th>
              </tr>
            </thead>
            <tbody>
              {selectedRecords.map((item, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-1">{item.timestamp}</td>
                  <td className="border px-4 py-1">
                    {item.type === "clock_in" ? "出勤" : "退勤"}
                  </td>
                  <td className="border px-4 py-1">{item.message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast />
    </div>
  );
}
