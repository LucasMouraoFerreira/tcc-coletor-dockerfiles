"use strict";

const axios = require("axios");
const { returnStartEndQueryDates } = require("./utils.js");
const { getRepoInfo, options } = require("./api-utils");
const Bottleneck = require("bottleneck");

const perPage = 100;
let currentYear = 2013;
let currentMonth = 2;
let currentDay = 20;

const limiter = new Bottleneck({
  minTime: 15000,
});

async function collectDockerfiles() {
  const { nextDay, nextMonth, nextYear, start, end } = returnStartEndQueryDates(
    currentYear,
    currentMonth,
    currentDay
  );

  let totalCount = 1;
  currentYear = nextYear;
  currentMonth = nextMonth;
  currentDay = nextDay;
  await axios
    .get(
      `https://api.github.com/search/repositories?page=1&per_page=1&q=topic:docker+created:${start}..${end}`,
      options
    )
    .then(function (response) {
      totalCount = response.data.total_count;
    });

  const totalPages = Math.ceil(totalCount / perPage);

  console.log("\x1b[34m%s\x1b[0m", `Date: ${start}`);
  console.log("\x1b[34m%s\x1b[0m", `Total Pages: ${totalPages}`);

  if (totalPages > 0) {
    for (let index = 1; index <= totalPages; index += 1) {
      await axios
        .get(
          `https://api.github.com/search/repositories?page=${index.toString()}&per_page=100&q=topic:docker+created:${start}..${end}`,
          options
        )
        .then(async function (response) {
          const items = response.data.items;

          for (let i = 0; i < items.length; i += 1) {
            if (items[i].fork === false && items[i].stargazers_count >= 50) {
              await limiter.schedule(() => getRepoInfo(items[i]));
            }
          }
        })
        .catch((err) => console.log(err.message));
    }
  }
}

async function collectLoop() {
  while (`${currentYear}` !== "2021") {
    await collectDockerfiles();
  }
}

collectLoop();
