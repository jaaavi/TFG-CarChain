const { request, response } = require('express');
var conn =require('../database/config');
var mysql = require('mysql'),
connection = mysql.createConnection(
	conn
);
const contractCompiler = require('../ethereum/compiler'); //Clase singleton para compilar el contrato
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const getAllVehicles = () =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from vehicle",
            function(err, rows) {

                if (err) {
                    reject('Error: Getting all vehicles function isnt working')
                }
                else {
                    let vechicles = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vechicles.push({id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make});
                        });
                    }
                    resolve(vechicles);

                }
            });
        }
    })  
}

const getAllVehiclesWithReparations = async () =>{
    //Compila el contrato si es que no lo estaba ya
    const compiledContracts = contractCompiler.compileContracts();
    //Coge los address del proveedor
    var accounts = await web3.eth.getAccounts();
    console.log(compiledContracts.CarChain.abi[0].inputs)
    //Crea una instancia del contrato mandando el abi del contrato, el bytecode y el gas
    const contract = await new web3.eth.Contract(compiledContracts.CarChain.abi)
    .deploy({ data: '0x' + compiledContracts.CarChain.bytecode })
    .send({ from: accounts[0], gas: "1000000" }); //Tener en cuenta el gas que debe de consumir el contrato
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT reparationxvehicle.vehicle_id as vehicle_id, reparationxvehicle.reparation_id as reparation_id, vehicle.id_chain as vehicle_hash, vehicle.plate_number as plate_number, vehicle.model as model, vehicle.make as make, reparation.id_chain as reparation_hash from reparationxvehicle join vehicle on vehicle.id = reparationxvehicle.vehicle_id join reparation on reparationxvehicle.reparation_id = reparation.id",
            function(err, rows) {

                if (err) {
                    reject('Error: Getting all vehicles function isnt working')
                }
                else {
                    let vechiclesWithReparations = [];
                    let reparationList = [];
                  
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vechiclesWithReparations.push({vehicle_id: r.vehicle_id, vehicle_hash: r.vehicle_hash, reparation_id: r.reparation_id, reparation_hash: r.reparation_hash, plate_number: r.plate_number, model: r.model, make: r.make});
                        });
                    }
                    vechiclesWithReparations.forEach(async v => {

                        const reparation = await contract.methods.getVehicleReparation('0x'+v.vehicle_hash, '0x'+v.reparation_hash).call();
                        reparationList.push({vechicle_db: v, reparation: reparation});
                    });
                    resolve(reparationList);

                }
            });
        }
    })  
}



const insertVehicle = (id_chain, plate_number, manufacturer, model) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `vehicle`(`id_chain`, `plate_number`, `model`, `make`, `visibility`) VALUES (?,?,?,?,?)",
            [id_chain, plate_number, manufacturer, model, 'private'],
            function(err, result) {

                if (err) {
                    reject('Error: Insert vehicle function isnt working')
                }
                else {
                    resolve(result.insertId);
                }
            });
        }
    })  
}

const getVehicleByPlate = (plate) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from vehicle join vehiclexuser on vehicle.id = vehiclexuser.vehicle_id where plate_number = (?)",
            [plate],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting vehicle with plate: ' + plate)                  
                }
                else {
                    let vehicles = [];
                    console.log(plate)
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({owner_id: r.user_id, id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility });
                        });
                    }
                    resolve(vehicles[0]);

                }
            });
        }
    })  
}


const getVehicleById = (id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from vehicle where id = (?)",
            [id],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting vehicle with id: ' + id)                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility });
                        });
                    }
                    resolve(vehicles[0]);

                }
            });
        }
    })  
}


const getAllUserVehicles = (id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from vehiclexuser join vehicle on vehiclexuser.vehicle_id = vehicle.id where user_id = (?)",
            [id],
            function(err, rows) {

                if (err) {
                    reject('Error: Getting vehicles from user: ' + id)                  
                }
                else {
                    let vehicles = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({user_id: r.user_id, vehicle_id: r.vehicle_id, id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility});
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    })  
}


const associateVehicleToUser = (id_vehicle, id_user) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `vehiclexuser`(`vehicle_id`, `user_id`) VALUES (?,?)",
            [id_vehicle, id_user],
            function(err, rows) {

                if (err) {
                    reject('Error: Inserting user vehicle ')                  
                }
                else {
                   
                    resolve(true);

                }
            });
        }
    }) 
}

const getVehicleOwner = (id_vehicle) =>{
    console.log(id_vehicle)
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT user_id FROM vehiclexuser where vehicle_id = (?)",
            [id_vehicle],
            function(err, rows) {
                if (err) {
                    reject('Error: getting vehicle owner ')                  
                }
                else {
                    resolve(rows[0].user_id);

                }
            });
        }
    }) 
}

const getVehicleAndOwner= (plate) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * FROM vehiclexuser join vehicle on vehiclexuser.vehicle_id = vehicle.id where vehicle.plate_number = (?)",
            [plate],
            function(err, rows) {
                if (err) {
                    reject('Error: getting vehicle owner ')                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({owner_id: r.user_id,id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility });
                        });
                    }
                    resolve(vehicles[0]);

                }
            });
        }
    }) 
}

const insertPendingAuthorization = (owner_id, vehicle_id, authorized_user_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("INSERT INTO `vehiclexauthorization`(`owner_id`, `vehicle_id`, `authorized_user_id`, `active`) VALUES (?,?,?,?)",
            [owner_id, vehicle_id, authorized_user_id, false],
            function(err, rows) {

                if (err) {
                    reject('Error: Inserting user vehicle ')                  
                }
                else {
                   
                    resolve(true);

                }
            });
        }
    }) 
}

