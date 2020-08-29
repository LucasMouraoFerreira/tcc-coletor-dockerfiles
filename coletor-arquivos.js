"use strict";

const axios = require("axios");
const fs = require("fs");
const { returnStartEndQueryDates } = require("./utils.js");

const perPage = 100;
let totalCount = 1;
let currentYear = 2013;
let currentMonth = 2;
let currentDay = 20;

async function coletaArquivos() {
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
      `https://api.github.com/search/repositories?page=1&per_page=1&q=topic:docker+created:${start}..${end}`
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
          `https://api.github.com/search/repositories?page=${index.toString()}&per_page=${perPage.toString()}&q=topic:docker+created:${start}..${end}`
        )
        .then(function (response) {
          const items = response.data.items;

          for (let i = 0; i < items.length; i += 1) {
            const repositoryFullName = items[i].full_name;

            axios
              .get(
                `https://raw.githubusercontent.com/${repositoryFullName}/master/Dockerfile`
              )
              .then(function (response) {
                const fileName = `${repositoryFullName.replace(
                  "/",
                  "_"
                )}_Dockerfile`;
                fs.writeFileSync(
                  `arquivos-coletados/${fileName}`,
                  response.data
                );
                console.log(
                  "\x1b[32m%s\x1b[0m",
                  `file write success: ${fileName}`
                );
              })
              .catch((err) =>
                console.log(
                  "\x1b[31m%s\x1b[0m",
                  `Dockerfile not found in repo: ${repositoryFullName}`
                )
              );
          }
        })
        .catch((err) => console.log(err.message));
    }
  }
}

async function main() {
  const objInterval = setInterval(async function () {
    console.log(
      "\x1b[34m%s\x1b[0m",
      `\nCurrent date: ${currentYear}-${currentMonth + 1}-${currentDay}\n`
    );

    await coletaArquivos();

    if (currentYear === 2020 && currentMonth === 7 && currentDay > 23) {
      clearInterval(objInterval);
    }
  }, 60000);
}

main();
