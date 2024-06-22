import express from "express";
import cors from "cors";
import morgan from "morgan";
import Router from "./routes/index.js";
const app = express();
const PORT = process.env.PORT || 5001;

//add middleware
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  return res.json({ message: "Good Work" });
});

app.use(Router);

app.listen(PORT, () => {
  console.log(
    `Timezones by location application is running on port http://localhost:${PORT}.`
  );
});
