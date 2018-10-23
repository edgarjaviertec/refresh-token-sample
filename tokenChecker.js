const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = (req, res, next) => {
    let accessToken;
    let hasMultiplePlaces = false;

    const QUERY_AUTHORIZACION_KEY = 'access_token';
    const BODY_AUTHORIZACION_KEY = 'access_token';
    const HEADER_AUTHORIZACION_KEY = 'Bearer';

    if (req.query && req.query[QUERY_AUTHORIZACION_KEY]) {
        accessToken = req.query[QUERY_AUTHORIZACION_KEY];
    }

    if (req.body && req.body[BODY_AUTHORIZACION_KEY]) {
        if (accessToken) {
            hasMultiplePlaces = true;
        }
        accessToken = req.body[BODY_AUTHORIZACION_KEY];
    }

    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === HEADER_AUTHORIZACION_KEY) {
            if (accessToken) {
                hasMultiplePlaces = true;
            }
            accessToken = parts[1];
        } else {
            return res.status(400).send({
                "statusCode": 400,
                "error": "Bad Request",
                "message": "Bad HTTP authentication header format",
            });
        }
    }

    if (hasMultiplePlaces) {
        return res.status(400).send({
            "statusCode": 400,
            "error": "Bad Request",
            "message": "RFC6750 states the access_token MUST NOT be provided in more than one place in a single request",
        });
    } else {
        if (accessToken) {
            jwt.verify(accessToken, config.secret, function (err, decoded) {
                if (err) {
                    console.log("el error es: " + err);
                    return res.status(401).json({
                        "statusCode": 401,
                        "error": "Unauthorized",
                        "message": err.message,
                    });
                }
                req.decoded = decoded;
                next();
            });
        } else {
            return res.status(401).send({
                "statusCode": 401,
                "error": "Unauthorized",
                "message": "No token provided",
            });
        }
    }

};