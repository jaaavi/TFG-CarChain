require('dotenv').config();
const {response, request} = require('express');
const { isUserActive, insertUser, isUserCorrect, isUserRegistered, activateUser, modifyUser, isUsernameInUse } = require('./user');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");




const login = async(req, res = response) => {
    console.log(process.env.SECRET_JWT)
    const {email, password} = req.body;
        if (email !== '' && password !== '' && email !== undefined && password !== undefined){
            var expReg= /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
            if (expReg.test(email) || email === 'admin' ){
                var user = await isUserCorrect(email)
                console.log(user)
                    if ((user !== undefined && user.active === 1) || email === 'admin'){
                        
                        const validPassword = bcrypt.compareSync(password, user.password);

                        if (validPassword){                    
                            req.session.user = user;
                            if (email === 'admin'){
                               
                                res.redirect('/admin');
                            }else{
                                if (user.rol === 'workshop'){
                                    res.redirect('/workshop');

                                }else if (user.rol === 'owner'){
                                    res.redirect('/account');
                                }
                            }
                        }else{
                            res.render('login', {error: true, verified: false,msg: 'Contraseña incorrecta'});
                        }
                    }else {
                        res.render('login', {error: true, verified: false,msg: 'Usuario no encontrado/verificado'});
                    }
            }else{
                res.render('login', {error: true, verified: false,msg: 'Email o contraseña incorrectos'});

            }
                
        }else{
            res.render('login', {error: true, verified: false,msg: 'Introduce un email válido'});
        }  
        
        


}

const verifyUser = async(req, res) =>{

    const {confirmationToken} = req.params;

    var validated = await activateUser(confirmationToken);

    if (validated){
        res.render('login', {msg: 'Tus credenciales se han verfificado, accede al sistema', verified: true, error: false})
    }

}

const register = async( req=request, res = response) => {
    
    const file = req.file;

    const filePath = file.path;
    console.log(filePath)
    const {email, username, password, passwordrpt, userimg} = req.body;

    if (email !== '' && username !== '' && password !== '' && passwordrpt !== ''){

        var expReg= /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

        if (expReg.test(email)){
            
            var user = await isUserRegistered(email);
                if (!user){
                    var usernameInUse = await isUsernameInUse(username);
                    if (!usernameInUse){
                        if (rol !== undefined ){
                            if(password === passwordrpt){
                                const saltRounds = 10;
                                bcrypt.genSalt(saltRounds, (err, salt) => {
                                    bcrypt.hash(password, salt, (err, hash) => {
                                        
                                        const token = jwt.sign({email: email}, process.env.SECRET_JWT)
                                        insertUser({token: token, miembro_rol: 1, rol: rol === undefined ? rol: 'none',username: username, email: email, password: hash}, async (err, row) =>{
                                            if (!err && row >= 0){
                                                res.render('login', {error: false, verified: true, msg: 'Felicidades!! Te has registrado correctamente :) Entra en tu correo para confirmar el email'})
                                            }
                                        })
                                    });
                                });
                            }else{
                                res.render('signin', {error: true, registered: false,msg: 'Las constraseñas no coinciden'})
                            }
                        }else{
                            res.render('signin', {error: true, registered: false, msg: 'Es necesario que elijas al menos un rol'})
                        }
                    }else{
                        res.render('signin', {error: true, registered: false, msg: 'El nombre de usuario está en uso, prueba con otro :D'})
                    }
                    
                }else{
                    res.render('signin', {error: true, registered: false, msg: 'El email ya está en uso'})
                }
        }else{
            res.render('signin', {error: true, registered: false, msg: 'Introduce un formato correcto para el email'})
        }
    }else{
        res.render('signin', {error: true, msg: 'No es un email válido'})
    }
  
}



module.exports = {
    login,
    register,
    verifyUser
}