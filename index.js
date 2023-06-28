const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar controladores
const ingredientesControllers = require("./src/controllers/ingredientesControllers");
const menusControllers = require("./src/controllers/menusControllers");
const usuariosControllers = require("./src/controllers/usuariosControllers");

const app = express(); // Instanciar express

const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log(`Server UP AND RUNNING on port ${PORT}`)); // Iniciar servidor

app.use(express.json()); // Middleware para parsear JSON

app.use(cors({ exposedHeaders: "Authorization" })); // Middleware para CORS
// exposedHeaders es para que el cliente pueda leer el header Authorization que enviamos en la respuesta de login y registro de usuarios (ver usuariosControllers.js)
// y así poder usarlo en las peticiones que requieran autenticación (ver ingredientesControllers.js y menusControllers.js)

// rutas de la API (endpoints)
app.use("/ingredientes", ingredientesControllers);
app.use("/menus", menusControllers);
app.use("/usuarios", usuariosControllers);

// Ruta de inicio
app.get("/", (req, res) => {
  res.send("¡Bienvenido a la API del restaurante Fogón de Memorias!");
});

module.exports = app;
