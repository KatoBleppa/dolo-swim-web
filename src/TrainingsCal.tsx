import React, { useState, useEffect } from "react";
import { FaSwimmer, FaDumbbell } from "react-icons/fa"; // Import gym icon
import { supabase } from "./supabaseClient";

interface Session {
  id: number;
  date: string; // ISO date string, e.g. "2025-06-14"
  type: "Gym" | "Swim";
  description?: string;
  starttime?: string;
  endtime?: string;
  title?: string;
  groups?: string;
  volume?: number;
  location?: string;
  poolname?: string;
  poollength?: number;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newType, setNewType] = useState<"Gym" | "Swim">("Swim");
  const [newDesc, setNewDesc] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newGroups, setNewGroups] = useState("");
  const [newVolume, setNewVolume] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolLength, setNewPoolLength] = useState("");
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

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

    const openModal = (dateStr: string) => {
  setSelectedDate(dateStr);
  setNewStartTime("");
  setNewEndTime("");
  setNewTitle("");
  setNewGroups("");
  setNewType("Swim");
  setNewVolume("");
  setNewDesc("");
  setNewLocation("");
  setNewPoolName("");
  setNewPoolLength("");
  setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
    setNewDesc("");
  };

    // Add this handler
  const openSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setSessionDetailsOpen(true);
  };

  const closeSessionDetails = () => {
    setSessionDetailsOpen(false);
    setSelectedSession(null);
  };

const handleInsertSession = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedDate) return;
  const insertObj = {
    date: selectedDate,
    starttime: newStartTime,
    endtime: newEndTime,
    title: newTitle,
    groups: newGroups,
    type: newType,
    volume: newVolume,
    description: newDesc,
    location: newLocation,
    poolname: newPoolName,
    poollength: newPoolLength,
  };
  const { error } = await supabase.from("sessions").insert([insertObj]);
  if (error) {
    alert("Error inserting session: " + error.message);
    return;
  }
  closeModal();
  setLoading(true);
  fetchSessionsForMonth(currentYear, currentMonth)
    .then(setSessions)
    .finally(() => setLoading(false));
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
                const year = day.getFullYear();
                const month = (day.getMonth() + 1).toString().padStart(2, '0');
                const date = day.getDate().toString().padStart(2, '0');
                const dateStr = `${year}-${month}-${date}`;
                const daySessions = sessionsByDate[dateStr] || [];
                return (
                  <td key={idx} style={{ border: "1px solid #ccc", verticalAlign: "top", height: 80 }}>
                    <div
                      style={{ fontWeight: "bold", cursor: "pointer", color: "#1976d2" }}
                      onClick={() => openModal(dateStr)}
                      title="Add session"
                    >
                      {day.getDate()}
                      <span style={{ marginLeft: 4, fontSize: 14, color: "#888" }}>+</span>
                    </div>
                    <div>
                      {daySessions.map((session) =>
                        session.type === "Gym" ? (
                          <div
                            key={session.id}
                            style={{ color: "#2e7d32", fontSize: 16, cursor: "pointer", display: "inline-block", marginRight: 4 }}
                            onClick={() => openSessionDetails(session)}
                            title="View gym session details"
                          >
                            <FaDumbbell />
                          </div>
                        ) : (
                          <div
                            key={session.id}
                            style={{ color: "#1976d2", fontSize: 16, cursor: "pointer", display: "inline-block", marginRight: 4 }}
                            onClick={() => openSessionDetails(session)}
                            title="View swim session details"
                          >
                            <FaSwimmer />
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

     {/* Modal */}
    {modalOpen && (
    <div
    style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}
    onClick={closeModal}
  >
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 8,
        minWidth: 340,
        boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
        position: "relative",
      }}
      onClick={e => e.stopPropagation()}
    >
      <h3>Add Session for {selectedDate}</h3>
      <form onSubmit={handleInsertSession}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Start Time:{" "}
            <input
              type="time"
              value={newStartTime}
              onChange={e => setNewStartTime(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            End Time:{" "}
            <input
              type="time"
              value={newEndTime}
              onChange={e => setNewEndTime(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Title:{" "}
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Groups:{" "}
            <input
              type="text"
              value={newGroups}
              onChange={e => setNewGroups(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Type:{" "}
            <select value={newType} onChange={e => setNewType(e.target.value as "Gym" | "Swim")}>
              <option value="Swim">Swim</option>
              <option value="Gym">Gym</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Volume:{" "}
            <input
              type="text"
              value={newVolume}
              onChange={e => setNewVolume(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Description:{" "}
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Location:{" "}
            <input
              type="text"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Pool Name:{" "}
            <input
              type="text"
              value={newPoolName}
              onChange={e => setNewPoolName(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Pool Length:{" "}
            <input
              type="text"
              value={newPoolLength}
              onChange={e => setNewPoolLength(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={closeModal}>Cancel</button>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Session Details Modal */}
      {sessionDetailsOpen && selectedSession && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={closeSessionDetails}
        >
        <div
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            minWidth: 320,
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            position: "relative",
            textAlign: "left", // <-- Add this line
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ textAlign: "left" }}>Session Details</h3>
            <div style={{ marginBottom: 8 }}>
              <strong>Date:</strong> {selectedSession.date}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Start Time:</strong> {selectedSession.starttime}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>End Time:</strong> {selectedSession.endtime}  
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Title:</strong> {selectedSession.title}  
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Type:</strong> {selectedSession.type}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Groups:</strong> {selectedSession.groups || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Volume:</strong> {selectedSession.volume || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Description:</strong>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                {selectedSession.description || "-"}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Location:</strong> {selectedSession.location || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Pool Name:</strong> {selectedSession.poolname || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Pool Length:</strong> {selectedSession.poollength || "-"}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={closeSessionDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

}
export default TrainingsCalendar;