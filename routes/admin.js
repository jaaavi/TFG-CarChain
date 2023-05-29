const {Router} = require('express');
const { check } = require('express-validator');
const { getAllVehiclesWithReparations, insertVehicle, associateVehicleToUser, getAllVehicles } = require('../controllers/vehicle');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const deployed = require('../ethereum/deploy'); //Clase singleton para compilar el contrato
const crypto = require('crypto');
const ganache = require("ganache-core");
const Web3 = require("web3");
const { getWorkshopByCif, insertWorkshop, getAllWorkshops } = require('../controllers/workshop');
const { isUserCorrect, getAllUsers, insertUser, getUserByDNI } = require('../controllers/user');
const web3 = new Web3(ganache.provider());
const nodemailer = require("nodemailer");
const { adminMiddleware } = require('../middlewares/isAdmin');


const router = Router();


router.get("/", [adminMiddleware] , (req, res)=>{
    res.redirect("/admin/users");
})

router.get("/users", [adminMiddleware], async (req, res)=>{

    var users = await getAllUsers();

    res.render("user_tab", {users: users, error: false, msg: '', registered: false});
})

router.post("/users", [adminMiddleware], async (req, res)=>{
    const {username, email, password, passwordrpt, entity_id, workshop_rol, owner_rol, dni} = req.body;
    var expReg= /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    var msg = 'Insertado correctamente';
    var error = false;
    var inserted = false;

    var user = await isUserCorrect(email);
    if (user === undefined){
        if(dni !== undefined, username !== undefined && email !== undefined && password !== undefined && passwordrpt !== undefined && entity_id !== undefined && (workshop_rol !== undefined || owner_rol !== undefined)){

            if (expReg.test(email) ){
    
                const saltRounds = 10;
                var randomBytes = crypto.randomBytes(16);
                var hexString = randomBytes.toString('hex');
                var truncatedHexString = hexString.substring(0, 8);
                var user_hash = parseInt(truncatedHexString, 16);
    
                bcrypt.genSalt(saltRounds, (err, salt) => {
                    bcrypt.hash(password, salt, async (err, hash) => {
                        
                        const token = jwt.sign({email: email}, process.env.SECRET_JWT)
                        inserted = await insertUser(entity_id, email, hash, token, workshop_rol === undefined? owner_rol: workshop_rol , dni, user_hash, username)
                        
                        if(inserted){
                            let transporter = nodemailer.createTransport({
                                host: "hostDelEmail",
                                port: 465,
                                secure: true, 
                                auth: {
                                user: 'configurar@email.es',
                                pass: 'contraseña',
                                },
                            });
                
                            let info = await transporter.sendMail({
                                from: 'emailOrigen',
                                to: email,
                                subject: "Please confirm your account",
                                html: `<h1>Email Confirmation</h1>
                                    <h2>Hello ${email}</h2>
                                    <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
                                    <a href=${process.env.LOCATION}/auth/register/confirm/${token}> Click here</a>
                                    </div>`,
                            }).catch(err => console.log(err));
                
                        }

                    });
                });
    
            }else{
                error = true;
                msg = 'Please enter a valid email'
            }
        }else{
            error = true;
            msg = 'You must fill all fields'
        }
    }

    if (error){
        res.render("user_tab", {users: [],  error: error, msg: msg, registered: inserted});
    }   
    res.redirect('/admin/users')

})


router.get("/workshops", [adminMiddleware] ,async (req, res)=>{
    
    var workshops = await getAllWorkshops();

    res.render("workshop_tab", {workshops: workshops, error: false, registered: false, msg: ''});

})

router.post("/workshops", [adminMiddleware] ,async (req, res)=>{
    const accounts = await deployed.getAccountsInstance();

    const contract = await deployed.getMyContractInstance();

    const {cif, name, direction, phone_number, city} = req.body;

    var workshop = await getWorkshopByCif(cif);
    var error = false;
    var msg = '';
    if (workshop.length === 0){
        var randomBytes = crypto.randomBytes(16);
        var hexString = randomBytes.toString('hex');
        var truncatedHexString = hexString.substring(0, 8);

        var workshop_hash = parseInt(truncatedHexString, 16);
        var insert= await insertWorkshop(workshop_hash, name, direction, phone_number, city, cif);
        if (insert){
            console.log(req.session.user)
            var registered = await contract.methods.authorizeWorkshop('0x'+req.session.user.id_chain, '0x'+workshop_hash).send(
                { from: process.env.ADDRESS, gas: "1000000" }
            );

            console.log('registrado?' + registered)
            

        }   

    }else{
        error = true;
        msg = 'Already exist'
    }

    
    res.redirect('/admin/workshops')
})

router.get("/vehicles", [adminMiddleware], async (req, res)=>{

    var vehicles = await getAllVehicles();

    res.render("vehicles_tab", {vehicles: vehicles, reparations: [1,2,3,4,5,6,7,8,9],error: false, registered: false, msg: ''});
    
})

router.post("/vehicles", [adminMiddleware],async (req, res)=>{
    const accounts = await deployed.getAccountsInstance();

    const contract = await deployed.getMyContractInstance();

    const {plate_number, owner_name, dni, make, model, matriculation_date, km, city} = req.body;
    console.log(plate_number, owner_name, dni, make, model, matriculation_date, km, city)

    var user_owner = await getUserByDNI(dni);
    console.log(user_owner)
    var randomBytes = crypto.randomBytes(16);
    var hexString = randomBytes.toString('hex');
    var truncatedHexString = hexString.substring(0, 8);
    var id_chain_vehicle = parseInt(truncatedHexString, 16);


    if (user_owner.length > 0){
        var insert_vehicle_bd = await insertVehicle(id_chain_vehicle, plate_number, make, model)
        
        var associate = associateVehicleToUser(insert_vehicle_bd, user_owner[0].id)

        if (associate){
            var insert_bc = await contract.methods.registerVehicle('0x' + id_chain_vehicle, km, '0x' + user_owner[0].id_chain, 123123132)
            .send({
                from:  process.env.ADDRESS,
                gas: 1000000
            });
            
            if(insert_bc){
                console.log(insert_bc)
            }

        }

    }

   
    res.redirect('/admin/vehicles');

})

module.exports = router;