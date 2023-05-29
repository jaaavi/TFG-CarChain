const {Router} = require('express');
const contractCompiler = require('../ethereum/compiler'); //Clase singleton para compilar el contrato
const deployed = require('../ethereum/deploy'); //Clase singleton para compilar el contrato

const { check } = require('express-validator');
const { getVehicleByPlate, insertVehicle, isVehicleInWorkshop, associateVehicleToWorkshop, getAllWorkshopsVehicles, getVehicleById } = require('../controllers/vehicle');
const crypto = require('crypto');
const { insertReparation, insertReparationXVehicle, getReparationsFromVechicleId, getReparationsFromWorkshop, getReparationsFromVechicleIdAndWorshop } = require('../controllers/reparation');
const { getVehicleXworkshop, insertvehicleXworkshop, getWorkshopById } = require('../controllers/workshop');

const router = Router();


router.get('/', async (req, res) =>{
    const contract = await deployed.getMyContractInstance();

    var workshop;;
    var workshop_entity_id
    if (req.session.user !== undefined && req.session.user.rol === 'workshop'){
            workshop = await getWorkshopById(req.session.user.entity_id)
            workshop_entity_id = req.session.user.entity_id;
            console.log(workshop)
            var vehicles = await getAllWorkshopsVehicles(workshop_entity_id)
            var vehicle_reparations = await getReparationsFromWorkshop(workshop_entity_id)
            var reparations = [];
            for (const vehicle of vehicles) {
                var str = '0x' + vehicle.id_chain.toString();
                if (str.length < 66) { // 42 porque "0x" cuenta como dos caracteres
                  let numZeros = 66 - str.length;
                  let zeros = "0".repeat(numZeros);
                  str = str.slice(0, 2) + str.slice(2) + zeros; // inserta los ceros después de "0x"
                }
                var vehicleChain = await contract.methods.getVehicle('0x' + vehicle.id_chain).call();
                const {reparations_ids, owners, km_history, matriculation_date, active, visibility} = vehicleChain;
                var km_history_list = [];
                for (const element of vehicle_reparations) {
                  var str2 = '0x' + element.toString();
                  if (str.length < 66) { // 66 porque "0x" cuenta como dos caracteres
                    let numZeros = 66 - str.length;
                    let zeros = "0".repeat(numZeros);
                    str = str.slice(0, 2) + str.slice(2) + zeros; 
                  }
                  const reparation = await contract.methods.getVehicleReparation(str, str2).call();
                  const { security_hash, km, date, description, revision_type } = reparation;
            
                  var mili_to_date = new Date(date);
            
                  reparations.push({ security_hash, km, mili_to_date, description, revision_type });
                  km_history_list.push({value: km, date: new Date(parseInt(date)).toLocaleDateString('en-US')})
            
                }
          
              }


            res.render('workshops', {name: workshop.name, responsible: req.session.user.username, workshop_id: workshop_entity_id,user: req.session.user, vehicles: vehicles, reparations: reparations, msg: '', registered: false, error: false});

    }else{
        res.redirect('/login')
    }


});

router.post( "/", async (req, res)=>{

    const accounts = await deployed.getAccountsInstance();
    // console.log(accounts)
    //Crea una instancia del contrato mandando el abi del contrato, el bytecode y el gas
    const contract = await deployed.getMyContractInstance();
    //Tener en cuenta el gas que debe de consumir el contrato

    //Prueba de llamada a un metodo del contrato que devuelve "Hola"
    // console.log(await contract.methods.sayHello().call())
   
    //Coge del fomulario los datos de la reparación;
    const {plate_number, manufacturer, model, km, revision_type, description} = req.body;

    //Variable global del id del taller
    var workshop_entity_id = req.session.user.entity_id;

    //Compruebo si existe el vehículo en BD con la matrícula dada
    var vehicle = await getVehicleByPlate(plate_number);



    var vehicle_id = vehicle.id;

    // console.log(vehicle)
    //Crea el hash unico para cada reparación usando los atributos de la misma
    const hash = crypto.createHash('md5');
    hash.update(plate_number + manufacturer + model + km + revision_type + description);
    var reparation_id_chain_security = hash.digest().slice(0, 4).readUInt32BE(0)

    //Comprueba si el vehículo ya estaba asociado con el taller
    var vehicleInWorkshop = await isVehicleInWorkshop(vehicle.id, req.session.user.entity_id)
    console.log('Vehicle in workshop ?' + vehicleInWorkshop)
    //Si no está lo inserta
    if (!vehicleInWorkshop){
        console.log('ayyyyy')
        var associateVehicleWorkshop = await associateVehicleToWorkshop(workshop_entity_id, vehicle_id);
        console.log(associateVehicleWorkshop)

    }

    //Crea el código de acceso a esa reparación, identificador que tendrá la blockchain
    var randomBytes = crypto.randomBytes(16);
    var hexString = randomBytes.toString('hex');
    var truncatedHexString = hexString.substring(0, 8);
    const id_chain_reparation = parseInt(truncatedHexString, 16);
    var timestamp = new Date().getTime();

    console.log(vehicle_id + 'idvehiculoasignado')
    //Inserciones reparation a BD
    var reparation_id = await insertReparation(id_chain_reparation);
    if (reparation_id > 0){
        var relationInsert = await insertReparationXVehicle(reparation_id, vehicle_id, workshop_entity_id)
        if (relationInsert){
            var vehicleAlreadyExists = await getVehicleXworkshop(vehicle_id, workshop_entity_id)
            if (!vehicleAlreadyExists) await insertvehicleXworkshop(vehicle_id, workshop_entity_id)
            console.log('Reparation insertada correctamente bd')
        }
    }else {
        console.log('No se ha podido insertar la reparación')
    }
    
    //Inserciones a la blockchain

    var registered = await contract.methods.registerVehicleReparation('0x'+vehicle.id_chain, '0x'+id_chain_reparation, '0x' + reparation_id_chain_security, km, timestamp, description, revision_type)
    .send({
        from: process.env.ADDRESS,
        gas: 1000000
    })

    console.log(registered)
    var error = false;
    if (registered){
        msg = 'Reparación añadida correctamente chain';
        console.log(msg)
    }else{
        error = true;
        msg = 'No se ha podido añadir reparación';
    }

    var vehicles = await getAllWorkshopsVehicles(workshop_entity_id)
    var reparations = await getReparationsFromWorkshop(workshop_entity_id)


    // res.render('workshops', {workshop_id: workshop_entity_id, vehicles: vehicles, reparations: reparations, msg: msg, registered: registered, error: error});
    res.redirect('/workshop')

})