const getWaitingAuthorizations = (authorized_user_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("select * from vehiclexauthorization join vehicle on vehiclexauthorization.vehicle_id = vehicle.id where authorized_user_id = (?)",
            [authorized_user_id],
            function(err, rows) {

                if (err) {
                    reject('Error: Inserting user vehicle ')                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({status: r.active, owner_id: r.owner_id,id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility });
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    }) 
}

const getVehiclesToAuthorize = (owner_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("select * from vehiclexauthorization join vehicle on vehiclexauthorization.vehicle_id = vehicle.id where owner_id = (?) and active = 0",
            [owner_id],
            function(err, rows) {

                if (err) {
                    reject('Error: getVehiclesToAuthorize ')                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({authorized_user_id: r.authorized_user_id, status: r.active, owner_id: r.owner_id,id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility, id_auth: r.id_auth });
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    }) 
}

const getAuthorizedVehiclesByOwner = (owner_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("select * from vehiclexauthorization join vehicle on vehiclexauthorization.vehicle_id = vehicle.id join user on vehiclexauthorization.authorized_user_id = user.id where owner_id = (?) and vehiclexauthorization.active = 1",
            [owner_id],
            function(err, rows) {

                if (err) {
                    reject('Error: getVehiclesToAuthorize ')                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({dni: r.dni, authorized_user_id: r.authorized_user_id, status: r.active, owner_id: r.owner_id,id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility, id: r.id_auth });
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    }) 
}

const getVehicleAuthorization = (user_id, vehicle_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("select * from vehiclexauthorization join vehicle on vehiclexauthorization.vehicle_id = vehicle.id where vehiclexauthorization.authorized_user_id = (?) and vehiclexauthorization.vehicle_id = (?)",
            [user_id, vehicle_id],
            function(err, rows) {

                if (err) {
                    reject('Error: getVehiclesToAuthorize ')                  
                }
                else {
                    let vehicles = [];
                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({authorized_user_id: r.authorized_user_id, status: r.active, owner_id: r.owner_id,id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility });
                        });
                    }
                    resolve(vehicles[0]);

                }
            });
        }
    }) 
}

const authorizeUser = (owner_id, vehicle_id, authUser) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query(`UPDATE vehiclexauthorization SET active= (?) WHERE vehicle_id = (?) and owner_id = (?) and authorized_user_id = (?)`,
            [true, vehicle_id, owner_id, authUser],
            function(err, rows) {

                if (err) {
                    reject('Error: authorizeUser ')                  
                }
                else {
                    
                    resolve(true);

                }
            });
        }
    }) 
}



const deleteAuthorization = (id_auth) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("DELETE FROM `vehiclexauthorization` WHERE id_auth = (?)",
            [id_auth],
            function(err, rows) {

                if (err) {
                    reject('Error: deleteAuthorization() ')                  
                }
                else {
                    
                    resolve(true);

                }
            });
        }
    }) 
}

const updateVisibility = (visibility, id_vehicle) =>{
    console.log(id_vehicle)
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query(`UPDATE vehicle SET visibility= '${visibility}' where id = '${id_vehicle}'`,
            function(err, rows) {
                if (err) {
                    reject('Error: changing visibility ')                  
                }
                else {
                    resolve(true);

                }
            });
        }
    }) 
}

const isVehicleInWorkshop = (id_vehicle, workshop_id) =>{
    console.log(id_vehicle)
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query(`select * from vehiclexworkshop where vehicle_id = (?) and workshop_id = (?)`,[id_vehicle, workshop_id],
            function(err, rows) {
                if (err) {
                    reject('Error: isVehicleInWorkshop')                  
                }
                else {

                    var exist = false;
                    if (rows.length > 0){
                        exist = true;

                    }else{
                        exist = false;
                    }
                    resolve(exist)
                }
            });
        }
    }) 
}

const associateVehicleToWorkshop = (id_workshop, id_vehicle) =>{
    console.log(id_vehicle)
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query('INSERT INTO vehiclexworkshop (vehicle_id, workshop_id) VALUES (?, ?)',[id_vehicle, id_workshop],
            function(err, rows) {
                if (err) {
                    reject('Error: associateVehicleToWorkshop')                  
                }
                else {
                    resolve(true);

                }
            });
        }
    }) 
}

const getAllWorkshopsVehicles = (workshop_entity_id) =>{
    return new Promise((resolve, reject) =>{
        if (connection){
            connection.query("SELECT * from vehiclexworkshop join vehicle on vehiclexworkshop.vehicle_id = vehicle.id where vehiclexworkshop.workshop_id = (?)",
            [workshop_entity_id],
            function(err, rows) {

                if (err) {
                    reject('Error: getAllWorkshopsVehicles with ID ' + id)                  
                }
                else {
                    let vehicles = [];

                    if(rows.length !== 0){
                        rows.forEach(r => {
                            vehicles.push({workshop_id: r.workshop_id, vehicle_id: r.vehicle_id, id: r.id, id_chain: r.id_chain, plate_number: r.plate_number, model: r.model, make: r.make, visibility: r.visibility});
                        });
                    }
                    resolve(vehicles);

                }
            });
        }
    })  
}


module.exports = {
    getAllVehicles,
    insertVehicle,
    getVehicleByPlate,
    getAllVehiclesWithReparations,
    getAllUserVehicles,
    associateVehicleToUser,
    getVehicleOwner,
    getVehicleById,
    updateVisibility,
    getVehicleAndOwner,
    insertPendingAuthorization,
    getWaitingAuthorizations,
    getVehiclesToAuthorize,
    getAuthorizedVehiclesByOwner,
    getVehicleAuthorization,
    authorizeUser,
    isVehicleInWorkshop,
    associateVehicleToWorkshop,
    getAllWorkshopsVehicles,
    deleteAuthorization
}