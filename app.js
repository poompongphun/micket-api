const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

dotenv.config();

// connect to database
mongoose
  .connect(process.env.DB_CONNECT, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => console.log(error));

// Import Route
const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const walletRouter = require("./routes/wallet");

// Creator
const creatorJoinRouter = require("./routes/creator/join");
const creatorMovieGroupRouter = require("./routes/creator/movieGroup");
const creatorUploadRouter = require("./routes/creator/upload");
const movieSeasonRouter = require("./routes/creator/movieSeason");
const movieRouter = require("./routes/creator/movie");

// Store
const storeMovieRouter = require("./routes/store/movie");

app.use("/", indexRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/creator/join", creatorJoinRouter);

// Creator
app.use("/api/creator/movie-group", creatorMovieGroupRouter);
app.use("/api/creator/upload", creatorUploadRouter);
app.use("/api/creator/season", movieSeasonRouter);
app.use("/api/creator/movie", movieRouter);

//Store
app.use("/api/store/movie", storeMovieRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
