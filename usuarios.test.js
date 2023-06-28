const request = require("supertest");
const app = require("./index"); // Importa la configuración del servidor Express

let token;

// pruebas para ruta /usuarios
describe("Rutas de /usuarios", () => {
  describe("POST /usuarios", () => {
    test("Debería crear un nuevo usuario y devolver un estado 201", async () => {
      const res = await request(app)
        .post("/usuarios")
        .send({
          nombre: "Prueba",
          apellido: "Usuario",
          rol: "Administrador",
          correo: "prueba@ejemplo.com",
          telefono: "123456789",
          direccion: "Calle Falsa 123",
          contrasena: "Prueba@123"
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("message");
    });
  });

  // prueba para iniciar sesión en /usuarios/login
  describe("POST /usuarios/login", () => {
    test("Debería iniciar sesión y devolver un estado 200 y un token", async () => {
      const res = await request(app)
        .post("/usuarios/login")
        .send({
          correo: "prueba@ejemplo.com",
          contrasena: "Prueba@123"
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      token = res.body.token; // Guarda el token para usarlo en las próximas pruebas
    });
  });

  describe("GET /usuarios", () => {
    test("Debería obtener los detalles del usuario y devolver un estado 200", async () => {
      const res = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`); // Usa el token obtenido en la prueba de inicio de sesión

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("correo");
    });
  });

  // crear una prueba para obtener todos los usuarios en /usuarios/all con token
  describe("GET /usuarios/all", () => {
    test("Debería obtener todos los usuarios y devolver un estado 200", async () => {
      const res = await request(app)
        .get("/usuarios/all")
        .set("Authorization", `Bearer ${token}`); // Usa el token obtenido en la prueba de inicio de sesión

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("length");
    });
  });

  // actualizar un usuario en /usuarios/:id con token 
  describe("PUT /usuarios/:id", () => {
    test("Debería actualizar un usuario y devolver un estado 200", async () => {
      const res = await request(app)
        .put("/usuarios/1")
        .set("Authorization", `Bearer ${token}`) // Usa el token obtenido en la prueba de inicio de sesión
        .send({
          correo: "prueba@ejemplo.com",
          nombre: "Nuevo nombre",
          apellido: "Nuevo apellido",
          rol: "Administrador",
          telefono: "987654321",
          direccion: "Calle Verdadera 123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("nombre");
    });
  });
});

// prueba para ruta de menus
describe("Rutas de /menus", () => {
  describe("GET /menus", () => {
    test("Debería obtener todos los menus y devolver un estado 200", async () => {
      const res = await request(app).get("/menus");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("length");
    });
  });
});

// prueba para ruta de ingredientes
describe("Rutas de /ingredientes", () => {
  describe("GET /ingredientes", () => {
    test("Debería obtener todos los ingredientes y devolver un estado 200", async () => {
      const res = await request(app).get("/ingredientes");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("length");
    });
  });
});