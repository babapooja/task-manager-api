// This file will handle connection logic to mongodb database
const mongoose = require("mongoose");

// var DB = 'mongodb://localhost:27017/TaskManager0;'
var DB =
  "mongodb://task-manager-db:T63akiE3YJ7kKxQamPXC2YpclmQY01TugqK7QZV6pZrhkZMIBfPdC757dcR0jKOQZUDi8kzGZicCACDbQzHvmg%3D%3D@task-manager-db.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@task-manager-db@/TaskManager";
mongoose.Promise = global.Promise;
mongoose
  .connect(DB, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
  })
  .catch((e) => {
    console.log("Error while connecting to the database..");
    console.log(e);
  });

module.exports = { mongoose };
