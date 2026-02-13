const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  // console.log("Current User middleware");
  const accessToken = req.cookies.accessToken;
  console.log(accessToken, req.cookies);
  if (!accessToken) {
    console.log("No accessToken is available");
    req.currentUser = null;
    return next();
  }
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_KEY);
    req.currentUser = {id: decodedToken.userId, email: decodedToken.email} || null;
  } catch (error) {
    console.error("Error verifying JWT", error);
    req.currentUser = null;
  }
  next();
};
