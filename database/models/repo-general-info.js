const mongoose = require("../index");

const repoGeneralInfoSchema = new mongoose.Schema({
  language: String,
  stargazers_count: Number,
  forks_count: Number,
  size: Number,
  full_name: String,
  open_issues_count: Number,
  ownerType: String,
});

const repoGeneralInfo = mongoose.model(
  "repoGeneralInfo",
  repoGeneralInfoSchema
);

module.exports = repoGeneralInfo;
