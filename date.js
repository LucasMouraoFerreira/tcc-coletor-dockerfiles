"use strict";

exports.returnStartEndQueryDates = function returnStartEndQueryDates(
  year,
  month,
  day
) {
  const baseDate = new Date(year, month, day);
  return {
    start: baseDate.toISOString(),
    end: new Date(baseDate.setMonth(baseDate.getMonth() + 1)).toISOString(),
  };
};
console.log(returnStartEndDates(2013, 3, 20));
