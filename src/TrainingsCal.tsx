import React, { useState, useEffect } from "react";
import { FaSwimmer, FaDumbbell } from "react-icons/fa"; // Import gym icon
import { supabase } from "./supabaseClient";

interface Session {
  id: number;
  date: string; // ISO date string, e.g. "2025-06-14"
  type: "Gym" | "Swim";
  description?: string;
}

async function fetchSessionsForMonth(year: number, month: number): Promise<Session[]> {
  const monthStr = (month + 1).toString().padStart(2, '0');
  const fromDate = `${year}-${monthStr}-01`;
  const toDate = `${year}-${monthStr}-32`;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gte('date', fromDate)
    .lt('date', toDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  // Keep date as string
  return data || [];
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

function groupSessionsByDate(sessions: Session[]) {
  return sessions.reduce((acc, session) => {
    const date = session.date.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, Session[]>);
}

// Weekday headers starting from Monday
const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Adjust so Monday is 0, Sunday is 6
function getMondayStartIndex(day: number) {
  return (day + 6) % 7;
}

const TrainingsCalendar: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSessionsForMonth(currentYear, currentMonth)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [currentYear, currentMonth]);

  const days = getMonthDays(currentYear, currentMonth);
  // Adjust first day index for Monday start
  const firstDayWeekday = getMondayStartIndex(days[0].getDay());
  const calendarCells = Array(firstDayWeekday).fill(null);
  days.forEach((day) => calendarCells.push(day));
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const sessionsByDate = groupSessionsByDate(sessions);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <button onClick={handlePrevMonth}>&lt;</button>
        <h2 style={{ flex: 1, textAlign: "center", margin: 0 }}>
          {new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} {currentYear}
        </h2>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {weekdayHeaders.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: calendarCells.length / 7 }).map((_, weekIdx) => (
              <tr key={weekIdx}>
                {calendarCells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, idx) => {
                  if (!day) return <td key={idx} />;
                  // Format date string as YYYY-MM-DD
                  const year = day.getFullYear();
                  const month = (day.getMonth() + 1).toString().padStart(2, '0');
                  const date = day.getDate().toString().padStart(2, '0');
                  const dateStr = `${year}-${month}-${date}`;
                  const daySessions = sessionsByDate[dateStr] || [];
                  return (
                    <td key={idx} style={{ border: "1px solid #ccc", verticalAlign: "top", height: 80 }}>
                      <div style={{ fontWeight: "bold" }}>{day.getDate()}</div>
                      <div>
                        {daySessions.map((session) =>
                          session.type === "Gym" ? (
                            <div key={session.id} style={{ color: "#2e7d32", fontSize: 16 }}>
                              <FaDumbbell title="Gym session" />
                            </div>
                          ) : (
                            <div key={session.id} style={{ color: "#1976d2", fontSize: 16 }}>
                              <FaSwimmer title="Swim session" />
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TrainingsCalendar;