// Objetivo: Verificar si el token es válido y agregar el correo electrónico del usuario a la solicitud (request) para que pueda ser usado en los controladores
// el correo es como su ID, así que se usará para obtener los datos del usuario
const jwt = require("jsonwebtoken");
require("dotenv").config();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization; // Obtener el token de la solicitud (request) en el header Authorization 

  // Verificar si el token existe
  if (!authHeader) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const parts = authHeader.split(" "); // Separar el token en dos partes (Bearer y el token en sí) 

  // Verificar si el token tiene dos partes y si la primera parte es Bearer
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) { // /^Bearer$/i.test(parts[0]) es una expresión regular para verificar si la primera parte es Bearer
    return res.status(401).json({ error: "Error en el token" });
  }

  const token = parts[1]; // Obtener el token en sí (la segunda parte)

  // Verificar si el token es válido 
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido" }); 
    }

    // Agrega el correo electrónico del usuario a la solicitud
    req.user = {
      correo: decoded.correo, 
    };

    return next(); // Continuar con la ejecución del código
  });
};

module.exports = auth;
