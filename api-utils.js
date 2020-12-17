const axios = require("axios");
const { parseDockerfile } = require("./parser");
const { token } = require("./token.json");
const repoGeneralInfo = require("./database/models/repo-general-info");
const dockerfileInfo = require("./database/models/dockerfile-info");

const options = {
  headers: { Authorization: `Token ${token}` },
};

exports.options = options;

const validYears = [
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
];

const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

exports.getRepoInfo = async function getRepoInfo(repositoryFullName) {
  await axios
    .get(`https://api.github.com/repos/${repositoryFullName}`, options)
    .then(async (response) => {
      if (response.data.fork === true || response.data.stargazers_count < 50) {
        return;
      }

      const {
        language,
        stargazers_count,
        forks_count,
        size,
        full_name,
        open_issues_count,
        created_at,
        updated_at,
        owner: { type: owner_type },
      } = response.data;

      await axios
        .get(
          `https://api.github.com/search/code?q=FROM+repo:${repositoryFullName}+filename:Dockerfile`
        )
        .then(async (response) => {
          const path = getDockerfilePath(response.data.items);
          if (!path) {
            return;
          }
          const dockerfiles = await getDockerfiles(repositoryFullName, path);
          await save(
            {
              language,
              stargazers_count,
              forks_count,
              size,
              full_name,
              open_issues_count,
              owner_type,
              created_at,
              updated_at,
            },
            dockerfiles
          );
        })
        .catch(() => {
          console.log(
            `repositorio ${repositoryFullName} não possui Dockerfile`
          );
          return;
        });
    })
    .catch((err) => {
      console.log(err);
      return;
    });

  return;
};

async function getDockerfiles(repositoryFullName, path) {
  let commits;
  await axios
    .get(
      `https://api.github.com/repos/${repositoryFullName}/commits?path=${path}&per_page=100&page=1`,
      options
    )
    .then(async (response) => {
      commits = response.data;
      if (commits.length === 100) {
        let pendingCommits = true;
        let page = 2;
        while (pendingCommits) {
          console.log(`page: ${page}`);
          await axios
            .get(
              `https://api.github.com/repos/${repositoryFullName}/commits?path=${path}&per_page=100&page=${page}`,
              options
            )
            .then((res) => {
              commits = commits.concat(res.data);
              if (res.data.length < 100) {
                pendingCommits = false;
              }
              page += 1;
            })
            .catch(() => {
              console.log(
                `Erro ao ler commits do Dockerfile - ${repositoryFullName}`
              );
              return;
            });
        }
      }
    })
    .catch(() => {
      console.log(`Erro ao ler commits do Dockerfile - ${repositoryFullName}`);
      return;
    });

  return getDockerfilesInfo(commits, path);
}

async function getDockerfilesInfo(commits, path) {
  const commitsToAnalyze = [];
  let lastYear;
  let lastMonth;
  validYears.forEach((year) => {
    months.forEach((month) => {
      const commit = commits.find(
        (com) =>
          com.commit.author.date.split("-")[0] === year &&
          com.commit.author.date.split("-")[1] === month
      );
      if (commit) {
        commitsToAnalyze.push(commit);
        lastMonth = commit.commit.author.date.split("-")[1];
        lastYear = commit.commit.author.date.split("-")[0];
        console.log(lastYear);
      }
    });
  });

  const commitsToReturn = commitsToAnalyze.map((com) => ({
    year: com.commit.author.date.split("-")[0],
    month: com.commit.author.date.split("-")[1],
    date: com.commit.author.date,
    tree: com.commit.tree.url,
    last:
      com.commit.author.date.split("-")[0] === lastYear &&
      com.commit.author.date.split("-")[1] === lastMonth,
  }));

  return parseDockerfilesInfo(commitsToReturn, path);
}

async function parseDockerfilesInfo(commitsToAnalyze, path) {
  const dockerfiles = [];
  const pathNormalize =
    path.startsWith("/") && path.split("/").length === 2
      ? path.slice(1)
      : path.split("/");

  console.log(pathNormalize);
  for (const commit of commitsToAnalyze) {
    await axios
      .get(commit.tree, options)
      .then(async (response) => {
        if (!Array.isArray(pathNormalize)) {
          const blobDockerfile = response.data.tree.find(
            (blob) => blob.path === pathNormalize
          );
          if (blobDockerfile && blobDockerfile.type === "blob") {
            console.log(blobDockerfile);
            await axios
              .get(blobDockerfile.url, options)
              .then((res) => {
                dockerfiles.push({
                  year: commit.year,
                  month: commit.month,
                  last: commit.last,
                  date: commit.date,
                  path,
                  dockerfile: decodeDockerfile(res.data.content),
                });
              })
              .catch(() => {
                console.log(`Erro ao ler blob do Dockerfile`);
                return;
              });
          }
        } else {
          let nextTree = response.data.tree;
          for (const name of pathNormalize) {
            const blobDockerfile = nextTree.find((blob) => blob.path === name);
            if (blobDockerfile && blobDockerfile.type === "tree") {
              await axios
                .get(blobDockerfile.url, options)
                .then((res) => {
                  nextTree = res.data.tree;
                })
                .catch(() => {
                  console.log(`Erro ao ler tree do Dockerfile`);
                  return;
                });
            } else if (blobDockerfile && blobDockerfile.type === "blob") {
              console.log(blobDockerfile);
              await axios
                .get(blobDockerfile.url, options)
                .then((res) => {
                  dockerfiles.push({
                    year: commit.year,
                    month: commit.month,
                    last: commit.last,
                    date: commit.date,
                    path,
                    dockerfile: decodeDockerfile(res.data.content),
                  });
                })
                .catch(() => {
                  console.log(`Erro ao ler blob do Dockerfile`);
                  return;
                });
            }
          }
        }
      })
      .catch(() => {
        console.log(`Erro ao ler tree do Dockerfile`);
        return;
      });
  }

  return dockerfiles.map((dockerfile) => parseDockerfile(dockerfile));
}

function decodeDockerfile(content) {
  const input = Buffer.from(content, "base64");

  return input.toString("utf-8");
}

async function save(repoInfo, dockerfiles) {
  console.log(dockerfiles.length);
  console.log(repoInfo.full_name);
  const generalInfo = await repoGeneralInfo.create(repoInfo);
  for (const dockerfile of dockerfiles) {
    await dockerfileInfo.create({ repoInfo: generalInfo._id, ...dockerfile });
  }
}

function getDockerfilePath(items) {
  //Não possui Dockerfile
  if (items.length === 0) {
    return undefined;
  }

  //Dockerfile na raiz do projeto com nome "Dockerfile"
  let dockerfilePath = items.find((x) => x.path === "/Dockerfile");

  if (dockerfilePath) {
    return dockerfilePath.path;
  }

  //Dockerfile na raiz do projeto mas com nome diferente
  dockerfilePath = items.find((x) => x.path.split("/").length === 2);

  if (dockerfilePath) {
    return dockerfilePath.path;
  }

  //Dockerfile em qualquer diretorio mas com nome "Dockerfile"
  dockerfilePath = items.find((x) => x.path.split("/").pop() === "Dockerfile");

  if (dockerfilePath) {
    return dockerfilePath.path;
  }

  //Qualque Dockerfile
  return items[0].path;
}
