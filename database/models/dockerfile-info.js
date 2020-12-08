const { isValidObjectId } = require("mongoose");
const mongoose = require("../index");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const dockerfileInfoSchema = new Schema({
  sizeInBytes: Number,
  totalNumberOfLines: Number,
  numberOfCommentLines: Number,
  numberOfBlankLines: Number,
  repoInfo: ObjectId,
  dockerfile: Array,
  year: String,
  month: String,
  last: Boolean,
  date: Date,
});

const dockerfileInfo = mongoose.model("dockerfileInfo", dockerfileInfoSchema);

module.exports = dockerfileInfo;
