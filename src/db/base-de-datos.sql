-- Creación de las tablas de la base de datos

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  apellido VARCHAR(255),
  rol VARCHAR(255),
  correo VARCHAR(255),
  telefono VARCHAR(255),
  direccion VARCHAR(255),
  contrasena VARCHAR(255)
);

CREATE TABLE plato (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  imagen TEXT,
  calorias INTEGER,
  precio INTEGER
);

CREATE TABLE tipo_ingrediente (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(255) UNIQUE
);

CREATE TABLE ingrediente (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  tipo_ingrediente_id INTEGER,
  FOREIGN KEY (tipo_ingrediente_id) REFERENCES tipo_ingrediente(id)
);

CREATE TABLE ingrediente_plato (
  id SERIAL PRIMARY KEY,
  plato_id INTEGER,
  ingrediente_id INTEGER,
  FOREIGN KEY (plato_id) REFERENCES plato(id),
  FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id)
);
