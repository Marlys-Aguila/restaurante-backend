const express = require("express");
// const pool = require("../config/conexion");
const client = require("../config/conexion");

const ingredientesControllers = express.Router();

// Para obtener todos los ingredientes
ingredientesControllers.get("/", async (req, res) => {
  try {
    const { rows } = await client.query("SELECT * FROM ingrediente");
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Ocurrió un error al intentar obtener todos los ingredientes" });
    console.error(error);
  }
});

// Para obtener un ingrediente por id
ingredientesControllers.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await client.query(
      "SELECT * FROM ingrediente WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ingrediente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Ocurrió un error al intentar obtener el ingrediente" });
    console.error(error);
  }
});

module.exports = ingredientesControllers;
