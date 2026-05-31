/**
 * src/AttendanceTracker.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgraded attendance tracker for Raja Deepu Sooriya Private Limited.
 *
 * What's new vs the old version:
 *  • Full monthly calendar heatmap (Mon–Sun grid with proper day offsets)
 *  • Color-coded cells: Present (gold), Late (amber), Absent (dark), Weekend (muted), Future (invisible)
 *  • Streak counter — current on-time streak + longest streak this month
 *  • Monthly summary bar — Present / Late / Absent / Weekend counts
 *  • Tooltip on hover — shows exact status + time for that day
 *  • Month navigator — go back/forward months to review history
 *  • Recent log table with time + status badges
 *  • All dark:* Tailwind classes replaced with corp-* brand tokens
 *  • Clock In / Clock Out preserved exactly, same Firestore logic
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_START_HOUR = 10;   // Late after 10:00 AM (company policy)
const DAY_LABELS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES     = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Status colour maps (corp-* tokens only, no dark: classes) ───────────────
const STATUS_CELL = {
  present:  { bg: "bg-corp-gold",        text: "text-corp-blue",    ring: "ring-corp-gold/60" },
  late:     { bg: "bg-amber-500",        text: "text-white",        ring: "ring-amber-400/60" },
  absent:   { bg: "bg-white/5",          text: "text-gray-600",     ring: "ring-white/5"      },
  weekend:  { bg: "bg-white/3",          text: "text-gray-700",     ring: "ring-white/5"      },
  future:   { bg: "bg-transparent",      text: "text-transparent",  ring: "ring-transparent"  },
  empty:    { bg: "bg-transparent",      text: "text-transparent",  ring: "ring-transparent"  },
};

// ─── Streak calculator ────────────────────────────────────────────────────────
function calcStreaks(dayStatuses) {
  // dayStatuses: array of {date, status} for the whole month sorted ascending
  let current = 0, longest = 0, temp = 0;
  const today = new Date();
  today.setHours(0,0,0,0);

  const workDays = dayStatuses.filter(d => {
    const dow = d.date.getDay();
    return dow !== 0 && dow !== 6; // exclude weekends
  });

  for (const d of workDays) {
    const dc = new Date(d.date);
    dc.setHours(0,0,0,0);
    if (dc > today) break;
    if (d.status === "present") {
      temp++;
      longest = Math.max(longest, temp);
    } else if (d.status === "late") {
      temp = 0; // late breaks the on-time streak
    } else {
      temp = 0;
    }
  }
  current = temp;
  return { current, longest };
}

// ─── Build calendar grid for a given month ────────────────────────────────────
function buildCalendarGrid(year, month, logs) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const totalDays   = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1);
  // Monday-indexed: Mon=0 … Sun=6
  let startOffset   = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  // Build log lookup: "YYYY-M-D" → {status, time}
  const logMap = {};
  for (const log of logs) {
    if (log.type !== "Clock In") continue;
    const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    logMap[key] = { status: log.status === "Late" ? "late" : "present", time: timeStr };
  }

  const dayStatuses = [];
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dow  = date.getDay(); // 0=Sun, 6=Sat
    const key  = `${year}-${month}-${d}`;
    let status;
    if (dow === 0 || dow === 6) {
      status = "weekend";
    } else if (date > today) {
      status = "future";
    } else {
      status = logMap[key]?.status ?? "absent";
    }
    dayStatuses.push({ date, status, time: logMap[key]?.time ?? null, day: d });
  }

  // Pad front with empty cells
  const cells = [
    ...Array(startOffset).fill(null),
    ...dayStatuses,
  ];
  return { cells, dayStatuses };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ day, status, time }) {
  const labels = { present: "Present", late: "Late", absent: "Absent", weekend: "Weekend", future: "Upcoming" };
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none
                    bg-corp-blue border border-white/20 rounded-sm px-2.5 py-1.5 whitespace-nowrap shadow-xl">
      <div className="text-white text-[11px] font-bold">{day}</div>
      <div className={`text-[10px] font-semibold mt-0.5 ${
        status === "present" ? "text-corp-gold" :
        status === "late"    ? "text-amber-400" :
        status === "absent"  ? "text-red-400"   : "text-gray-400"
      }`}>{labels[status] ?? status}</div>
      {time && <div className="text-gray-400 text-[10px]">at {time}</div>}
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-corp-blue" />
    </div>
  );
}

// ─── Calendar cell ────────────────────────────────────────────────────────────
function CalCell({ cell, monthName }) {
  const [hovered, setHovered] = useState(false);
  if (!cell) {
    return <div className="w-full aspect-square" />;
  }
  const { status, time, day, date } = cell;
  const c = STATUS_CELL[status] ?? STATUS_CELL.absent;
  const isToday = (() => {
    const t = new Date(); t.setHours(0,0,0,0);
    const dc = new Date(date); dc.setHours(0,0,0,0);
    return dc.getTime() === t.getTime();
  })();

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`
        w-full aspect-square rounded-sm flex items-center justify-center
        text-[11px] font-bold cursor-default select-none transition-all duration-150
        ${c.bg} ${c.text}
        ${isToday ? "ring-2 ring-offset-1 ring-offset-corp-blue-mid ring-white/80 scale-110 z-10" : ""}
        ${status !== "future" && status !== "empty" ? "hover:scale-110 hover:z-10" : ""}
      `}>
        {status !== "empty" && status !== "future" ? day : ""}
      </div>
      {hovered && status !== "future" && status !== "empty" && (
        <Tooltip
          day={`${day} ${monthName}`}
          status={status}
          time={time}
        />
      )}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-sm border ${color}`}>
      <span className="text-2xl font-black font-display leading-none">{value}</span>
      <span className="text-[10px] font-bold tracking-widest uppercase mt-1 opacity-70">{label}</span>
    </div>
  );
}

// ─── Streak badge ─────────────────────────────────────────────────────────────
function StreakBadge({ current, longest }) {
  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-corp-gold/10 border border-corp-gold/30 rounded-sm">
        <span className="text-xl">🔥</span>
        <div>
          <div className="text-corp-gold font-black text-xl leading-none">{current}</div>
          <div className="text-corp-gold/60 text-[9px] font-bold tracking-widest uppercase mt-0.5">Current streak</div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm">
        <span className="text-xl">🏆</span>
        <div>
          <div className="text-white font-black text-xl leading-none">{longest}</div>
          <div className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mt-0.5">Best this month</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AttendanceTracker({ userEmail, userName, role }) {
  const [logs,           setLogs]           = useState([]);
  const [isCheckedIn,    setIsCheckedIn]    = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [viewMonth,      setViewMonth]      = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  // ── Fetch attendance logs ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const q = query(
          collection(db, "attendance"),
          where("email", "==", userEmail),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateStr: d.data().timestamp?.toDate().toDateString(),
        }));
        setLogs(data);

        // Check if currently clocked in
        const activeShift = data.find(
          l => l.type === "Clock In" &&
               !data.some(out => out.type === "Clock Out" && out.shiftRef === l.id)
        );
        if (activeShift) {
          setIsCheckedIn(true);
          setCurrentShiftId(activeShift.id);
        }
      } catch (e) {
        console.error("Error fetching attendance:", e);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [userEmail]);

  // ── Build calendar data ───────────────────────────────────────────────────
  const { cells, dayStatuses } = useMemo(
    () => buildCalendarGrid(viewMonth.year, viewMonth.month, logs),
    [viewMonth, logs]
  );

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return dayStatuses.reduce(
      (acc, d) => {
        if (d.date > today) return acc;
        acc[d.status] = (acc[d.status] ?? 0) + 1;
        return acc;
      },
      { present: 0, late: 0, absent: 0, weekend: 0 }
    );
  }, [dayStatuses]);

  // ── Streak ────────────────────────────────────────────────────────────────
  const { current: streakCurrent, longest: streakLongest } = useMemo(
    () => calcStreaks(dayStatuses),
    [dayStatuses]
  );

  // ── Clock in / out ────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    const now    = new Date();
    const isLate = now.getHours() >= WORK_START_HOUR;
    const logData = {
      email:     userEmail,
      name:      userName,
      type:      "Clock In",
      status:    isLate ? "Late" : "On-Time",
      timestamp: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "attendance"), logData);
    setLogs([{ id: docRef.id, ...logData, dateStr: new Date().toDateString() }, ...logs]);
    setIsCheckedIn(true);
    setCurrentShiftId(docRef.id);
    alert(
      isLate
        ? "Clocked in. Status: Late (past 10:00 AM)."
        : "Clocked in on time! Have a productive shift."
    );
  };

  const handleClockOut = async () => {
    if (!currentShiftId) return;
    await addDoc(collection(db, "attendance"), {
      email:     userEmail,
      name:      userName,
      type:      "Clock Out",
      shiftRef:  currentShiftId,
      timestamp: serverTimestamp(),
    });
    setIsCheckedIn(false);
    setCurrentShiftId(null);
    window.location.reload();
  };

  // ── Month navigation ──────────────────────────────────────────────────────
  const goMonth = (delta) => {
    setViewMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      if (m < 0)  { m = 11; y--; }
      return { year: y, month: m };
    });
  };

  const isCurrentMonth = (() => {
    const n = new Date();
    return viewMonth.year === n.getFullYear() && viewMonth.month === n.getMonth();
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-corp-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading attendance data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Clock In / Out terminal ─────────────────────────────────────── */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-6
                      flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-5">
        <div>
          <h3 className="text-white font-bold text-base">Shift Tracking Terminal</h3>
          <p className="text-gray-500 text-xs mt-1">
            On-time threshold: <span className="text-corp-gold font-semibold">10:00 AM</span>.
            Late arrivals are flagged automatically.
          </p>
          {isCheckedIn && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1
                            bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                Shift in progress
              </span>
            </div>
          )}
        </div>
        <button
          onClick={isCheckedIn ? handleClockOut : handleClockIn}
          className={`flex-shrink-0 px-7 py-3.5 rounded-sm font-black text-xs uppercase
                      tracking-widest text-white shadow-md transition-all active:scale-95 ${
            isCheckedIn
              ? "bg-corp-red hover:bg-corp-red-dark shadow-corp-red/20"
              : "bg-corp-gold hover:bg-amber-500 shadow-corp-gold/20 text-corp-blue"
          }`}
        >
          {isCheckedIn ? "⏹ Clock Out" : "▶ Clock In"}
        </button>
      </div>

      {/* ── Streak badges ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-4 px-1">
        <StreakBadge current={streakCurrent} longest={streakLongest} />
        <p className="text-gray-600 text-[11px] leading-relaxed max-w-xs hidden lg:block">
          🔥 streak counts consecutive <strong className="text-white">on-time</strong> working days.
          A late or absent day resets it.
        </p>
      </div>

      {/* ── Monthly heatmap calendar ────────────────────────────────────── */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm overflow-hidden">

        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <button
            onClick={() => goMonth(-1)}
            className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white/10 text-gray-400
                       hover:text-white flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" className="w-3.5 h-3.5">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>

          <div className="text-center">
            <div className="text-white font-bold text-sm tracking-widest uppercase">
              {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
            </div>
            {isCurrentMonth && (
              <div className="text-corp-gold text-[10px] font-semibold tracking-widest uppercase mt-0.5">
                Current Month
              </div>
            )}
          </div>

          <button
            onClick={() => goMonth(1)}
            disabled={isCurrentMonth}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors
                        ${isCurrentMonth
                          ? "bg-white/5 text-gray-700 cursor-not-allowed"
                          : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"}`}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" className="w-3.5 h-3.5">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1.5 px-6 pt-4 pb-1">
          {DAY_LABELS.map(d => (
            <div key={d}
              className={`text-center text-[10px] font-bold tracking-widest uppercase
                          ${d === "Sat" || d === "Sun" ? "text-gray-700" : "text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells grid */}
        <div className="grid grid-cols-7 gap-1.5 px-6 pb-5 pt-1">
          {cells.map((cell, i) => (
            <CalCell
              key={i}
              cell={cell}
              monthName={MONTH_NAMES[viewMonth.month].slice(0, 3)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="px-6 pb-5 flex flex-wrap gap-x-5 gap-y-2">
          {[
            { color: "bg-corp-gold",  label: "Present (on time)" },
            { color: "bg-amber-500",  label: "Late (after 10 AM)" },
            { color: "bg-white/5 border border-white/10", label: "Absent" },
            { color: "bg-white/3",    label: "Weekend" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-gray-500 text-[10px] font-medium">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm ring-2 ring-white/80 bg-corp-blue-mid" />
            <span className="text-gray-500 text-[10px] font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* ── Monthly summary pills ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label="Present"
          value={summary.present}
          color="bg-corp-gold/10 border-corp-gold/30 text-corp-gold"
        />
        <StatPill
          label="Late"
          value={summary.late}
          color="bg-amber-500/10 border-amber-500/30 text-amber-400"
        />
        <StatPill
          label="Absent"
          value={summary.absent}
          color="bg-red-500/10 border-red-500/30 text-red-400"
        />
        <StatPill
          label="Weekends"
          value={summary.weekend}
          color="bg-white/5 border-white/10 text-gray-500"
        />
      </div>

      {/* ── Recent log table ────────────────────────────────────────────── */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-sm">Recent Activity Log</h3>
          <p className="text-gray-500 text-xs mt-0.5">Last 10 punch events</p>
        </div>
        <div className="divide-y divide-white/5">
          {logs.slice(0, 10).map((log, i) => {
            const ts = log.timestamp?.toDate
              ? log.timestamp.toDate()
              : new Date(log.timestamp ?? Date.now());
            return (
              <div key={i}
                className="flex items-center justify-between px-6 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.type === "Clock In" ? "bg-corp-gold" : "bg-gray-600"
                  }`} />
                  <div>
                    <div className="text-white text-xs font-semibold">{log.type}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      {ts.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                {log.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest ${
                    log.status === "Late"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-corp-gold/15 text-corp-gold"
                  }`}>
                    {log.status}
                  </span>
                )}
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-600 text-xs font-medium">
              No attendance records yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
