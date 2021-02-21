"use strict";

const repoGeneralInfo = require("./database/models/repo-general-info");
const dockerfileInfo = require("./database/models/dockerfile-info");
const { lintDockerfile } = require("dockerfilelint/bin/linter");
const { reverseParse } = require("./parser");
const { plotlyApiKey, plotlyUsername } = require("./token.json");
const plotly = require("plotly")(plotlyUsername, plotlyApiKey);

async function getDockerfilesStateByYear() {
  const repoInfoIds = await repoGeneralInfo.find({}, "_id").exec();

  const dockerfiles2015 = [];
  const dockerfiles2016 = [];
  const dockerfiles2017 = [];
  const dockerfiles2018 = [];
  const dockerfiles2019 = [];
  const dockerfiles2020 = [];

  for (const repoInfo of repoInfoIds) {
    const allRepoDockerfiles = await dockerfileInfo
      .find({ repoInfo: repoInfo._id })
      .exec();

    const allRepoDockerfilesPaths = [
      ...new Set(allRepoDockerfiles.map((x) => x.path)),
    ];

    for (const dockerFilePath of allRepoDockerfilesPaths) {
      const dockerfile2015 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2015] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2015[0]) {
        dockerfiles2015.push(dockerfile2015[0]);
      }

      const dockerfile2016 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2016] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2016[0]) {
        dockerfiles2016.push(dockerfile2016[0]);
      }

      const dockerfile2017 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2017] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2017[0]) {
        dockerfiles2017.push(dockerfile2017[0]);
      }

      const dockerfile2018 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2018] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2018[0]) {
        dockerfiles2018.push(dockerfile2018[0]);
      }

      const dockerfile2019 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2019] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2019[0]) {
        dockerfiles2019.push(dockerfile2019[0]);
      }

      const dockerfile2020 = await dockerfileInfo
        .find({
          path: dockerFilePath,
          $expr: { $lte: [{ $toDouble: "$year" }, 2020] },
          repoInfo: repoInfo._id,
        })
        .sort({ year: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .exec();

      if (dockerfile2020[0]) {
        dockerfiles2020.push(dockerfile2020[0]);
      }
    }
  }

  return {
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  };
}

async function plotDockerfileSizeCommandsByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
}) {
  const dockerfilesSize2015 = dockerfiles2015.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );
  const dockerfilesSize2016 = dockerfiles2016.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );
  const dockerfilesSize2017 = dockerfiles2017.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );
  const dockerfilesSize2018 = dockerfiles2018.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );
  const dockerfilesSize2019 = dockerfiles2019.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );
  const dockerfilesSize2020 = dockerfiles2020.map(
    (d) => d.dockerfile.filter((com) => com.name !== "COMMENT").length
  );

  const trace2015 = {
    y: dockerfilesSize2015,
    type: "box",
    name: "2015",
  };

  const trace2016 = {
    y: dockerfilesSize2016,
    type: "box",
    name: "2016",
  };

  const trace2017 = {
    y: dockerfilesSize2017,
    type: "box",
    name: "2017",
  };

  const trace2018 = {
    y: dockerfilesSize2018,
    type: "box",
    name: "2018",
  };

  const trace2019 = {
    y: dockerfilesSize2019,
    type: "box",
    name: "2019",
  };

  const trace2020 = {
    y: dockerfilesSize2020,
    type: "box",
    name: "2020",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: "Tamanho (Número de comandos)",
    },
  };

  const data = [
    trace2015,
    trace2016,
    trace2017,
    trace2018,
    trace2019,
    trace2020,
  ];

  const graphOptions = {
    layout,
    filename: "box-plot-dockerfile-number-commands-by-year",
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

async function plotDockerfileSizeBytesByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
}) {
  const dockerfilesSize2015 = dockerfiles2015.map((d) => d.sizeInBytes);
  const dockerfilesSize2016 = dockerfiles2016.map((d) => d.sizeInBytes);
  const dockerfilesSize2017 = dockerfiles2017.map((d) => d.sizeInBytes);
  const dockerfilesSize2018 = dockerfiles2018.map((d) => d.sizeInBytes);
  const dockerfilesSize2019 = dockerfiles2019.map((d) => d.sizeInBytes);
  const dockerfilesSize2020 = dockerfiles2020.map((d) => d.sizeInBytes);

  const trace2015 = {
    y: dockerfilesSize2015,
    type: "box",
    name: "2015",
  };

  const trace2016 = {
    y: dockerfilesSize2016,
    type: "box",
    name: "2016",
  };

  const trace2017 = {
    y: dockerfilesSize2017,
    type: "box",
    name: "2017",
  };

  const trace2018 = {
    y: dockerfilesSize2018,
    type: "box",
    name: "2018",
  };

  const trace2019 = {
    y: dockerfilesSize2019,
    type: "box",
    name: "2019",
  };

  const trace2020 = {
    y: dockerfilesSize2020,
    type: "box",
    name: "2020",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: "Tamanho (Bytes)",
    },
  };

  const data = [
    trace2015,
    trace2016,
    trace2017,
    trace2018,
    trace2019,
    trace2020,
  ];

  const graphOptions = {
    layout,
    filename: "box-plot-dockerfile-size-by-year",
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

function averageCommandNumber(dockerfiles) {
  let dockerfilesNumberOfCommands = 0;
  for (const { dockerfile } of dockerfiles) {
    numberOfCommands = dockerfile.filter(
      (command) => command.name !== "COMMENT"
    ).length;

    dockerfilesNumberOfCommands += numberOfCommands;
  }

  return dockerfilesNumberOfCommands / dockerfiles.length;
}

async function plotDockerfileNumberOfCommandsByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
}) {
  const m2015 = averageCommandNumber(dockerfiles2015);
  const m2016 = averageCommandNumber(dockerfiles2016);
  const m2017 = averageCommandNumber(dockerfiles2017);
  const m2018 = averageCommandNumber(dockerfiles2018);
  const m2019 = averageCommandNumber(dockerfiles2019);
  const m2020 = averageCommandNumber(dockerfiles2020);

  const trace = {
    y: [m2015, m2016, m2017, m2018, m2019, m2020],
    x: ["2015", "2016", "2017", "2018", "2019", "2020"],
    type: "scatter",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: "Número médio de comandos por Dockerfile",
    },
  };

  const data = [trace];

  const graphOptions = {
    layout,
    filename: "scatter-media-comandos-dockerfile",
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

function averageCommand(dockerfiles, command) {
  let dockerfilesNumberOfCommands = 0;
  for (const { dockerfile } of dockerfiles) {
    numberOfCommands = dockerfile.filter((com) => com.name === command).length;

    dockerfilesNumberOfCommands += numberOfCommands;
  }

  return dockerfilesNumberOfCommands / dockerfiles.length;
}

async function plotDockerfileCommandsByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
  command,
}) {
  const m2015 = averageCommand(dockerfiles2015, command);
  const m2016 = averageCommand(dockerfiles2016, command);
  const m2017 = averageCommand(dockerfiles2017, command);
  const m2018 = averageCommand(dockerfiles2018, command);
  const m2019 = averageCommand(dockerfiles2019, command);
  const m2020 = averageCommand(dockerfiles2020, command);

  const trace = {
    y: [m2015, m2016, m2017, m2018, m2019, m2020],
    x: ["2015", "2016", "2017", "2018", "2019", "2020"],
    type: "scatter",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: `Número médio de comandos "${command}" por Dockerfile`,
    },
  };

  const data = [trace];

  const graphOptions = {
    layout,
    filename: `scatter-media-comando-${command}-dockerfile`,
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

function averageComplexCommand(dockerfiles) {
  let dockerfilesNumberOfComplexCommands = 0;
  for (const { dockerfile } of dockerfiles) {
    numberOfCommands = dockerfile.filter(
      (com) =>
        com.name !== "COMMENT" &&
        com.raw &&
        com.raw.split(/(\s+)/).filter((e) => e.trim().length > 0).length > 10
    ).length;

    dockerfilesNumberOfComplexCommands += numberOfCommands;
  }

  return dockerfilesNumberOfComplexCommands / dockerfiles.length;
}

async function plotDockerfileAverageNumberOfComplexCommandsByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
}) {
  const m2015 = averageComplexCommand(dockerfiles2015);
  const m2016 = averageComplexCommand(dockerfiles2016);
  const m2017 = averageComplexCommand(dockerfiles2017);
  const m2018 = averageComplexCommand(dockerfiles2018);
  const m2019 = averageComplexCommand(dockerfiles2019);
  const m2020 = averageComplexCommand(dockerfiles2020);

  const trace = {
    y: [m2015, m2016, m2017, m2018, m2019, m2020],
    x: ["2015", "2016", "2017", "2018", "2019", "2020"],
    type: "scatter",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: "Número médio de comandos complexos por Dockerfile",
    },
  };

  const data = [trace];

  const graphOptions = {
    layout,
    filename: "scatter-media-comando-complexos-dockerfile",
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

function averageSpeficImage(dockerfiles, imageName) {
  let dockerfilesNumberOfImage = 0;
  for (const { dockerfile } of dockerfiles) {
    numberOfCommands = dockerfile.filter(
      (com) => com.name === "FROM" && com.raw.includes(imageName)
    ).length;

    dockerfilesNumberOfImage += numberOfCommands;
  }

  return dockerfilesNumberOfImage / dockerfiles.length;
}

async function plotDockerfileAverageNumberOfSpeficImageByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
  imageName,
}) {
  const m2015 = averageSpeficImage(dockerfiles2015, imageName);
  const m2016 = averageSpeficImage(dockerfiles2016, imageName);
  const m2017 = averageSpeficImage(dockerfiles2017, imageName);
  const m2018 = averageSpeficImage(dockerfiles2018, imageName);
  const m2019 = averageSpeficImage(dockerfiles2019, imageName);
  const m2020 = averageSpeficImage(dockerfiles2020, imageName);

  const trace = {
    y: [m2015, m2016, m2017, m2018, m2019, m2020],
    x: ["2015", "2016", "2017", "2018", "2019", "2020"],
    type: "scatter",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: `Número médio de utilizações da imagem ${imageName}`,
    },
  };

  const data = [trace];

  const graphOptions = {
    layout,
    filename: `scatter-media-imagem-${imageName}-dockerfile`,
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

function averageErrosImage(year, dockerfiles) {
  let numberOfWrongDockerfiles = 0;
  const errorMap = new Map();
  for (const { dockerfile } of dockerfiles) {
    const reverseDockerfile = reverseParse(dockerfile);

    const lintResult = lintDockerfile(reverseDockerfile);

    const tempMap = new Map();
    lintResult.issues.forEach((element) => {
      if (element.title === "Deprecated as of Docker 1.13") {
        return;
      }
      if (
        errorMap.get(`${element.title}---${element.category}`) &&
        !tempMap.get(`${element.title}---${element.category}`)
      ) {
        const prevNumber = errorMap.get(
          `${element.title}---${element.category}`
        );
        errorMap.set(`${element.title}---${element.category}`, prevNumber + 1);
        tempMap.set(`${element.title}---${element.category}`, 1);
      } else if (
        !errorMap.get(`${element.title}---${element.category}`) &&
        !tempMap.get(`${element.title}---${element.category}`)
      ) {
        console.log(element.title, " -- ", element.content);
        errorMap.set(`${element.title}---${element.category}`, 1);
        tempMap.set(`${element.title}---${element.category}`, 1);
      }
    });

    if (
      lintResult.issues_count >= 1 &&
      lintResult.issues.some(
        (elem) => elem.title !== "Deprecated as of Docker 1.13"
      )
    ) {
      numberOfWrongDockerfiles += 1;
    }
  }

  console.log(`Ano: ${year}`);
  console.log(`Número de dockerfiles: ${dockerfiles.length}`);
  console.log(`Numero de dockerfiles com erros: ${numberOfWrongDockerfiles}`);
  console.log("Presença de cada erro:");
  errorMap.forEach((value, key) => console.log(`${key}: ${value}`));

  return numberOfWrongDockerfiles / dockerfiles.length;
}

async function plotDockerfileAverageNumberOfErrosByYear({
  dockerfiles2015,
  dockerfiles2016,
  dockerfiles2017,
  dockerfiles2018,
  dockerfiles2019,
  dockerfiles2020,
}) {
  const m2015 = averageErrosImage("2015", dockerfiles2015) * 100;
  const m2016 = averageErrosImage("2016", dockerfiles2016) * 100;
  const m2017 = averageErrosImage("2017", dockerfiles2017) * 100;
  const m2018 = averageErrosImage("2018", dockerfiles2018) * 100;
  const m2019 = averageErrosImage("2019", dockerfiles2019) * 100;
  const m2020 = averageErrosImage("2020", dockerfiles2020) * 100;

  const trace = {
    y: [m2015, m2016, m2017, m2018, m2019, m2020],
    x: ["2015", "2016", "2017", "2018", "2019", "2020"],
    type: "scatter",
  };

  const layout = {
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
    },
    yaxis: {
      title: `Porcentagem do Dockerfiles com algum problema acusado pelo linter por ano`,
    },
  };

  const data = [trace];

  const graphOptions = {
    layout,
    filename: `scatter-media-erros-dockerfile`,
    fileopt: "overwrite",
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

const validCommands = [
  "FROM",
  "COPY",
  "RUN",
  "WORKDIR",
  "EXPOSE",
  "ENV",
  "HEALTHCHECK",
  "ENTRYPOINT",
  "CMD",
  "ADD",
  "VOLUME",
  "ARG",
  "USER",
];

const validImages = ["alpine", "gcr.io/distroless"];

async function plot() {
  const {
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  } = await getDockerfilesStateByYear();

  await plotDockerfileSizeBytesByYear({
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  });

  await plotDockerfileSizeCommandsByYear({
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  });

  await plotDockerfileNumberOfCommandsByYear({
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  });

  for (const command of validCommands) {
    await plotDockerfileCommandsByYear({
      dockerfiles2015,
      dockerfiles2016,
      dockerfiles2017,
      dockerfiles2018,
      dockerfiles2019,
      dockerfiles2020,
      command,
    });
  }

  await plotDockerfileAverageNumberOfComplexCommandsByYear({
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  });

  for (const imageName of validImages) {
    await plotDockerfileAverageNumberOfSpeficImageByYear({
      dockerfiles2015,
      dockerfiles2016,
      dockerfiles2017,
      dockerfiles2018,
      dockerfiles2019,
      dockerfiles2020,
      imageName,
    });
  }

  await plotDockerfileAverageNumberOfErrosByYear({
    dockerfiles2015,
    dockerfiles2016,
    dockerfiles2017,
    dockerfiles2018,
    dockerfiles2019,
    dockerfiles2020,
  });
}

plot();
