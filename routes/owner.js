const {Router} = require('express');
const { check } = require('express-validator');
const { login } = require('../controllers/auth');
const { getAllUserVehicles, getVehicleById, updateVisibility, getVehicleAndOwner, insertPendingAuthorization, getWaitingAuthorizations, getVehiclesToAuthorize, authorizeUser, getAuthorizedVehiclesByOwner, deleteAuthorization } = require('../controllers/vehicle');
const deployed = require('../ethereum/deploy'); 
const { getReparationsFromVechicleId } = require('../controllers/reparation');
const { userLogged } = require('../middlewares/isUserLogged');

const router = Router();


router.get("/", [userLogged] ,async (req, res) => { 

  if (req.session.user !== undefined){
    	  
    var vehicles = await getAllUserVehicles(req.session.user.id);
    var waitingAuthorizations = await getWaitingAuthorizations(req.session.user.id)
    var vehiclesAuthorizedByOwner = await getAuthorizedVehiclesByOwner(req.session.user.id)
    var vehiclesToAuthorize = await getVehiclesToAuthorize(req.session.user.id)
    
    console.log(waitingAuthorizations)
    res.render("account", {user: req.session.user, vehicles: vehicles, waitingAuthorizations: waitingAuthorizations, vehiclesAuthorizedByOwner: vehiclesAuthorizedByOwner, vehiclesToAuthorize: vehiclesToAuthorize, reparations: [], success: false})
  
  }else{
    res.redirect('/login')
  }

 });

 router.get("/visibility", [userLogged] ,async (req, res) => { 
  const contract = await deployed.getMyContractInstance();

  const {id, visibility} = req.query;
  console.log(id)
  var success = false;
  var vehicle = await getVehicleById(id)

  var updated = await updateVisibility(visibility === 'private' ? 'public' : 'private', id);

  if (updated){
    var str1 = '0x' + req.session.user.id_chain.toString();
    if (str1.length < 66) { 
      let numZeros = 66 - str1.length;
      let zeros = "0".repeat(numZeros);
      str1 = str1.slice(0, 2) + str1.slice(2) + zeros; 
    }
    var str2 = '0x' + vehicle.id_chain.toString();
    if (str2.length < 66) { 
      let numZeros = 66 - str2.length;
      let zeros = "0".repeat(numZeros);
      str2 = str2.slice(0, 2) + str2.slice(2) + zeros;
    }
    var insert_bc = await contract.methods.setVisibility(str1, str2, visibility === 'private' ? 'public' : 'private')
      .send({
          from: process.env.ADDRESS,
          gas: 1000000
      });
    success = insert_bc;
    

    
  }

  res.redirect("/account")
 });

 router.get("/reparations", [userLogged] ,async (req, res) => { 
  const contract = await deployed.getMyContractInstance();

  const {id} = req.query;
  var vehicle = await getVehicleById(id)
  var success = false;
  var vehicle_reparations = await getReparationsFromVechicleId(id)

  if (vehicle_reparations.length > 0){
    var str = '0x' + vehicle.id_chain.toString();
    var km_history_list = [];
    var reparations = [];
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
    

    console.log(reparations)
  }

  var vehicles = await getAllUserVehicles(req.session.user.id);
  var waitingAuthorizations = await getWaitingAuthorizations(req.session.user.id)
  var vehiclesAuthorizedByOwner = await getAuthorizedVehiclesByOwner(req.session.user.id)
  var vehiclesToAuthorize = await getVehiclesToAuthorize(req.session.user.id)
  
  res.render("account", {user: req.session.user, vehicles: vehicles, waitingAuthorizations: waitingAuthorizations, reparations: reparations !== undefined ? reparations: [], vehiclesAuthorizedByOwner: vehiclesAuthorizedByOwner, vehiclesToAuthorize: vehiclesToAuthorize, success: false})
 });


router.post('/askAuth', [userLogged] , async (req, res)=>{
  const {plate_number} = req.body;

  console.log(plate_number)

  var vehicleAndOwner = await getVehicleAndOwner(plate_number);


  if (vehicleAndOwner !== undefined){
    var insertAuthorization = await insertPendingAuthorization(vehicleAndOwner.owner_id, vehicleAndOwner.id, req.session.user.id)
    console.log(insertAuthorization)
  }
  

  res.redirect("/account")

});

router.get('/auth', [userLogged] , async (req, res)=>{
  const {id, vehicle_id} = req.query;

  console.log(id)

  var authorized = await authorizeUser(req.session.user.id, vehicle_id, id)


  res.redirect("/account")

});

router.get('/deleteAuth', [userLogged] , async (req, res)=>{

  const {id} = req.query;

  if (id !== undefined){
    var deleted = await deleteAuthorization(id)
  }


  res.redirect("/account")

});

module.exports = router;