const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const router = express.Router();
const config = require('./config');
const app = express();


//cofig de redis

var redis = require('redis');
var client = redis.createClient();

client.on('connect', function () {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});


//funciones para agregar, actualizar o remover los refres tokens de redis
function addRefreshTokenToList(refreshToken, username, email, accessToken, exp) {
    client.HMSET(refreshToken, {
        "username": username,
        "email": email,
        "accessToken": accessToken
    });

    client.expire(refreshToken, exp);
}

function updateRefreshTokenfromList(refreshToken, accessToken) {
    client.hset(refreshToken, "accessToken", accessToken, redis.print);
}

function removeRefreshTokenfromList(refreshToken) {
    client.del(refreshToken, redis.print);
}


router.get('/', (req, res) => {
    res.send('Ok');
});

router.post('/login', (req, res) => {
    const postData = req.body;
    const user = {
        "email": postData.email,
        "username": postData.username
    };
    // do the database authentication here, with user name and password combination.
    const token = jwt.sign(user, config.secret, {expiresIn: config.tokenLife});
    const refreshToken = jwt.sign(user, config.refreshTokenSecret, {expiresIn: config.refreshTokenLife});
    const response = {
        "access_token": token,
        "refresh_token": refreshToken,
        "token_type": "Bearer"
    };

    addRefreshTokenToList(refreshToken, user.username, user.email, token, config.refreshTokenLife);

    res.status(200).json(response);
});


//Si en nuestra aplicación el administrador pudiera deshabilitar usuarios o refresh tokens temporalmente,
// tendríamos que comprobarlo también antes de generar el nuevo access token.


// si el estatus del usuarios esta activo, entonces puede generar access tokens

router.post('/token', (req, res) => {
    // refresh the damn token
    const postData = req.body;
    const refreshToken = postData.refresh_token;

    if (refreshToken) {
        client.exists(refreshToken, function (err, exists) {
            if (exists) {
                console.log('res vale: ' + exists);
                const user = {
                    "email": postData.email,
                    "username": postData.username
                };
                const accessToken = jwt.sign(user, config.secret, {expiresIn: config.tokenLife});
                const response = {
                    "access_token": accessToken,
                    "expires_in": config.tokenLife,
                    "token_type": "Bearer"
                };
                //client.hset(postData.refreshToken, "accessToken", token, redis.print);
                updateRefreshTokenfromList(refreshToken, accessToken);
                res.status(200).json(response);
            } else {
                console.log('The Refresh Token does not exist');
                res.status(401).send({
                    "statusCode": 401,
                    "error": "Unauthorized",
                    "message": "The refresh token does not exist",
                });
            }
        });
    } else {
        res.status(401).send({
            "statusCode": 400,
            "error": "Bad Request",
            "message": "The required parameters were not sent in the request",
        });
    }

});


// En una implementación completa habría que comprobar que el usuario
// que hace la petición es administrador o tiene los permisos para este recurso.


router.post('/token/revoke', function (req, res) {
    const postData = req.body;
    if (postData.refreshToken) {
        client.exists(postData.refreshToken, function (err, exists) {
            if (exists) {
                console.log('res vale: ' + exists);
                removeRefreshTokenfromList(postData.refreshToken);
                res.sendStatus(204);
            } else {
                console.log('The refresh token does not exist');
                res.status(401).send({
                    "statusCode": 401,
                    "error": "Unauthorized",
                    "message": "The refresh token does not exist",
                });
            }
        });
    }
    else {
        res.status(401).send({
            "statusCode": 400,
            "error": "Bad Request",
            "message": "The required parameters were not sent in the request",
        });
    }
});


router.use(require('./tokenChecker'));

router.get('/secure', (req, res) => {
    // all secured routes goes here
    res.send('I am secured...')
});

app.use(bodyParser.json());
app.use('/api', router);
app.listen(config.port || process.env.port || 3000);
