const { request, response } = require('express');
var conn =require('../database/config');
var mysql = require('mysql'),
connection = mysql.createConnection(
	conn
);


const insertAuthorization= (nombre, direccion) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            var query = "INSERT INTO taller (nombre, direccion, activo) VALUES (?, ?, ?)";
            connection.query(query, [nombre, direccion, 0], function(err, taller) {

                if (err){
                    reject('Error a la hora de insertar taller');
                }else {
                    resolve(true)
                }

            });
        }
    })
}


const deleteAuthorization= (id)=>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("DELETE FROM taller WHERE id = (?)", [id],
            function(err, rows) {

                if (err) {
                    reject('Error deleting taller' + id)
                }
                else {
                    var deleted = false;
                    if(rows.length !== 0){
                        deleted = true
                    }
                    resolve(deleted);
                    
                }
            });
        }
    })

}

const getAllAuthorizations = (req, res) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * FROM vehiclexauthorization join vehicle on vehicle.id = vehiclexauthorization.vehicle_id",
            function(err, rows) {

                if (err) {
                    reject('Error pillando authorizations')
                }
                else {
                    let authorizations = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            authorizations.push({owner_id: r.owner_id, vehicle_id: r.vehicle_id, authorized_user_id: r.authorized_user_id, acces_token: r.acces_token, id: r.id});
                        });
                    }
                    resolve(authorizations);

                }
            });
        }
    })  
}

const getAllAuthorizationsByPlate = (plate_number) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * FROM vehiclexauthorization join vehicle on vehicle.id = vehiclexauthorization.vehicle_id where plate_number = (?)",[plate_number],
            function(err, rows) {

                if (err) {
                    reject('Error pillando authorizations')
                }
                else {
                    let authorizations = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            authorizations.push({owner_id: r.owner_id, vehicle_id: r.vehicle_id, authorized_user_id: r.authorized_user_id, acces_token: r.acces_token, id: r.id});
                        });
                    }
                    resolve(authorizations);

                }
            });
        }
    })  
}

module.exports = {
    getAllAuthorizations,
    getAllAuthorizationsByPlate,
    deleteAuthorization,
    insertAuthorization
}