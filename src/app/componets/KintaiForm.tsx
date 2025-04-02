"use client";

import { useState } from "react";

export default function KintaiForm({ userId }: { userId: string }) {
  const [date, setDate] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [rest, setRest] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    const payload = {
      userId,
      date,
      clockIn,
      clockOut,
      rest,
      comment,
      status,
    };

    const res = await fetch("/api/attendance/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    alert(result.message || "送信完了！");
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold">勤怠入力フォーム</h2>

      <label className="block">
        日付：
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </label>

      <label className="block">
        出勤時刻（例：1100）：
        <input
          type="text"
          value={clockIn}
          onChange={(e) => setClockIn(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </label>

      <label className="block">
        退勤時刻（例：2000）：
        <input
          type="text"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </label>

      <label className="block">
        休憩時間（分単位：例 100）：
        <input
          type="text"
          value={rest}
          onChange={(e) => setRest(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </label>

      <label className="block">
        勤怠ステータス（任意）：
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border px-2 py-1 w-full"
        >
          <option value="">選択してください</option>
          <option value="休日">休日</option>
          <option value="祝日">祝日</option>
          <option value="有給">有給</option>
        </select>
      </label>

      <label className="block">
        詳細メモ：
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </label>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        勤怠を記録する
      </button>
    </div>
  );
}
