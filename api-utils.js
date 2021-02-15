const axios = require("axios");
const { parseDockerfile } = require("./parser");
const { token } = require("./token.json");
const repoGeneralInfo = require("./database/models/repo-general-info");
const dockerfileInfo = require("./database/models/dockerfile-info");
const Bottleneck = require("bottleneck");

const limiter = new Bottleneck({
  minTime: 1100,
});

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

exports.getRepoInfo = async function getRepoInfo(repository) {
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
  } = repository;

  const repositoryFullName = full_name;

  await axios
    .get(
      `https://api.github.com/search/code?q=FROM+repo:${repositoryFullName}+language:Dockerfile`
    )
    .then(async (response) => {
      const paths = getDockerfilePath(response.data.items);
      if (!paths) {
        return;
      }
      for(const path of paths){
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
      }      
    })
    .catch(() => {
      console.log(`repositorio ${repositoryFullName} não possui Dockerfile`);
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
          await limiter.schedule(() =>
            axios
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
              })
          );
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
  validYears.forEach((year) => {
    const commit = commits.find(
      (com) =>
        com.commit.author.date.split("-")[0] === year
    );
    if (commit) {
      commitsToAnalyze.push(commit);
      lastYear = commit.commit.author.date.split("-")[0];
    }
  });

  const commitsToReturn = commitsToAnalyze.map((com) => ({
    year: com.commit.author.date.split("-")[0],
    month: com.commit.author.date.split("-")[1],
    date: com.commit.author.date,
    tree: com.commit.tree.url,
    last: com.commit.author.date.split("-")[0] === lastYear,
  }));

  return parseDockerfilesInfo(commitsToReturn, path);
}

async function parseDockerfilesInfo(commitsToAnalyze, path) {
  const dockerfiles = [];
  const pathNormalize =
    path.startsWith("/") && path.split("/").length === 2
      ? path.slice(1)
      : path.split("/");

  for (const commit of commitsToAnalyze) {
    await limiter.schedule(() =>
      axios
        .get(commit.tree, options)
        .then(async (response) => {
          if (!Array.isArray(pathNormalize)) {
            const blobDockerfile = response.data.tree.find(
              (blob) => blob.path === pathNormalize
            );
            if (blobDockerfile && blobDockerfile.type === "blob") {
              await limiter.schedule(() =>
                axios
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
                  })
              );
            }
          } else {
            let nextTree = response.data.tree;
            for (const name of pathNormalize) {
              const blobDockerfile = nextTree.find(
                (blob) => blob.path === name
              );
              if (blobDockerfile && blobDockerfile.type === "tree") {
                await limiter.schedule(() =>
                  axios
                    .get(blobDockerfile.url, options)
                    .then((res) => {
                      nextTree = res.data.tree;
                    })
                    .catch(() => {
                      console.log(`Erro ao ler tree do Dockerfile`);
                      return;
                    })
                );
              } else if (blobDockerfile && blobDockerfile.type === "blob") {
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
        })
    );
  }

  return dockerfiles.map((dockerfile) => parseDockerfile(dockerfile));
}

function decodeDockerfile(content) {
  const input = Buffer.from(content, "base64");

  return input.toString("utf-8");
}

async function save(repoInfo, dockerfiles) {
  if (
    dockerfiles.length >= 1 &&
    dockerfiles.find((x) => x.dockerfile.length >= 1)
  ) {
    console.log(repoInfo.full_name, dockerfiles[0].path, dockerfiles.length);
    const generalInfo = await repoGeneralInfo.create(repoInfo);
    for (const dockerfile of dockerfiles) {
      if (dockerfile.dockerfile.length >= 1) {
        await dockerfileInfo.create({
          repoInfo: generalInfo._id,
          ...dockerfile,
        });
      }
    }
  }
}

function getDockerfilePath(items) {
  //Não possui Dockerfile
  if (items.length === 0) {
    return undefined;
  }

  return items.map((x) => x.path)
}
