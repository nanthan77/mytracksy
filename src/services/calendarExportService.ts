// src/services/calendarExportService.ts
// iCalendar (.ics) export for court diary entries

import type { CourtDiaryEntry } from '../lib/db';

/**
 * Generate an iCalendar (.ics) string for one or more court diary entries.
 * Compatible with Google Calendar, Apple Calendar, Outlook.
 */
export function generateICS(entries: CourtDiaryEntry[], lawyerName?: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LexTracksy//Court Diary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const entry of entries) {
    const dtStart = formatICSDateTime(entry.date, entry.time);
    // Default 1-hour duration
    const dtEnd = formatICSDateTime(entry.date, entry.time, 60);
    const uid = `court-${entry.id || Date.now()}-${entry.date}@lextracksy.app`;
    const summary = escapeICS(`${entry.hearingType.toUpperCase()} — ${entry.caseTitle || entry.caseId}`);
    const location = escapeICS(`${entry.court}, Court No. ${entry.courtNo}`);
    const description = escapeICS(
      `Judge: ${entry.judge}\\n` +
      `Hearing: ${entry.hearingType}\\n` +
      `Status: ${entry.status}\\n` +
      (entry.notes ? `Notes: ${entry.notes}\\n` : '') +
      (lawyerName ? `Attorney: ${lawyerName}` : '')
    );

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      `STATUS:${entry.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      // Alarm: 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Court hearing tomorrow — ${entry.caseTitle || entry.caseId}`,
      'END:VALARM',
      // Alarm: 1 hour before
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Court hearing in 1 hour — ${entry.caseTitle || entry.caseId}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Download an .ics file to the user's device.
 */
export function downloadICS(entries: CourtDiaryEntry[], filename?: string, lawyerName?: string): void {
  const icsContent = generateICS(entries, lawyerName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `court-diary-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a single diary entry as .ics.
 */
export function downloadSingleEntryICS(entry: CourtDiaryEntry, lawyerName?: string): void {
  const safeName = (entry.caseTitle || entry.caseId || 'hearing').replace(/[^a-zA-Z0-9]/g, '-');
  downloadICS([entry], `${safeName}-${entry.date}.ics`, lawyerName);
}

// ── Helpers ──

function formatICSDateTime(date: string, time: string, addMinutes = 0): string {
  // date: "2026-03-15", time: "09:30"
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  if (addMinutes > 0) d.setMinutes(d.getMinutes() + addMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
