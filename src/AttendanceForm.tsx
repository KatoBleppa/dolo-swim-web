import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Athlete {
  fincode: number;
  name: string;
  photo?: string;
  groups?: string;
  status?: string;
}

interface AttendanceFormProps {
  sessionId: number;
  sessionGroups?: string;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  N: "#e0e0e0", // Not set (gray)
  P: "#b6eab6", // Present (green)
  J: "#fff7b2", // Justified (yellow)
  A: "#f7b6b6", // Absent (red)
};

function cycleStatus(currentStatus?: string) {
  switch (currentStatus) {
    case "N":
    case undefined:
      return "P";
    case "P":
      return "J";
    case "J":
      return "A";
    case "A":
    default:
      return "N";
  }
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ sessionId, sessionGroups, onClose }) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch athletes for the group(s)
        let { data: athletes, error: athletesError } = await supabase
          .from("athletes")
          .select("fincode, name, photo, groups");
        if (athletesError) throw athletesError;
        let filtered = athletes || [];
        if (sessionGroups && sessionGroups.trim() !== "") {
          const groupList = sessionGroups.split(',').map(g => g.trim().toUpperCase());
          filtered = filtered.filter((athlete: Athlete) => {
            if (!athlete.groups) return false;
            const athleteGroups = athlete.groups.split(',').map((t: string) => t.trim().toUpperCase());
            return groupList.some(g => athleteGroups.includes(g));
          });
        }
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        // Fetch attendance for the session
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("fincode, status")
          .eq("session_id", sessionId);
        if (attendanceError) throw attendanceError;
        // Merge attendance status into athletes
        const merged = filtered.map((athlete) => {
          const attendance = attendanceData?.find((a) => a.fincode === athlete.fincode);
          return { ...athlete, status: attendance ? attendance.status : "N" };
        });
        setAthletes(merged);
      } catch (err) {
        console.error("Failed to fetch athletes or attendance:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [sessionId, sessionGroups]);

  const handleNameClick = (fincode: number) => {
    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.fincode === fincode
          ? { ...athlete, status: cycleStatus(athlete.status) }
          : athlete
      )
    );
  };

  const handleSave = async () => {
    try {
      // Fetch current records for this session
      const { data: existingRecords, error: fetchError } = await supabase
        .from("attendance")
        .select("fincode")
        .eq("session_id", sessionId);
      if (fetchError) throw fetchError;
      // Determine fincodes that need deletion
      const fincodesToDelete = athletes
        .filter(a => a.status === 'N' && existingRecords?.some(r => r.fincode === a.fincode))
        .map(a => a.fincode);
      if (fincodesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("attendance")
          .delete()
          .in("fincode", fincodesToDelete)
          .eq("session_id", sessionId);
        if (deleteError) throw deleteError;
      }
      // Prepare attendance records for upsert, excluding those with status 'N'
      const attendanceRecords = athletes
        .filter((athlete) => athlete.status && athlete.status !== 'N')
        .map((athlete) => ({
          session_id: sessionId,
          fincode: athlete.fincode,
          status: athlete.status,
        }));
      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRecords, { onConflict: "session_id,fincode" });
      if (error) throw error;
      alert("Attendance has been saved successfully.");
      onClose();
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert("Failed to save attendance.");
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 340, maxHeight: 900, height: 800, boxShadow: "0 2px 16px rgba(0,0,0,0.2)", position: "relative", maxWidth: 500 }}>
        <h3>Attendance</h3>
        {loading ? (
          <div>Loading athletes...</div>
        ) : (
          <div>
            <ul style={{ maxHeight: 600, overflowY: "auto", padding: 0, listStyle: "none" }}>
              {athletes.map((athlete) => {
                let rowStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                  background: statusColors[athlete.status || 'N'],
                  borderRadius: 8,
                  padding: 8,
                  cursor: "pointer"
                };
                // Convert Google Drive URLs to direct links
                let photoUrl = athlete.photo;
                if (photoUrl && photoUrl.includes('drive.google.com')) {
                  const fileIdMatch = photoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                  if (fileIdMatch) {
                    photoUrl = `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
                  }
                }
                return (
                  <li key={athlete.fincode} style={rowStyle} onClick={() => handleNameClick(athlete.fincode)}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={athlete.name}
                        style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', marginRight: 8 }}
                        onError={e => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=40')}
                      />
                    ) : (
                      <img
                        src={"https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=40"}
                        alt="Default avatar"
                        style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', marginRight: 8 }}
                      />
                    )}
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>{athlete.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{athlete.status || 'N'}</span>
                  </li>
                );
              })}
            </ul>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} style={{ background: '#ff4336', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Close</button>
              <button type="button" onClick={handleSave} style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Save Attendance</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;
