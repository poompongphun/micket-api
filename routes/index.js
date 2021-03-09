const express = require("express");
const router = express.Router();
const verify = require("../Middleware/verifyToken");
const posters = require("../model/poster");

/* GET home page. */
router.get("/", verify, (req, res, next) => {
  res.render("index", { title: "Express" });
});

router.get("/api/poster", async (req, res, next) => {
  try {
    const poster = await posters.find();
    res.json(poster);
  } catch (error) {
    res.status(400).send(error);
  }
});

// router.post("/api/poster", async (req, res, next) => {
//   try {
//     // const poster = await posters;
//     // res.json(poster);
//     const user = new posters({
//       images:
//         "https://lh3.googleusercontent.com/proxy/iS43auwO9mtTmsLeelgwKT4nH-I3rKy2PQwTkEOs0rz6Sli1kU9A7rFC-_9TjBnB-BObkEKMZuL_RRybCPzYZvvrGPPgOYqz8wakqmJWbzt9",
//       text:
//         "Micket is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
//     });
//     const createUser = await user.save();
//     res.json(createUser);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

module.exports = router;
