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

exports.getRepoInfo = async function getRepoInfo(repositoryFullName) {
  await axios
    .get(`https://api.github.com/repos/${repositoryFullName}`, options)
    .then(async (response) => {
      if (response.data.fork === true) {
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
        owner: { type: ownerType },
      } = response.data;

      await axios
        .get(
          `https://raw.githubusercontent.com/${repositoryFullName}/master/Dockerfile`
        )
        .then(async () => {
          const dockerfiles = await getDockerfiles(repositoryFullName);
          await save(
            {
              language,
              stargazers_count,
              forks_count,
              size,
              full_name,
              open_issues_count,
              ownerType,
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

async function getDockerfiles(repositoryFullName) {
  let commits;
  await axios
    .get(
      `https://api.github.com/repos/${repositoryFullName}/commits?path=Dockerfile&per_page=100&page=1`,
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
              `https://api.github.com/repos/${repositoryFullName}/commits?path=Dockerfile&per_page=100&page=${page}`,
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

  return getDockerfilesInfo(commits);
}

async function getDockerfilesInfo(commits) {
  const commitsToAnalyze = [];
  validYears.forEach((year) => {
    const commit = commits.find(
      (com) => com.commit.author.date.split("-")[0] === year
    );
    if (commit) {
      commitsToAnalyze.push(commit);
    }
  });
  const commitsToReturn = commitsToAnalyze.map((com) => ({
    year: com.commit.author.date.split("-")[0],
    tree: com.commit.tree.url,
  }));

  return parseDockerfilesInfo(commitsToReturn);
}

async function parseDockerfilesInfo(commitsToAnalyze) {
  const dockerfiles = [];
  for (const commit of commitsToAnalyze) {
    await axios
      .get(commit.tree, options)
      .then(async (response) => {
        const blobDockerfile = response.data.tree.find(
          (blob) => blob.path === "Dockerfile"
        );
        if (blobDockerfile) {
          await axios
            .get(blobDockerfile.url, options)
            .then((res) => {
              dockerfiles.push({
                year: commit.year,
                dockerfile: decodeDockerfile(res.data.content),
              });
            })
            .catch(() => {
              console.log(`Erro ao ler blob do Dockerfile`);
              return;
            });
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

//commit.author.date
//commit.tree.url -> chama api
//response.data.tree[] -> blobDockerfile = find((commit) => commit.path === 'Dockerfile')
//blob.url -> chama api
//response.data.content-> decode content

async function save(repoInfo, dockerfiles) {
  const generalInfo = await repoGeneralInfo.create(repoInfo);
  for (const dockerfile of dockerfiles) {
    await dockerfileInfo.create({ repoInfo: generalInfo._id, ...dockerfile });
  }
}
