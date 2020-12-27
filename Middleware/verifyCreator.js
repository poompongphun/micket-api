const users = require("../model/users");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const splitToken = req.header("authorization").split(" ");
    const token = splitToken[1];
    if (!token) return res.status(401).send("Access Denied");

    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    const responses = await users.findById(req.user._id);
    if (responses) {
      const response = await users
        .findById(req.user._id)
        .select({ creator: 1, _id: 0 });
      if (response.creator) {
        next();
      } else {
        res.status(401).send("Please upgrade to creator account");
      }
    } else res.status(400).send("Invalid Token");
  } catch (error) {
    res.status(400).send("Invalid Token");
  }
};
