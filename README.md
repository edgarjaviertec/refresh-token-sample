# node-jwt-refresh-token

Este ejemplo esta basado en los siguientes artículos:

- [Refresh token con autenticación JWT. Implementación en Node.js](https://solidgeargroup.com/refresh-token-autenticacion-jwt-implementacion-nodejs?lang=es)
- [Nodejs Authentication Using JWT and Refresh Token](https://codeforgeek.com/2018/03/refresh-token-jwt-nodejs-authentication/)

**Nota:** Te recomiendo que los leas, estan muy interesantes.

### Requerimientos:

- Tener instalado Node.js
- Tener instalado un servidor de Redis

### Pasos para ejecutar el proyecto

1.- Abre la terminal y ejecuta el siguiente comando

```
npm install
```

2.- Edita config.json con los valores deseados

```json
{
    "accessTokenSecret": "PALABRA_SECRETA_TOKEN",
    "refreshTokenSecret": "PALABRA_SECRETA_REFRESH_TOKEN",
    "accessTokenLife": 60,
    "refreshTokenLife": 120,
    "port": 3000 
}
```

| Valor            | Descripción                                           |
| ---------------- |-------------------------------------------------------| 
|accessTokenSecret |La clave secreta con la que se cifrara el access token |
|refreshTokenSecret|La clave secreta con la que se cifrara el refresh token|
|accessTokenLife   |Tiempo de vida del access token (en segundos)          |
|refreshTokenLife  |Tiempo de vida del refresh token (en segundos)         |
|port              |El puerto donde quieres correr el servidor             | 

3.- Después de que hayas [instalado Redis](https://redis.io/download), ejecuta el servidor de Redis y el cliente de Redis

```
$ redis-server
$ redis-cli
```

- Nota: Si usas macOS, puedes usar [Redis Server](https://langui.net/redis-server/)
- Nota: El proyecto intentara conectarse usando la configuración por defecto de Redis (127.0.0.1:6379)

4.- Ejecuta la aplicación

```
npm run dev
```
