"use strict";

const dockerfileParser = require("docker-file-parser");

const parseOptions = { includeComments: true };

function getSizeInformation(dockerfile) {
  const sizeInBytes = Buffer.byteLength(dockerfile, "utf8");

  const totalNumberOfLines =
    (dockerfile.match(/\n|\r\n|\r/gm) || "").length + 1;

  const numberOfCommentLines = (dockerfile.match(/^\s*#+/gm) || "").length;

  const numberOfBlankLines =
    (dockerfile.match(/^\s*[\n\r]/gm) || "").length + 1;

  return {
    sizeInBytes,
    totalNumberOfLines,
    numberOfCommentLines,
    numberOfBlankLines,
  };
}

exports.parseDockerfile = function parseDockerfile(dockerfile) {
  const sizeInfo = getSizeInformation(dockerfile.dockerfile);
  return {
    ...sizeInfo,
    dockerfile: dockerfileParser.parse(dockerfile.dockerfile, parseOptions),
    year: dockerfile.year,
    month: dockerfile.month,
    last: dockerfile.last,
    date: dockerfile.date,
  };
};

// informações para retirar do repositorio
// fork? define se repositorio é um fork, language, stargazers_count, forks_count, size, full_name, owner.type ['User','Organization']
// https://api.github.com/repos/LucasMouraoFerreira/Aircnc
// https://api.github.com/repos/full_name

// Retirar informação de cada commit:
// -> navegar pelos commits que envolveram o dockerfile
// -> pegar um commit para cada ano
// -> navegar pela tree do commit
// -> buscar pelo blob que representa o dockerfile
// -> retirar informações do dockerfile

// banco de dados com 2 collections, dockerfileInformation, repoInformation, relação de um para muitos