router.get('/reparations', async (req, res) =>{
    //Crea una instancia del contrato mandando el abi del contrato, el bytecode y el gas
    const contract = await deployed.getMyContractInstance();
    //Compruebo si existe el vehículo en BD con la matrícula dada
    const {vehicle_id} = req.query;
    console.log(vehicle_id)
    const {plate_number} = req.body;
    console.log(plate_number)

    var vehicle_reparations = [];
    var reparationsBC = [];
    //Búsqueda con botón
    if (vehicle_id !== undefined){
        vehicle_reparations = await getReparationsFromVechicleIdAndWorshop(vehicle_id, req.session.user.entity_id);
        let vehicle = await getVehicleById(vehicle_id);
        var str = '0x' + vehicle.id_chain.toString();
        if (str.length < 66) { // 42 porque "0x" cuenta como dos caracteres
          let numZeros = 66 - str.length;
          let zeros = "0".repeat(numZeros);
          str = str.slice(0, 2) + str.slice(2) + zeros; // inserta los ceros después de "0x"
        }
        var vehicleChain = await contract.methods.getVehicle('0x' + vehicle.id_chain).call();
        const {reparations_ids, owners, km_history, matriculation_date, active, visibility} = vehicleChain;
        var km_history_list = [];
        let reparations = [];
        for (const element of vehicle_reparations) {
          var str2 = '0x' + element.toString();
          if (str.length < 66) { // 66 porque "0x" cuenta como dos caracteres
            let numZeros = 66 - str.length;
            let zeros = "0".repeat(numZeros);
            str = str.slice(0, 2) + str.slice(2) + zeros; 
          }
          const reparation = await contract.methods.getVehicleReparation(str, str2).call();
          const { security_hash, km, date, description, revision_type } = reparation;
    
          var mili_to_date = new Date(date);
    
          reparations.push({ security_hash, km, mili_to_date, description, revision_type });
          km_history_list.push({value: km, date: new Date(parseInt(date)).toLocaleDateString('en-US')})
    
        }
        reparationsBC = reparations;
        console.log(reparations)
    //Búsqueda con input
    }else if (plate_number !== undefined){
        
        var vehicle = await getVehicleByPlate(plate_number);

        if (vehicle !== undefined){

            //Saco todos los id_chain de las reparaciones
    
            reparations = await getReparationsFromVechicleId(vehicle.id)
    
            //Por cada id que saca, consultamos a la blockchain por las caracterísicas de la reparacion
            reparations.forEach(async r_id => {
                console.log(r_id)
                console.log(await contract.methods.getVehicleReparation('0x'+vehicle.id_chain, '0x'+r_id).call())
            });
    
        }else {
            console.log('No existe un vehicle con la matrícula => ' + plate_number)
        }
    }


    var vehicles = await getAllWorkshopsVehicles(req.session.user.entity_id)
    
    var workshop = await getWorkshopById(req.session.user.entity_id)
    res.render('workshops', {name: workshop.name, responsible: req.session.user.username, workshop_id: req.session.user.entity_id,user: req.session.user, vehicles: vehicles, reparations: reparationsBC, msg: '', registered: false, error: false});
 
    
  
 });

router.post('/workshop', async (req, res) =>{

   const {nombre, direccion} = req.body

    var inserted = await insertTaller(nombre, direccion);

    if (inserted){
        res.redirect('/taller')
    }

});


module.exports = router;