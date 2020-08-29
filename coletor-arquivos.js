"use strict";

const axios = require("axios");
const fs = require("fs");
const { returnStartEndQueryDates } = require("./date.js");

const perPage = 100;
let page = 1;
let totalCount = 1;

async function coletaArquivos() {
  await axios
    .get(
      "https://api.github.com/search/repositories?page=1&per_page=1&q=topic:docker"
    )
    .then(function (response) {
      totalCount = response.data.total_count;
    });

  const totalPages = Math.ceil(totalCount / perPage);

  console.log(totalPages);

  for (let index = 12; index <= totalPages; index += 1) {
    console.log(`INDEX: ${index}`);
    await axios
      .get(
        `https://api.github.com/search/repositories?page=${index.toString()}&per_page=${perPage.toString()}&q=topic:docker`
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
              fs.writeFileSync(`arquivos-coletados/${fileName}`, response.data);
              console.log(`file write success: ${fileName}`);
            })
            .catch((err) =>
              console.log(`Dockerfile not found in repo: ${repositoryFullName}`)
            );
        }
      })
      .catch((err) => console.log(err));
  }
}

coletaArquivos();
