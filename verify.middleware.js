const jwt = require('jsonwebtoken');
const configTwilio = require('./configTwilio');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    res.removeHeader('Authorization');
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
        return res.status(401).json({message: 'Verify error'})
    }
    const decoded = jwt.verify(token, configTwilio.authToken);
    console.log(decoded);
    req.user = decoded;

    next();
}