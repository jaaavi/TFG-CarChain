const {Router} = require('express');
const { check } = require('express-validator');

const router = Router();


router.get('/', async (req, res) =>{

   res.render('credentials', {msg: '', error: false, verified: false})

})


module.exports = router;