const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const router = express.Router();
const config = require('./config');
const app = express();


// Esta es la configuración de la base de datos de Redis

var redis = require('redis');
var client = redis.createClient();

client.on('connect', function () {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
    console.log('Revisa si tienes el servidor de Redis activado');
});

//funciones para agregar, actualizar o remover los refres tokens de redis
function addRefreshTokenToList(refreshToken, username, accessToken, exp) {
    client.HMSET(refreshToken, {
        "username": username,
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
    res.send('¡Hola extraño!, al parecer esto esta funcionando');
});


// Este endpoint devuelve el access token y el refresh token cuando le pasas un usuario y contraseña validos

router.post('/login', (req, res) => {
    const request = req.body;
    const fakeUser = {
        "username": "admin",
        "password": "password"
    };
    if (request.username === fakeUser.username && request.password === fakeUser.password) {
        const payLoad = {
            "username": request.username
        };
        // Aquí creamos el access token y el refresh token
        const accessToken = jwt.sign(payLoad, config.accessTokenSecret, {
            expiresIn: config.accessTokenLife
        });
        const refreshToken = jwt.sign(payLoad, config.refreshTokenSecret, {
            expiresIn: config.refreshTokenLife
        });
        const response = {
            "access_token": accessToken,
            "refresh_token": refreshToken,
            "token_type": "Bearer"
        };
        addRefreshTokenToList(refreshToken, request.username, accessToken, config.refreshTokenLife);
        res.status(200).json(response);
    } else {
        res.status(401).send({
            "statusCode": 401,
            "error": "Unauthorized",
            "message": "invalid credentials",
        });
    }
});

// Este endpoint devuelve un nuevo access token cuando le pasas un refresh token

router.post('/refresh', (req, res) => {
    // refresh the damn token
    const postData = req.body;
    const refreshToken = postData.refresh_token;

    if (refreshToken) {
        client.exists(refreshToken, function (err, exists) {
            if (exists) {
                let refreshTokenPayload;
                jwt.verify(refreshToken, config.refreshTokenSecret, function (err, decoded) {
                    if (err) {
                        console.log("el error es: " + err);
                        return res.status(401).json({
                            "statusCode": 401,
                            "error": "Unauthorized",
                            "message": err.message,
                        });
                    }
                    refreshTokenPayload = decoded;
                });
                const payload = {
                    "username": refreshTokenPayload.username
                };
                const accessToken = jwt.sign(payload, config.accessTokenSecret, {expiresIn: config.accessTokenLife});
                const response = {
                    "access_token": accessToken,
                    "expires_in": config.accessTokenLife,
                    "token_type": "Bearer"
                };
                updateRefreshTokenfromList(refreshToken, accessToken);
                res.status(200).json(response);
            } else {
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

// Este endpoint elimina un refresh token de la base de datos de Redis

router.post('/revoke', function (req, res) {
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

router.use(require('./token-validator'));

// En esta sección van los endpoints que quieres que estén protegidos con JWT

router.get('/secure', (req, res) => {
    res.send('Esta es una página protegida con JWT...')
});

app.use(bodyParser.json());
app.use('/api', router);
app.listen(config.port || process.env.port || 3000, function () {
    console.log('Escuchando el puerto 3000');
});
