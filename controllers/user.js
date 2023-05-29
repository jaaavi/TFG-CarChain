const { request, response } = require('express');
var conn =require('../database/config');
var mysql = require('mysql'),
connection = mysql.createConnection(
	conn
);

const getUserByDNI = (dni) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from user where dni = (?)",
            [dni],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting user with dni: ' + dni)                  
                }
                else {
                    let user = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            user.push({	id: r.id, entity_id: r.entity_id, email: r.email, password: r.password, username: r.username, active: r.active, rol: r.rol, confirmationToken: r.confirmationToken, dni: r.dni, id_chain: r.id_chain});
                        });
                    }
                    resolve(user);

                }
            });
        }
    })  
}

const getUserById= (id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from user where id = (?)",
            [id],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting user with id: ' + id)                  
                }
                else {
                    let user = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            user.push({	id: r.id, entity_id: r.entity_id, email: r.email, password: r.password, username: r.username, active: r.active, rol: r.rol, confirmationToken: r.confirmationToken, dni: r.dni, id_chain: r.id_chain});
                        });
                    }
                    resolve(user[0]);

                }
            });
        }
    })  
}


const insertUser = (entity_id, email, password, confirmationToken, rol, dni, id_chain, username) =>{
    console.log(entity_id, email, password, confirmationToken, rol, dni, id_chain, username)
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `user`(`entity_id`, `email`, `password`, `rol`, `active`, `username`, `confirmationToken`, `dni`, `id_chain`) VALUES (?,?,?,?,?,?,?,?,?)",
            [entity_id, email, password, rol, 0, username, confirmationToken, dni, id_chain],
            function(err, rows) {

                if (err) {
                    reject('Error: Inserting user: ' + dni)                  
                }
                else {
                    resolve(true);

                }
            });
        }
    })  
}

const activateUser = (token) =>{

    return new Promise((resolve, reject) =>{
        if (connection){

            var query = `UPDATE user SET active = ${1} WHERE confirmationToken = '${token}'`;
    
            connection.query(query, function(err, row) {
            
                if (err){
                    reject('No ha podido verificar el usuario');
                }else {
                    var validated = false;
                    if (row !== undefined){
                        validated = true;
                    }
                    resolve(validated)
                }
            });
        }
    })
}

const isUserCorrect = (email) =>{
    

    return new Promise((resolve, reject)=>{
        if (connection){
            connection.query("SELECT * FROM user WHERE email = (?) " , 
            [email], 
            function(err, row) { 
                if (err) { 
                    reject("El usuario no existe");
                }
                else {
                    if (row[0] !== undefined){
                        var user = {id: row[0].id,
                            entity_id: row[0].entity_id,
                            email: row[0].email,
                            password: row[0].password,
                            username: row[0].username,
                            active: row[0].active,
                            rol: row[0].rol,
                            confirmationToken: row[0].confirmationToken,
                            dni: row[0].dni,
                            id_chain: row[0].id_chain
                            }

                        
                    }
                    resolve(user)
                }
            });
        }
    })

    

}


const getAllUsers = (req, res) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from user",
            function(err, rows) {

                if (err) {
                    reject('Error: not possible to get Users ')
                }
                else {
                    let users = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            users.push({
                                id: r.id,
                                entity_id: r.entity_id,
                                email: r.email,
                                password: r.password,
                                username: r.username,
                                active: r.active,
                                rol: r.rol,
                                confirmationToken: r.confirmationToken,
                                dni: r.dni,
                                id_chain: r.id_chain
                            });
                        });
                    }
                    resolve(users);

                }
            });
        }
    })  
}

module.exports = {
	getUserByDNI,
	insertUser,
	activateUser,
    isUserCorrect,
    getAllUsers,
    getUserById
}