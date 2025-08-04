import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Athlete {
  fincode: number;
  name: string;
}

interface AttendanceData {
  month: string;
  attendance_percentage: number;
}

const SEASON_START = '2024-09';
const SEASON_END = '2025-08';

function getSeasonMonths(start: string, end: string) {
  const result: string[] = [];
  let current = new Date(start + '-01');
  const endDate = new Date(end + '-01');
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = (current.getMonth() + 1).toString().padStart(2, '0');
    result.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }
  return result;
}

const months = getSeasonMonths(SEASON_START, SEASON_END);

const TrendPage: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<'all' | number>('all');
  const [selectedType, setSelectedType] = useState<'Swim' | 'Gym'>('Swim');
  const [selectedGroup, setSelectedGroup] = useState<
    'all' | 'ASS' | 'EA' | 'EB' | 'Prop'
  >('all');
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      let query = supabase
        .from('athletes')
        .select('fincode, name, groups')
        .order('name', { ascending: true });
      if (selectedGroup !== 'all') {
        query = query.eq('groups', selectedGroup);
      }
      const { data, error } = await query;
      if (error) {
        setError(error.message);
      } else {
        setAthletes(data || []);
      }
    };
    fetchAthletes();
  }, [selectedGroup]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);

      if (selectedFincode === 'all') {
        setChartData([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        'get_monthly_attendance_percentage',
        {
          fincode_input: selectedFincode,
          session_type_input: selectedType,
        }
      );

      if (error) {
        setError(error.message);
        setChartData([]);
      } else {
        setChartData(data || []);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, [selectedFincode, selectedType]);

  // Add top padding so bars never reach the top
  const chartTopPadding = 24; // px
  const chartHeight = 220;
  const barWidth = 32;
  const barGap = 16;
  const chartWidth = months.length * (barWidth + barGap);

  return (
    <div className="page-container">
      <h1 className="page-title">Attendance Trend</h1>
      <h2 className="text-center mb-4">Sep 2024 – Aug 2025</h2>
      <div className="form-group">
        <div>
          <label htmlFor="group-select" className="form-label">
            Group:
          </label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={e =>
              setSelectedGroup(
                e.target.value as 'all' | 'ASS' | 'EA' | 'EB' | 'Prop'
              )
            }
            className="form-select ml-1"
          >
            <option value="all">All groups</option>
            <option value="ASS">ASS</option>
            <option value="EA">EA</option>
            <option value="EB">EB</option>
            <option value="Prop">Prop</option>
          </select>
        </div>

        <div>
          <label htmlFor="athlete-select" className="form-label">
            Filter by athlete:
          </label>
          <select
            id="athlete-select"
            value={selectedFincode}
            onChange={e =>
              setSelectedFincode(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="form-select ml-1"
          >
            <option value="all">Select an athlete</option>
            {athletes.map(a => (
              <option key={a.fincode} value={a.fincode}>
                {a.name} ({a.fincode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type-select" className="form-label">
            Session type:
          </label>
          <select
            id="type-select"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as 'Swim' | 'Gym')}
            className="form-select ml-1"
          >
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading trend data...</div>
      ) : selectedFincode === 'all' ? (
        <div className="no-data">
          Please select an athlete to view their attendance trend
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <svg
            width={chartWidth}
            height={chartHeight + 60}
            style={{ background: '#f8f8ff', borderRadius: 8 }}
          >
            {/* Y axis grid */}
            {[0, 20, 40, 60, 80, 100].map(y => (
              <g key={y}>
                <line
                  x1={0}
                  x2={chartWidth}
                  y1={chartTopPadding + chartHeight - (y / 100) * chartHeight}
                  y2={chartTopPadding + chartHeight - (y / 100) * chartHeight}
                  stroke="#eee"
                />
                <text
                  x={-8}
                  y={
                    chartTopPadding + chartHeight - (y / 100) * chartHeight + 5
                  }
                  fontSize={12}
                  textAnchor="end"
                >
                  {y}%
                </text>
              </g>
            ))}
            {/* Bars */}
            {months.map((m, i) => {
              const data = chartData.find(cd => cd.month === m);
              const val = data?.attendance_percentage || 0;
              const barColor = val >= 80 ? '#4caf50' : '#f44336'; // green/red logic

              // Bar never reaches the top: max bar height is chartHeight - 12px
              const barMaxHeight = chartHeight - 12;
              const barActualHeight = (val / 100) * barMaxHeight;
              const barY = chartTopPadding + chartHeight - barActualHeight;

              return (
                <g key={m}>
                  <rect
                    x={i * (barWidth + barGap) + 32}
                    y={barY}
                    width={barWidth}
                    height={barActualHeight}
                    fill={barColor}
                    rx={6}
                  />
                  <text
                    x={i * (barWidth + barGap) + 32 + barWidth / 2}
                    y={chartTopPadding + chartHeight + 16}
                    fontSize={12}
                    textAnchor="middle"
                    fill="#333"
                  >
                    {m.slice(5)}
                  </text>
                  {/* Value label above bar with space above the bar and above the number */}
                  {val > 0 && (
                    <text
                      x={i * (barWidth + barGap) + 32 + barWidth / 2}
                      y={barY - 8}
                      fontSize={12}
                      textAnchor="middle"
                      fill="#333"
                    >
                      {`${val}%`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {selectedFincode !== 'all' && chartData.length > 0 && (
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>
            Showing attendance trend for{' '}
            <strong>
              {athletes.find(a => a.fincode === selectedFincode)?.name}
            </strong>{' '}
            in <strong>{selectedType}</strong> sessions
          </p>
          <p>
            <strong>Note:</strong> Green bars indicate attendance ≥80%, red bars
            indicate attendance &lt;80%
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendPage;
