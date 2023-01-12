const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { executeCpp } = require("./executeCpp");
require("dotenv").config();
const Job = require("./models/job");
mongoose.connect(
  process.env.MONGO_URI,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log("Mongo DB connected...");
  }
);
const app = express();
app.use(cors());
const { generateFile } = require("./generateFile");
const { executePy } = require("./executePy");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/status", async (req, res) => {
  const jobId = req.query.id;
  if (jobId === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "Missing Query params" });
  }
  // console.log(jobId);
  try {
    const job = await Job.findById(jobId);
    console.log(job);
    if (job === undefined) {
      return res.status(404).json({ success: false, error: "Invalid Job Id" });
    }
    return res.status(200).json({ job, success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, error: JSON.stringify(error) });
  }
});
app.post("/run", async (req, res) => {
  const { lng = "cpp", code } = req.body;
  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty Code Body" });
  }
  let job;
  try {
    const path = await generateFile(lng, code);
    job = await Job({ lng, filepath: path }).save();
    console.log(job)
    const jobId = job["_id"];
    res.status(201).json({ success: true, jobId });
    console.log(job);
    job["startedAt"] = new Date();
    let output;
    if (lng === "cpp") {
      output = await executeCpp(path);
    } else if (lng === "py") {
      output = await executePy(path);
    }
    job["completedAt"] = new Date();
    job["status"] = "success";
    job["output"] = output;
    await job.save();
    console.log(job);
    // return res.json({ path: path, output: output });
  } catch (error) {
    // job["completedAt"] = new Date();
    // job["status"] = "error";
    // job["output"] = JSON.stringify(error);
    // await job.save();
    console.log(error);
    return res.status(500).json({ Error: error });
  }
});

app.listen(5000, () => {
  console.log("Listening on port 5000...");
});
