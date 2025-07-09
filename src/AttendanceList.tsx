import React, { useState} from "react";
import { supabase } from "./supabaseClient";

interface Athlete {
  fincode: number;
  name: string;
  photo?: string;
  presenze: number;
  giustificate: number;
  total_sessions: number;
  percent: number;
}

const AttendanceList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("season");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteGroupFilter, setAthleteGroupFilter] = useState<string>('all');

  // Fetch attendance summary using the riepilogo_presenze function
  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    // Prepare parameters for the function
    let groupParam = athleteGroupFilter === 'all' ? null : athleteGroupFilter;
    let startDate = '';
    let endDate = '';
    if (period === 'season') {
      startDate = '2024-09-01';
      endDate = '2025-08-31';
    } else if (period === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    } else if (period === 'custom' && customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    }
    let typeParam = typeFilter === 'all' ? null : typeFilter;
    try {
      // Call the riepilogo_presenze function with the correct parameter order
      let query = supabase.rpc('riepilogo_presenze', {
        gruppo: groupParam,
        start_date: startDate,
        end_date: endDate,
        session_type: typeParam
      });
      // Order by percent desc
      query = query.order('percent', { ascending: false });
      const { data, error } = await query;
      if (error) {
        setError(error.message);
        setAthletes([]);
      } else {
        setAthletes(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setAthletes([]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Attendance Filter</h2>
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
        <label style={{ marginLeft: 24, marginRight: 8 }}>Filter Group:</label>
        <select value={athleteGroupFilter} onChange={e => setAthleteGroupFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="ASS">ASS</option>
          <option value="EA">EA</option>
          <option value="EB">EB</option>
          <option value="PROP">PROP</option>
        </select>
        <button style={{ marginLeft: 24 }} onClick={handleFilter} disabled={loading}>
          {loading ? "Filtering..." : "Filter"}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}
      {/* Athletes summary table */}
      <h2 style={{ marginTop: 40 }}>Group: {athleteGroupFilter === 'all' ? 'All' : athleteGroupFilter}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Portrait</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Fincode</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Present</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Justified</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Total Sessions</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Percent</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((ath, idx) => (
            <tr key={ath.fincode || idx}>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                {ath.photo ? (
                  <img
                    src={ath.photo}
                    alt={ath.name ?? 'Athlete portrait'}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                    onError={e => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50'; }}
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ath.name || 'Avatar')}&background=cccccc&color=ffffff&size=50`}
                    alt="Default avatar"
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
                  />
                )}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{ath.fincode}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{ath.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{ath.presenze}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{ath.giustificate}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{ath.total_sessions}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{ath.percent != null ? ath.percent.toFixed(1) + '%' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
