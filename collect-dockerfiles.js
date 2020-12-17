"use strict";

const axios = require("axios");
const { returnStartEndQueryDates } = require("./utils.js");
const { getRepoInfo, options } = require("./api-utils");

const perPage = 100;
let totalCount = 1;
let currentYear = 2013;
let currentMonth = 2;
let currentDay = 20;

async function collectDockerfiles() {
  const { nextDay, nextMonth, nextYear, start, end } = returnStartEndQueryDates(
    currentYear,
    currentMonth,
    currentDay
  );

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

  console.log("\x1b[34m%s\x1b[0m", `Total Pages: ${totalPages}\n`);

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
            const repositoryFullName = items[i].full_name;
            await getRepoInfo(repositoryFullName);
          }
        })
        .catch((err) => console.log(err.message));
    }
  }
}

async function collectLoop() {
  while (`${currentYear}-${currentMonth}` !== "2021-01") {
    await collectDockerfiles();
  }
}

collectLoop();
