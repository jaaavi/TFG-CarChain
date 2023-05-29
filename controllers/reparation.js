const { request, response } = require('express');
var conn =require('../database/config');
var mysql = require('mysql'),
connection = mysql.createConnection(
	conn
);

const insertReparation = (id_chain) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `reparation`(`id_chain`) VALUES (?)",
            [id_chain],
            function(err, result) {

                if (err) {
                    reject('Error: Cant insert new reparation')
                }
                else {

                    resolve(result.insertId);

                }
            });
        }
    })  

}

const insertReparationXVehicle = (reparation_id, vehicle_id, workshop_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `reparationxvehicle`(`vehicle_id`, `reparation_id`, `workshop_id`) VALUES (?, ?, ?)",
            [vehicle_id, reparation_id, workshop_id],
            function(err, result) {

                if (err) {
                    reject('Error: Cant insert new reparation in relationship table')
                }
                else {

                    resolve(true);

                }
            });
        }
    })  

}

const getReparationsFromVechicleId = (vehicle_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from reparationxvehicle join reparation on reparationxvehicle.reparation_id = reparation.id where reparationxvehicle.vehicle_id =(?)",
            [vehicle_id],
            function(err, rows) {

                if (err) {
                    reject('Error: Cant get reparations from vehicle with id => ' + vehicle_id)
                }
                else {
                    var reparations = [];
                    if (rows.length > 0){
                        rows.forEach(r => {
                            reparations.push(r.id_chain);
                        });
                    }
                    resolve(reparations);

                }
            });
        }
    })  

}

const getReparationsFromVechicleIdAndWorshop = (vehicle_id, workshop_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from reparationxvehicle join reparation on reparationxvehicle.reparation_id = reparation.id where reparationxvehicle.vehicle_id = (?) and reparationxvehicle.workshop_id = (?)",
            [vehicle_id, workshop_id],
            function(err, rows) {

                if (err) {
                    reject('Error:getReparationsFromVechicleIdAndWorshop ' + vehicle_id + "-" + workshop_id)
                }
                else {
                    var reparations = [];
                    if (rows.length > 0){
                        rows.forEach(r => {
                            reparations.push(r.id_chain);
                        });
                    }
                    resolve(reparations);

                }
            });
        }
    })  

}

const getReparationsFromWorkshop = (workshop_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from reparationxvehicle join reparation on reparationxvehicle.reparation_id = reparation.id where reparationxvehicle.workshop_id =(?)",
            [workshop_id],
            function(err, rows) {

                if (err) {
                    reject('Error: Cant get reparations from vehicle with id => ' + workshop_id)
                }
                else {
                    var reparations = [];
                    if (rows.length > 0){
                        rows.forEach(r => {
                            reparations.push(r.id_chain);
                        });
                    }
                    resolve(reparations);

                }
            });
        }
    })  

}


module.exports = {
    insertReparation,
    insertReparationXVehicle,
    getReparationsFromVechicleId,
    getReparationsFromWorkshop,
    getReparationsFromVechicleIdAndWorshop
}