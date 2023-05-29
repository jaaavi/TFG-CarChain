const express = require("express");
const config = require("../database/config");
const expressSession = require("express-session");
const expressMsqlSession = require("express-mysql-session");
const MySQLStore = expressMsqlSession(expressSession);

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.paths = {
      index: '/',
      workshop: "/workshop",
      user: "/user",
      admin: "/admin",
      register: "/register",
      login: "/login",
      preview: "/preview",
      auth: "/auth",
      owner: "/account"
    };

    this.middlewares();

    this.routes();
  }

  middlewares() {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.app.use(express.static("./public"));

    this.app.set("view engine", "ejs");

    const sessionStore = new MySQLStore(config);

    const middlewareSession = expressSession({
      saveUninitialized: false,
      secret: "foobar34",
      resave: false,
      store: sessionStore,
    });

    this.app.use(middlewareSession);


    
  }

  routes() {

    this.app.use(this.paths.index, require("../routes/index"));
    this.app.use(this.paths.workshop, require("../routes/workshop"));
    this.app.use(this.paths.admin, require('../routes/admin'));
    this.app.use(this.paths.register, require('../routes/register'));
    this.app.use(this.paths.login, require('../routes/login'));
    this.app.use(this.paths.auth, require('../routes/auth'));
    this.app.use(this.paths.owner, require('../routes/owner'));

  }

  listen() {
    this.app.listen(this.port, () => {
      console.log("Servidor corriendo en el puerto", this.port);
    });
  }
}

module.exports = Server;
