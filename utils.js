"use strict";

exports.returnStartEndQueryDates = function returnStartEndQueryDates(
  year,
  month,
  day
) {
  const baseDate = new Date(year, month, day);
  const endDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 15
  );
  return {
    start: baseDate.toISOString(),
    end: endDate.toISOString(),
    nextYear: endDate.getUTCFullYear(),
    nextMonth: endDate.getUTCMonth(),
    nextDay: endDate.getUTCDate(),
  };
};
