const express = require("express"); // Para crear el router
const bcrypt = require("bcrypt"); // Para encriptar la contraseña
const jwt = require("jsonwebtoken"); // Para generar el token de autenticación

// const pool = require("../config/conexion");
const client = require("../config/conexion");
const auth = require("../middleware/auth");

const usuariosControllers = express.Router(); // Instanciar router de express

// Para crear un usuario en el registro
usuariosControllers.post("/", async (req, res) => {
  const { nombre, apellido, rol, correo, telefono, direccion, contrasena } =
    req.body;

  try {
    // Verificar si el correo ya está registrado
    const correoExistente = await client.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );
    if (correoExistente.rows.length > 0) {
      console.log("Correo electrónico ya registrado");
      return res
        .status(400)
        .json({ error: "Correo electrónico ya registrado" });
    }

    // Generar un hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar el nuevo usuario en la base de datos
    await client.query(
      "INSERT INTO usuarios (nombre, apellido, rol, correo, telefono, direccion, contrasena) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [nombre, apellido, rol, correo, telefono, direccion, hashedPassword]
    );

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el usuario" });
    console.error(error);
  }
});

// inicio sesion y generacion de token
usuariosControllers.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Verificar si el correo existe en la base de datos
    const usuario = await client.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );
    // Si el correo no existe, devolver un error
    if (usuario.rows.length === 0) { 
      return res.status(401).json({ error: "Credenciales inválidas" }); 
    }

    // Verificar la contraseña
    const match = await bcrypt.compare(contrasena, usuario.rows[0].contrasena); // compara la contraseña ingresada con la contraseña encriptada en la base de datos
    // Si la contraseña no coincide, devolver un error
    if (!match) { 
      return res.status(401).json({ error: "Credenciales inválidas" }); 
    }

    // Generar un token de autenticación
    const token = jwt.sign(
      { correo: usuario.rows[0].correo },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // El token expira en 1 hora
      }
    );

    // También devuelve el usuario (sin la contraseña) en la respuesta de inicio de sesión (el correo es como su ID, así que se usará para obtener los datos del usuario) 
    let userToSend = { ...usuario.rows[0] }; // Copia el objeto usuario
    delete userToSend.contrasena; // Elimina la contraseña del usuario
    res.status(200).json({ token, user: userToSend }); // Devuelve el token y el usuario
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
    console.error(error);
  }
});

// Para obtener los datos de un usuario autenticado mediante su token
usuariosControllers.get("/", auth, async (req, res) => {
  try {
    // Utiliza req.user.correo para obtener los datos del usuario
    const { rows } = await client.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [req.user.correo]
    );

    // Si el usuario no existe, devuelve un error
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]); // Devuelve el usuario
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving user data." });
  }
});

// Para eliminar un usuario por correo
usuariosControllers.delete("/", async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res
      .status(400)
      .json({ error: "Correo requerido para la eliminación." });
  }

  try {
    const { rowCount } = await client.query(
      "DELETE FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ message: `Usuario ${correo} eliminado con éxito` });
  } catch (error) {
    res.status(500).json({ error: "Ocurrió un error al eliminar el usuario." });
    console.error(error);
  }
});

// Para obtener todos los usuarios con autenticación
usuariosControllers.get("/all", auth, async (req, res) => {
  try {
    // Utiliza req.user.correo para obtener los datos del usuario
    const { rows } = await client.query(
      "SELECT * FROM usuarios"
    );

    // Si no hay usuarios, devuelve un error
    if (rows.length === 0) {
      return res.status(404).json({ error: "No se encontraron usuarios" });
    }

    res.json(rows); // Devuelve los usuarios
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al recuperar los datos de usuarios" });
  }
});

// actualizacion de datos usuario
usuariosControllers.put("/:id", auth, async (req, res) => {
  const { correo, nombre, apellido, rol, telefono, direccion } = req.body;

  // Verifica que el usuario que realiza la solicitud es el usuario que se va a actualizar
  if (correo !== req.user.correo) {
    return res
      .status(403)
      .json({ error: "No estás autorizado para actualizar este usuario" });
  }

  const fields = { nombre, apellido, rol, telefono, direccion };
  const setQueryParts = [];
  const values = [];

  // Recorre los campos para crear la cadena de consulta SQL y los valores para actualizar, esto con el objetivo de evitar actualizar campos no deseados (como el correo electrónico) 
  let valueIndex = 1;
  for (let key in fields) {
    if (fields[key] !== undefined) { // Verifica si el campo está definido 
      setQueryParts.push(`${key} = $${valueIndex}`); // Agrega el campo a la cadena de consulta SQL 
      values.push(fields[key]); // Agrega el valor a los valores para actualizar
      valueIndex++; // Incrementa el índice de valor
    }
  }

  // Agrega el correo electrónico al final de los valores para actualizar 
  values.push(correo);

  try {
    // Verifica si se proporcionaron campos para actualizar
    if (values.length === 1) {
      return res
        .status(400)
        .json({ error: "No se proporcionaron campos para actualizar." });
    }

    // Actualiza el usuario en la base de datos
    const query = `UPDATE usuarios SET ${setQueryParts.join( // El join es para unir los campos separados por 
      ", " // Ejemplo: nombre = $1, apellido = $2, rol = $3, telefono = $4, direccion = $5
    )} WHERE correo = $${valueIndex} RETURNING *`; // El RETURNING * devuelve el usuario actualizado
    const updatedUser = await client.query(query, values);  

    // Si el usuario no existe, devuelve un error
    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devuelve el usuario actualizado
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Un error ocurrió durante la actualización del usuario.",
      });
  }
});

module.exports = usuariosControllers;
