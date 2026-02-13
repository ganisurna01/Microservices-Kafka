module.exports = async (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ errors: [{ message: "Unauthorized" }] });
  } else {
    next();
  }
};
