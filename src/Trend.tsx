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

function getSeasonMonths(season: string) {
  const result: string[] = [];
  const [startYear, endYear] = season.split('-');

  // Generate months from September of start year to August of end year
  // For '2024-25': Sep 2024 to Aug 2025
  const startYearNum = parseInt(startYear);
  const endYearNum = parseInt('20' + endYear); // Convert '25' to '2025'

  // September to December of start year
  for (let month = 9; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    result.push(`${startYearNum}-${monthStr}`);
  }

  // January to August of end year
  for (let month = 1; month <= 8; month++) {
    const monthStr = month.toString().padStart(2, '0');
    result.push(`${endYearNum}-${monthStr}`);
  }

  return result;
}

function getSeasonDisplayText(season: string) {
  const [startYear, endYear] = season.split('-');
  return `Sep ${startYear} – Aug 20${endYear}`;
}

const TrendPage: React.FC = () => {
  const [season, setSeason] = useState<string>('2025-26');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<'all' | number>('all');
  const [selectedType, setSelectedType] = useState<'Swim' | 'Gym'>('Swim');
  const [selectedGroup, setSelectedGroup] = useState<
    'all' | 'ASS' | 'EA' | 'EB' | 'Prop'
  >('all');
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const months = getSeasonMonths(season);

  console.log('Generated months for chart:', months);
  console.log('Current season:', season);

  useEffect(() => {
    const fetchAthletes = async () => {
      if (selectedGroup === 'all') {
        setAthletes([]);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          'get_athletes_with_rosters',
          {
            paramseason: season,
            paramgroups: selectedGroup,
          }
        );

        if (error) {
          setError(error.message);
        } else {
          setAthletes(data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    };

    fetchAthletes();
  }, [selectedGroup, season]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);

      if (selectedFincode === 'all') {
        setChartData([]);
        setLoading(false);
        return;
      }

      console.log('Calling get_monthly_attendance_percentage with:', {
        fincode_input: selectedFincode,
        season_input: season,
        session_type_input: selectedType,
      });

      const { data, error } = await supabase.rpc(
        'get_monthly_attendance_percentage',
        {
          fincode_input: selectedFincode,
          season_input: season,
          session_type_input: selectedType,
        }
      );

      console.log('Function returned:', { data, error });

      if (error) {
        console.error('Function error:', error);
        setError(error.message);
        setChartData([]);
      } else {
        console.log('Setting chart data:', data);
        setChartData(data || []);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, [selectedFincode, selectedType, season]);

  // Chart dimensions for line chart
  const chartTopPadding = 24; // px
  const chartHeight = 220;
  const pointSpacing = 60;
  const chartPadding = 40;
  const chartWidth = Math.max(
    600,
    (months.length - 1) * pointSpacing + 2 * chartPadding
  );

  return (
    <div className="page-container">
      <h1 className="page-title">Attendance Trend</h1>
      <h2 className="text-center mb-4">{getSeasonDisplayText(season)}</h2>
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
            Athlete:
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
            Type:
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
            {/* Line chart */}
            {months.map((m, i) => {
              const data = chartData.find(cd => cd.month === m);
              const val = data?.attendance_percentage || 0;
              const pointColor = val >= 80 ? '#4caf50' : '#f44336'; // green/red logic

              const x = chartPadding + i * pointSpacing;
              const y =
                chartTopPadding +
                chartHeight -
                (val / 100) * (chartHeight - 12);

              return (
                <g key={m}>
                  {/* Data point circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={pointColor}
                    stroke="white"
                    strokeWidth={2}
                  />

                  {/* Line to next point */}
                  {i < months.length - 1 &&
                    (() => {
                      const nextData = chartData.find(
                        cd => cd.month === months[i + 1]
                      );
                      const nextVal = nextData?.attendance_percentage || 0;
                      const nextX = chartPadding + (i + 1) * pointSpacing;
                      const nextY =
                        chartTopPadding +
                        chartHeight -
                        (nextVal / 100) * (chartHeight - 12);

                      return (
                        <line
                          x1={x}
                          y1={y}
                          x2={nextX}
                          y2={nextY}
                          stroke="#666"
                          strokeWidth={2}
                        />
                      );
                    })()}

                  {/* Month label */}
                  <text
                    x={x}
                    y={chartTopPadding + chartHeight + 16}
                    fontSize={12}
                    textAnchor="middle"
                    fill="#333"
                  >
                    {m.slice(5)}
                  </text>

                  {/* Value label above point */}
                  {val > 0 && (
                    <text
                      x={x}
                      y={y - 8}
                      fontSize={12}
                      textAnchor="middle"
                      fill="#333"
                      fontWeight="bold"
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
            <strong>Note:</strong> Green points indicate attendance ≥80%, red
            points indicate attendance &lt;80%
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendPage;
