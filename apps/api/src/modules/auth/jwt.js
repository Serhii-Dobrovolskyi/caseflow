const jwt = require("jsonwebtoken");

function signAccessToken(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function verifyAccessToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = { signAccessToken, verifyAccessToken };
