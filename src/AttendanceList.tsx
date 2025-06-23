import React, { useState } from "react";
import { supabase } from "./supabaseClient";

interface AttendanceRecord {
  attendance_id: number;
  session_id: number;
  fincode: number;
  status: string;
  date: string;
  type: string;
};

const AttendanceList: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("season");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch and filter data based on all dropdowns
  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    let data = [];
    let error = null;
    try {
      let query = supabase.from("attendance_to_sessions").select("*");
      if (period === "season") {
        const seasonStart = "2024-09-01";
        const seasonEnd = "2025-08-31";
        query = query.gte("date", seasonStart).lte("date", seasonEnd);
      } else if (period === "month") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        query = query.gte("date", start).lte("date", end);
      } else if (period === "custom" && customStart && customEnd) {
        query = query.gte("date", customStart).lte("date", customEnd);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter.trim());
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter.trim());
      }
      const res = await query;
      data = res.data || [];
      error = res.error;
      setRecords(data);
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>All Attendance Records</h2>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>
        Total records: {records.length}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Select period: </label>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="season">Season (01.09.2024 - 31.08.2025)</option>
          <option value="month">Current Month</option>
          <option value="custom">Custom Range</option>
        </select>
        {period === "custom" && (
          <span style={{ marginLeft: 12 }}>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              required
              style={{ marginRight: 8 }}
            />
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              required
              style={{ marginRight: 8 }}
            />
          </span>
        )}
        <label style={{ marginLeft: 24, marginRight: 8 }}>Filter Type:</label>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="Swim">Swim</option>
          <option value="Gym">Gym</option>
        </select>
        <label style={{ marginLeft: 24, marginRight: 8 }}>Filter Status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="P">P</option>
          <option value="A">A</option>
          <option value="J">J</option>
        </select>
        <button style={{ marginLeft: 24 }} onClick={handleFilter} disabled={loading}>
          {loading ? "Filtering..." : "Filter"}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Attendance ID</th>
            <th>Session ID</th>
            <th>Fincode</th>
            <th>Status</th>
            <th>Date</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {records
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((rec) => (
              <tr key={rec.attendance_id}>
                <td>{rec.attendance_id}</td>
                <td>{rec.session_id}</td>
                <td>{rec.fincode}</td>
                <td>{rec.status}</td>
                <td>{rec.date || ""}</td>
                <td>{rec.type || ""}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
