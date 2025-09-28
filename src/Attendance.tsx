import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import filterIcon from './assets/icons/icons8-filter-100.png';
import * as XLSX from 'xlsx';

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
  const [season, setSeason] = useState<string>('2025-26');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteGroupFilter, setAthleteGroupFilter] = useState<string>('all');

  // Export to Excel function
  const exportToExcel = () => {
    if (athletes.length === 0) {
      alert('No data to export. Please run a filter first.');
      return;
    }

    // Prepare data for export
    const exportData = athletes.map((athlete, index) => ({
      '#': index + 1,
      Fincode: athlete.fincode,
      Name: athlete.name,
      Present: athlete.presenze,
      Justified: athlete.giustificate,
      'Total Sessions': athlete.total_sessions,
      Percentage: athlete.percent ? `${athlete.percent.toFixed(1)}%` : '0%',
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 5 }, // #
      { wch: 10 }, // Fincode
      { wch: 25 }, // Name
      { wch: 8 }, // Present
      { wch: 10 }, // Justified
      { wch: 12 }, // Total Sessions
      { wch: 12 }, // Percentage
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Summary');

    // Generate filename with current filters
    const seasonText = season;
    const typeText = typeFilter === 'all' ? 'All' : typeFilter;
    const groupText = athleteGroupFilter === 'all' ? 'All' : athleteGroupFilter;
    const filename = `Attendance_${seasonText}_${typeText}_${groupText}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Fetch attendance summary using the get_attendance_stats_by_season function
  const handleFilter = async () => {
    setLoading(true);
    setError(null);

    let typeParam = typeFilter === 'all' ? null : typeFilter;
    let groupParam = athleteGroupFilter === 'all' ? null : athleteGroupFilter;

    try {
      // Debug logging
      console.log('Calling function with parameters:', {
        season: season,
        session_type: typeParam,
        group_name: groupParam,
      });

      // Call the get_attendance_stats_by_season function
      let query = supabase.rpc('get_attendance_stats_by_season', {
        season: season,
        session_type: typeParam,
        group_name: groupParam,
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
          <label htmlFor="season-select" className="form-label">
            Season:
          </label>
          <select
            id="season-select"
            value={season}
            onChange={e => setSeason(e.target.value)}
            className="form-select ml-1"
          >
            <option value="2023-24">2023-24</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>

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
          className="athlete-view-btn"
        >
          <img src={filterIcon} alt="Filter" className="athlete-view-icon" />
        </button>

        <button
          onClick={exportToExcel}
          disabled={loading || athletes.length === 0}
          className="athlete-view-btn"
          style={{ marginLeft: '8px', backgroundColor: '#28a745' }}
          title="Export to Excel"
        >
          📊 Export
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
                      <td className="athlete-portrait-cell">
                        {ath.photo ? (
                          <img
                            src={ath.photo}
                            alt={ath.name ?? 'Athlete portrait'}
                            className="athlete-avatar"
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
                            className="athlete-avatar"
                          />
                        )}
                      </td>
                      <td>{ath.fincode}</td>
                      <td>{ath.name}</td>
                      <td>{ath.presenze}</td>
                      <td>{ath.giustificate}</td>
                      <td>{ath.total_sessions}</td>
                      <td>
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
            <div className="attendance-summary">
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
