const express = require("express");
// const pool = require("../config/conexion");
const client = require("../config/conexion");
const format = require("pg-format");

const menusControllers = express.Router(); // Instanciar router de express

// Para crear un plato o menu
menusControllers.post("/", async (req, res) => {
  const menu = req.body;

  // Se usa BEGIN antes de realizar una serie de consultas a la base de datos, luego COMMIT si todas las consultas se ejecutan con éxito o ROLLBACK si alguna consulta falla
  // Esto es para asegurarse de que todas las consultas se ejecuten o ninguna se ejecute, asegurando la consistencia de los datos
  try {
    await client.query("BEGIN"); // Iniciar transacción

    const platoQuery =
      "INSERT INTO plato (nombre, descripcion, imagen, calorias, precio) VALUES ($1, $2, $3, $4, $5) RETURNING id";
    const platoValues = [
      menu.nombre,
      menu.descripcion,
      menu.imagen,
      menu.calorias,
      menu.precio,
    ];
    const platoResult = await client.query(platoQuery, platoValues);

    const platoId = platoResult.rows[0].id; // Obtener el id del plato recién creado, se usará más adelante

    // Se insertan los ingredientes del plato en la base de datos
    for (let ingrediente of menu.ingredientes) {
      const tipoQuery =
        "INSERT INTO tipo_ingrediente (tipo) VALUES ($1) ON CONFLICT (tipo) DO NOTHING RETURNING id"; // ON CONFLICT (tipo) DO NOTHING es para que si el tipo de ingrediente ya existe, no se inserte de nuevo
      const tipoValues = [ingrediente.tipo];
      const tipoResult = await client.query(tipoQuery, tipoValues);

      let tipoId; // Se usará para guardar el id del tipo de ingrediente

      if (tipoResult.rowCount === 0) {
        // Si el tipo de ingrediente ya existe, obtenemos su id
        const existingTipoResult = await client.query(
          "SELECT id FROM tipo_ingrediente WHERE tipo = $1",
          tipoValues
        );
        tipoId = existingTipoResult.rows[0].id; // Se guarda el id del tipo de ingrediente existente
      } else {
        tipoId = tipoResult.rows[0].id; // Se guarda el id del tipo de ingrediente recién creado
      }

      // Se inserta el ingrediente en la base de datos
      const ingredienteQuery =
        "INSERT INTO ingrediente (nombre, tipo_ingrediente_id) VALUES ($1, $2) RETURNING id";
      const ingredienteValues = [ingrediente.nombre, tipoId];
      const ingredienteResult = await client.query(
        ingredienteQuery,
        ingredienteValues
      );

      const ingredienteId = ingredienteResult.rows[0].id; // Se guarda el id del ingrediente recién creado

      // Se inserta la asociación entre el plato y el ingrediente en la base de datos
      const ingredientePlatoQuery =
        "INSERT INTO ingrediente_plato (plato_id, ingrediente_id) VALUES ($1, $2)";
      const ingredientePlatoValues = [platoId, ingredienteId];
      await client.query(ingredientePlatoQuery, ingredientePlatoValues);
    }

    await client.query("COMMIT"); // Finalizar transacción

    res.status(201).json({ message: `Menu creado con éxito: ${menu.nombre}` });
  } catch (error) {
    await client.query("ROLLBACK"); // Deshacer todos los cambios en caso de error
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Para obtener todos los platos o menus
menusControllers.get("/", async (req, res) => {
  try {
    const { rows } = await client.query("SELECT * FROM plato");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Para obtener un plato o menu por id
menusControllers.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await client.query("SELECT * FROM plato WHERE id = $1", [
      id,
    ]);

    // Si no se encuentra el plato por id, devolver un error
    if (rows.length === 0) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }

    const plato = rows[0]; // Si no, obtener el plato
    // Obtener los ingredientes del plato
    const ingredientesRows = await client.query(
      // "SELECT ingrediente_id FROM ingrediente_plato WHERE plato_id = $1",
      "select ip.plato_id, ip.id as ingrediente_id, i.nombre, ti.tipo from ingrediente_plato as ip inner join ingrediente as i on i.id = ip.ingrediente_id inner join tipo_ingrediente as ti on ti.id=i.tipo_ingrediente_id where ip.plato_id=$1",
      [id] //pend: inner join con ingrediente, obtener nombre
    );

    // Devolver el plato junto con la lista de IDs de ingredientes
    res.json({ ...plato, ingredientes:  ingredientesRows.rows });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Ocurrió un error al intentar recuperar el plato" });
    console.error(error);
  }
});

// Para actualizar un plato o menu por id, se hace de esta forma para que no sea necesario enviar todos los datos del plato en la solicitud
menusControllers.patch("/:id", async (req, res) => {
  //investigar patch
  const id = req.params.id;
  const { nombre, descripcion, imagen, calorias, precio } = req.body;

  let queryString = "UPDATE plato SET ";
  let updateValues = [];
  let valueInd = 1;

  if (nombre) {
    queryString += `nombre = $${valueInd}, `;
    updateValues.push(nombre);
    valueInd++;
  }
  if (descripcion) {
    queryString += `descripcion = $${valueInd}, `;
    updateValues.push(descripcion);
    valueInd++;
  }
  if (imagen) {
    queryString += `imagen = $${valueInd}, `;
    updateValues.push(imagen);
    valueInd++;
  }
  if (calorias) {
    queryString += `calorias = $${valueInd}, `;
    updateValues.push(calorias);
    valueInd++;
  }
  if (precio) {
    queryString += `precio = $${valueInd}, `;
    updateValues.push(precio);
    valueInd++;
  }

  // Eliminar la última coma y agregar la condición WHERE
  queryString =
    queryString.slice(0, -2) + ` WHERE id = $${valueInd} RETURNING *`;
  updateValues.push(id);

  try {
    const { rows } = await client.query(queryString, updateValues);
    if (rows.length === 0) {
      return res.status(404).json({ error: "El menú no existe" });
    }
    res.status(200).json(`Menú actualizado con éxito: ${rows[0].nombre}`);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al intentar actualizar el menú" });
  }
});

// Para eliminar un plato o menu por id
menusControllers.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await client.query("BEGIN");

    // Eliminar las asociaciones entre ingredientes y el plato en ingrediente_plato
    await client.query("DELETE FROM ingrediente_plato WHERE plato_id = $1", [id]);

    // Verificar si hay ingredientes que ya no estén asociados a ningún plato
    const unusedIngredientesResult = await client.query(
      "SELECT i.* FROM ingrediente i LEFT JOIN ingrediente_plato ip ON i.id = ip.ingrediente_id WHERE ip.ingrediente_id IS NULL"
    );

    // Si hay ingredientes no utilizados, se eliminan de la base de datos
    const unusedIngredientesIds = unusedIngredientesResult.rows.map(
      (row) => row.id
    );
    if (unusedIngredientesIds.length > 0) {
      let deleteQuery = format(
        "DELETE FROM ingrediente WHERE id IN (%L)",
        unusedIngredientesIds
      );
      await client.query(deleteQuery);
    }

    // Se elimina el plato
    await client.query("DELETE FROM plato WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: `Plato eliminado exitosamente` });
  } catch (error) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({
        error: "Ocurrió un error al intentar eliminar el plato",
        details: error,
      });
    console.error(error);
  }
});

module.exports = menusControllers;
