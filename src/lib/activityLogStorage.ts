import { ActivityLogEntry } from "./types";
import { format, parseISO } from "date-fns"; // Import parseISO

const ACTIVITY_LOG_KEY = "oneflow-activity-log";

export const getActivityLog = (): ActivityLogEntry[] => {
  const data = localStorage.getItem(ACTIVITY_LOG_KEY);
  if (!data) return [];
  
  const rawLog: ActivityLogEntry[] = JSON.parse(data);
  
  // Migrate old entries to ensure checkInDateOnly exists
  return rawLog.map(entry => {
    if (!entry.checkInDateOnly && entry.checkInTime) {
      return {
        ...entry,
        checkInDateOnly: format(parseISO(entry.checkInTime), "yyyy-MM-dd"),
      };
    }
    return entry;
  }).filter(entry => entry.checkInDateOnly); // Filter out any entries that still don't have a valid date (malformed)
};

export const saveActivityLog = (log: ActivityLogEntry[]): void => {
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
};

export const addActivityLogEntry = (entry: ActivityLogEntry): boolean => {
  const log = getActivityLog();
  
  const todayDateOnly = format(new Date(), "yyyy-MM-dd");

  const alreadyCheckedInToday = log.some(
    (existingEntry) =>
      existingEntry.memberId === entry.memberId &&
      existingEntry.taskId === entry.taskId &&
      existingEntry.taskColumnId === entry.taskColumnId &&
      existingEntry.checkInDateOnly === todayDateOnly
  );

  if (alreadyCheckedInToday) {
    return false;
  }

  log.push({ ...entry, checkInDateOnly: todayDateOnly });
  saveActivityLog(log);
  return true;
};

export const deleteActivityLogEntriesByTaskId = (taskId: string): void => {
  const log = getActivityLog();
  const filteredLog = log.filter(entry => entry.taskId !== taskId);
  saveActivityLog(filteredLog);
};

export const deleteActivityLogEntriesByMemberAndTask = (memberId: string, taskId: string): void => {
  const log = getActivityLog();
  const filteredLog = log.filter(entry => !(entry.memberId === memberId && entry.taskId === taskId));
  saveActivityLog(filteredLog);
};