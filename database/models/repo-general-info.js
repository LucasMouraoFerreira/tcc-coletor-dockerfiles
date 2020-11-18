const mongoose = require("../index");

const repoGeneralInfoSchema = new mongoose.Schema({
  language: String,
  stargazers_count: Number,
  forks_count: Number,
  size: Number,
  full_name: String,
  open_issues_count: Number,
  ownerType: String,
  created_at: String,
  updated_at: String,
});

const repoGeneralInfo = mongoose.model(
  "repoGeneralInfo",
  repoGeneralInfoSchema
);

module.exports = repoGeneralInfo;
