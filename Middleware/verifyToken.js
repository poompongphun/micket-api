const jwt = require("jsonwebtoken");
const users = require("../model/users");

module.exports = async (req, res, next) => {
  try {
    const splitToken = req.header("authorization").split(" ");
    const token = splitToken[1];
    if (!token) return res.status(401).send("Access Denied");

    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    const response = await users.findById(req.user._id);
    if (response) next();
    else res.status(400).send("Invalid Token");
  } catch (error) {
    res.status(400).send("Invalid Token");
  }
};
