const axios = require("axios");
const { decode } = require("64");
const { parseDockerfile } = require('./parser');
const { token } = require('./token.json');
const repoGeneralInfo = require('./database/models/repo-general-info');
const dockerfileInfo = require('./database/models/dockerfile-info');

exports.options = options;

const options = {
  headers: { Authorization: `Token ${token}` }
};

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
    .get(`https://raw.githubusercontent.com/repos/${repositoryFullName}`,
    options
    )
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
        owner: { type: ownerType },
      } = response;

      await axios
        .get(
          `https://raw.githubusercontent.com/${repositoryFullName}/master/Dockerfile`
        )
        .then(async () => {
          const dockerfiles = await getDockerfiles(repositoryFullName);
          await save({ 
            language,
            stargazers_count,
            forks_count,
            size,
            full_name,
            open_issues_count,
            ownerType
          },
            dockerfiles);
        })
        .catch(() => {
          console.log(
            `repositorio ${repositoryFullName} não possui Dockerfile`
          );
        });
    })
    .catch((err) => {
      console.log(err.message);
      return;
    });
}

async function getDockerfiles(repositoryFullName) {
  await axios
    .get(
      `https://api.github.com/repos/${repositoryFullName}/commits?path=Dockerfile&per_page=100&page=1`,
      options
    )
    .then(async (response) => {
      const commits = [...response.data];
      if (commits.length === 100) {
        let pendingCommits = true;
        let page = 2;
        while (pendingCommits) {
          await axios
            .get(
              `https://api.github.com/repos/${repositoryFullName}/commits?path=Dockerfile&per_page=100&page=${page}`,
              options
            )
            .then((res) => {
              commits.concat(res.data);
              if (res.data.length < 100) {
                pendingCommits = false;
              }
              page += 1;
            });
        }
      }
      return getDockerfilesInfo(commits);
    })
    .catch(() => {
      console.log(`Erro ao ler commits do Dockerfile - ${repositoryFullName}`);
    });
}

async function getDockerfilesInfo(commmits) {
  const commitsToAnalyze = [];
  validYears.forEach((year) => {
    const commit = commmits.find(
      (com) => com.commit.author.date.split("-")[0] === year
    );
    if (commit) {
      commitsToAnalyze.push(commit);
    }
  });
  commitsToAnalyze.map((com) => ({
    year: com.commit.author.date.split("-")[0],
    tree: com.commit.tree.url,
  }));

  return parseDockerfilesInfo(commitsToAnalyze);
}

async function parseDockerfilesInfo(commitsToAnalyze){
  const dockerfiles = [];
  commitsToAnalyze.forEach((commit) => {
    await axios.get(commit.tree, options).then((response) => {
      const blobDockerfile = response.data.tree.find((blob) => blob.path === 'Dockerfile');
      if(blobDockerfile){
        await axios.get(blobDockerfile.url, options).then((res) => {
          dockerfiles.push({year: commit.year, dockerfile: decodeDockerfile(res.data.content)});
        });
      }
    });
  });
  return dockerfiles.map((dockerfile) => parseDockerfile(dockerfile));
}

function decodeDockerfile(content) {
  const input = Buffer.from(content);

  return decode(input).toString();
}

//commit.author.date
//commit.tree.url -> chama api
//response.data.tree[] -> blobDockerfile = find((commit) => commit.path === 'Dockerfile')
//blob.url -> chama api
//response.data.content-> decode content

async function save(repoInfo, dockerfiles){
  const generalInfo = await repoGeneralInfo.create(repoInfo);
  dockerfiles.forEach((dockerfile) => {
    await dockerfileInfo.create({repoInfo: generalInfo._id, ...dockerfile});
  });  
}
