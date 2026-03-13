const COLOMBO_OFFSET_MINUTES = 330;
const COLOMBO_OFFSET_MS = COLOMBO_OFFSET_MINUTES * 60 * 1000;

function shiftToColombo(date: Date): Date {
    return new Date(date.getTime() + COLOMBO_OFFSET_MS);
}

function shiftFromColombo(date: Date): Date {
    return new Date(date.getTime() - COLOMBO_OFFSET_MS);
}

export function getColomboDateKey(date: Date): string {
    const shifted = shiftToColombo(date);
    const year = shifted.getUTCFullYear();
    const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const day = String(shifted.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function addColomboDays(date: Date, days: number): Date {
    const shifted = shiftToColombo(date);
    shifted.setUTCDate(shifted.getUTCDate() + days);
    return shiftFromColombo(shifted);
}

export function getColomboDayRange(date: Date): { start: Date; end: Date } {
    const shifted = shiftToColombo(date);
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth();
    const day = shifted.getUTCDate();

    const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - COLOMBO_OFFSET_MS);
    const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - COLOMBO_OFFSET_MS);

    return { start, end };
}
