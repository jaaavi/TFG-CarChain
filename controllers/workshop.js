const { request, response } = require('express');
var conn =require('../database/config');
var mysql = require('mysql'),
connection = mysql.createConnection(
	conn
);


const insertWorkshop= (id_chain, name, direction, phone_number, city, cif) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            var query = "INSERT INTO `workshop`(`id_chain`, `name`, `direction`, `phone_number`, `city`, `cif`, `active`) VALUES (?, ?, ?, ?, ?, ?, ?)";
            connection.query(query, [id_chain, name, direction, phone_number, city, cif, 1], function(err, taller) {

                if (err){
                    reject('Error a la hora de insertar taller');
                }else {
                    resolve(true)
                }

            });
        }
    })
}

const getWorkshopByCif = (cif) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from workshop where cif = (?)",
            [cif],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting workshop with cif: ' + cif)                  
                }
                else {
                    let vehicles = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({id: r.id, id_chain: r.id_chain, name: r.name, direction: r.direction, phone_number: r.phone_number, city: r.city, cif: r.cif, active: r.active});
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    })  
}

const getWorkshopById = (id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from workshop where id = (?)",
            [id],
            function(err, rows) {

                if (err) {
                    reject('Error: getWorkshopById()')                  
                }
                else {
                    let vehicles = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({id: r.id, id_chain: r.id_chain, name: r.name, direction: r.direction, phone_number: r.phone_number, city: r.city, cif: r.cif, active: r.active});
                        });
                    }
                    resolve(vehicles[0]);

                }
            });
        }
    })  
}

const deleteWorkshop= (id)=>{
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

const getAllWorkshops= (req, res) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from workshop",
            function(err, rows) {

                if (err) {
                    reject('Error: not possible to get Workshops ')
                }
                else {
                    let workshops = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            workshops.push({id: r.id,	
                                id_chain: r.id_chain,	
                                name: r.name,	
                                direction: r.direction,	
                                phone_number: r.phone_number,	
                                city: r.city,	
                                cif: r.cif,	
                                active: r.active	
                            });
                        });
                    }
                    resolve(workshops);

                }
            });
        }
    })  
}

const insertvehicleXworkshop = (workshop_id, vehicle_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `vehicleXworkshop`(`workshop_id`, `vehicle_id`) VALUES (?, ?)",
            [workshop_id, vehicle_id],
            function(err, result) {

                if (err) {
                    reject('Error: Cant insert new vehicle in vehicleXworkshop')
                }
                else {

                    resolve(true);

                }
            });
        }
    })  

}

const getVehicleXworkshop = (workshop_id, vehicle_id) => {

    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("select * from vehicleXworkshop where workshop_id = (?) and vehicle_id = (?)",
            [workshop_id, vehicle_id],
            function(err, result) {

                if (err) {
                    reject('Error: Cant get existing field in vehicleXworkshop')
                }
                else {

                    resolve(true);

                }
            });
        }
    })  

}

module.exports = {
    getWorkshopByCif,
    insertWorkshop,
    deleteWorkshop,
    getAllWorkshops,
    insertvehicleXworkshop,
    getVehicleXworkshop,
    getWorkshopById
}