const {Router} = require('express');
const { check } = require('express-validator');
const { login } = require('../controllers/auth');

const router = Router();


router.get("/", (req, res) => { 
   res.render("login", {error: false, verified: false, msg: ''})
 });


router.post('/', [], login);


module.exports = router;