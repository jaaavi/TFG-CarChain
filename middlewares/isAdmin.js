const adminMiddleware = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admin') {
      // Usuario autenticado como administrador
      next(); // Pasar al siguiente controlador
    } else {
      // Usuario no autenticado o no es administrador
      res.redirect("/login"); // Redirigir a la página de inicio de sesión
    }
  };


module.exports  = {
    adminMiddleware
};