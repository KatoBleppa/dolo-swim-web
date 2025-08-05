import React, { useState } from 'react';
import { supabase } from './supabaseClient';

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
  const [period, setPeriod] = useState<string>('season');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
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
        session_type: typeParam,
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
    <div className="page-container">
      <h1 className="page-title">Attendance Summary</h1>
      <div className="form-group">
        <div>
          <label htmlFor="period-select" className="form-label">
            Period:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="form-select ml-1"
          >
            <option value="season">Season (01.09.2024 - 31.08.2025)</option>
            <option value="month">Current Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {period === 'custom' && (
          <div>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              required
              className="form-input mr-1"
            />
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              required
              className="form-input"
            />
          </div>
        )}

        <div>
          <label htmlFor="type-select" className="form-label">
            Type:
          </label>
          <select
            id="type-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="form-select ml-1"
          >
            <option value="all">All</option>
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </div>

        <div>
          <label htmlFor="group-select" className="form-label">
            Group:
          </label>
          <select
            id="group-select"
            value={athleteGroupFilter}
            onChange={e => setAthleteGroupFilter(e.target.value)}
            className="form-select ml-1"
          >
            <option value="all">All</option>
            <option value="ASS">ASS</option>
            <option value="EA">EA</option>
            <option value="EB">EB</option>
            <option value="PROP">PROP</option>
          </select>
        </div>

        <button
          onClick={handleFilter}
          disabled={loading}
          className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
        >
          {loading ? 'Filtering...' : 'Filter'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading attendance data...</div>
      ) : (
        <>
          <h2 className="text-center mb-3">
            Group: {athleteGroupFilter === 'all' ? 'All' : athleteGroupFilter}
          </h2>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Portrait</th>
                  <th>Fincode</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Justified</th>
                  <th>Total</th>
                  <th>Prct</th>
                </tr>
              </thead>
              <tbody>
                {athletes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-data">
                      No data available for the selected filters
                    </td>
                  </tr>
                ) : (
                  athletes.map((ath, idx) => (
                    <tr key={ath.fincode || idx}>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.photo ? (
                          <img
                            src={ath.photo}
                            alt={ath.name ?? 'Athlete portrait'}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 25,
                              objectFit: 'cover',
                            }}
                            referrerPolicy="no-referrer"
                            onError={e => {
                              e.currentTarget.src =
                                'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50';
                            }}
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ath.name || 'Avatar')}&background=cccccc&color=ffffff&size=50`}
                            alt="Default avatar"
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 25,
                              objectFit: 'cover',
                            }}
                          />
                        )}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.fincode}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {ath.name}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.presenze}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.giustificate}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.total_sessions}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      >
                        {ath.percent != null
                          ? ath.percent.toFixed(1) + '%'
                          : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {athletes.length > 0 && (
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              <p>Showing {athletes.length} athletes</p>
              <p>
                <strong>Note:</strong> Attendance percentages are calculated
                based on total sessions in the selected period
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceList;
