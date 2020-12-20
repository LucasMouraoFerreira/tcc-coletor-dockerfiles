"use strict";
const { plotlyApiKey, plotlyUsername } = require("./token.json");
const plotly = require("plotly")(plotlyUsername, plotlyApiKey);

const y0 = [];
const y1 = [];

for (let i = 0; i < 50; i++) {
  y0[i] = Math.random();
  y1[i] = Math.random() + 1;
}
const trace1 = {
  y: y0,
  type: "box",
  name: "box 1",
};

const trace2 = {
  y: y1,
  type: "box",
  name: "box 2",
};

const layout = {
  showlegend: true,
  legend: {
    x: 1,
    y: 1,
  },
  yaxis: {
    title: "y Axis",
    titlefont: {
      family: "Courier New, monospace",
      size: 18,
      color: "#7f7f7f",
    },
  },
};

const data = [trace1, trace2];

const graphOptions = {
  layout,
  filename: "basic-box-plot",
  fileopt: "overwrite",
};

plotly.plot(data, graphOptions, function (err, msg) {
  console.log(msg);
});
