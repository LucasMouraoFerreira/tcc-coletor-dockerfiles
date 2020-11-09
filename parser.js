"use strict";

const fs = require("fs");
const dockerfileParser = require("docker-file-parser");

const parseOptions = { includeComments: true };

function getSizeInformation(fileContent) {
  const sizeInBytes = Buffer.byteLength(fileContent, "utf8");

  const totalNumberOfLines =
    (fileContent.match(/\n|\r\n|\r/gm) || "").length + 1;

  const numberOfCommentLines = (fileContent.match(/^\s*#+/gm) || "").length;

  const numberOfBlankLines =
    (fileContent.match(/^\s*[\n\r]/gm) || "").length + 1;

  return {
    sizeInBytes,
    totalNumberOfLines,
    numberOfCommentLines,
    numberOfBlankLines,
  };
}

function parseDockerfile(fileContent) {
  return dockerfileParser.parse(fileContent, parseOptions);
}

function test() {
  const fileContent = fs.readFileSync(
    "/home/lucas/tcc/coleta-arquivos/Dockerfile",
    { encoding: "utf-8" }
  );

  console.log(getSizeInformation(fileContent));
  //console.log(parseDockerfile(fileContent));
}

test();
