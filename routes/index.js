const {Router} = require('express');
const { check } = require('express-validator');
const { login } = require('../controllers/auth');
const { getVehicleByPlate, getVehicleOwner, getVehicleAuthorization } = require('../controllers/vehicle');
const {getReparationsFromVechicleId } = require('../controllers/reparation');
const contractCompiler = require('../ethereum/compiler');
const deployed = require('../ethereum/deploy'); 
const { getUserById } = require('../controllers/user');
const router = Router();

router.get("/", (req, res) => { 
  res.render("search_bar", {error: false, msg: ''})
});

router.post('/', [], async (req, res) =>{
  const accounts = await deployed.getAccountsInstance();
  const contract = await deployed.getMyContractInstance();

  const {plate_number} = req.body;

  var exist_vehicle = await getVehicleByPlate(plate_number);
  


  var authorized_user = await getVehicleAuthorization(req.session.user.id, exist_vehicle.id);

  var status = authorized_user !== undefined ? authorized_user.status : 0;

  
  if ((exist_vehicle && exist_vehicle.visibility) !== 'private' || status > 0 || req.session.user.id ===exist_vehicle.owner_id){
    var owner_id = await getVehicleOwner(exist_vehicle.id)

    var owner = await getUserById(owner_id);

    var vehicle_reparations = await getReparationsFromVechicleId(exist_vehicle.id);

    var str = '0x' + exist_vehicle.id_chain.toString();
    if (str.length < 66) { 
      let numZeros = 66 - str.length;
      let zeros = "0".repeat(numZeros);
      str = str.slice(0, 2) + str.slice(2) + zeros; 
    }
    var vehicle = await contract.methods.getVehicle('0x' + exist_vehicle.id_chain).call();
    const {reparations_ids, owners, km_history, matriculation_date, active, visibility} = vehicle;
    console.log(vehicle)
    var km_history_list = [];
    let reparations = [];
    for (const element of vehicle_reparations) {
      var str2 = '0x' + element.toString();
      if (str.length < 66) { 
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
    
    
    res.render("vehicle_table", {username: owner.username, dni: owner.dni,plate_number: plate_number, model: exist_vehicle.model, make: exist_vehicle.make,km_history: km_history_list, reparations: reparations})

  }else{
    res.render("search_bar", {error: true, msg: 'The visibility of this vehicle is private, you have to ask to the owner'})

  }



});


module.exports = router;