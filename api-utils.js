const axios = require("axios");
const { decode } = require("64");

async function getRepoInfo(repositoryFullName) {
  await axios
    .get(`https://raw.githubusercontent.com/repos/${repositoryFullName}`)
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
        .then(async () => {})
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

async function getDockerfilesInfo(repositoryFullName) {
  await axios
    .get(
      `https://api.github.com/repos/${repositoryFullName}/commits?path=Dockerfile&per_page=100&page=1`
    )
    .then(async (response) => {
      console.log(response.data);
    })
    .catch(() => {
      console.log(`Erro ao ler commits do Dockerfile - ${repositoryFullName}`);
    });
}

//getDockerfilesInfo();

//commit.author.date
//commit.tree.url -> chama api
//response.data.tree[] -> blobDockerfile = find((commit) => commit.path === 'Dockerfile')
//blob.url -> chama api
//response.data.content-> decode content

function decodeDockerfile(content) {
  const input = Buffer.from(content);

  return decode(input).toString();
}
