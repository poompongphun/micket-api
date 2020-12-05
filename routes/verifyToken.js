const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const splitToken = req.header("authorization").split(" ");
  const token = splitToken[1];
  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).send("Invalid Token");
  }
};
