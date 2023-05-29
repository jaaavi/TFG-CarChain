const {Router, request} = require('express');
const nodemailer = require("nodemailer");
const { check } = require('express-validator');
const multer  = require('multer');
const { login,  register, verifyUser } = require('../controllers/auth');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")

const contractCompiler = require('../ethereum/compiler');
const ganache = require("ganache-cli");
const Web3 = require("web3");
const { getWorkshopByCif, insertWorkshop } = require('../controllers/workshop');
const { getVehicleByPlate } = require('../controllers/vehicle');
const web3 = new Web3(ganache.provider());
  
const storage = multer.diskStorage({
destination: (req, file, cb) => {
    cb(null, "public/img/usersImgs");
},
filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + '.png');
}
});

const upload = multer({ storage });
    
const router = Router();

router.post('/login', [], login);

router.post('/register', [], async (req, res) =>{
    const accounts = await deployed.getAccountsInstance();
    const contract = await deployed.getMyContractInstance();

    const {dni, plate_number ,email} = req.body;
    var msg = '';

    var vehicleBD = await getVehicleByPlate(plate_number);
    if (vehicleBD.length > 0){
        var vehicleChainOwner = await  contract.methods.getVehicleCurrentOwner('0x'+vehicleBD[0].id_chain).call();
        if (vehicleChainOwner === dni){
            const token = jwt.sign({email: email}, process.env.SECRET_JWT);

            const saltRounds = 10;
            bcrypt.genSalt(saltRounds, async (err, salt) => {
                bcrypt.hash(password, salt, async (err, hash) => {

                    var randomBytes = crypto.randomBytes(16);
                    var hexString = randomBytes.toString('hex');
                    var truncatedHexString = hexString.substring(0, 8);

                    var id_chain_user = parseInt(truncatedHexString, 16);

                    var insertNotConfirmedUser = await insertUser(vehicleBD[0].id, email, hash, token, dni, id_chain_user)

                    if (insertNotConfirmedUser){
                        var added = await contract.methods.addOwner('0x'+id_chain_user, '0x'+vehicleBD[0].id_chain).send(
                            { from: process.env.ADDRESS, gas: "1000000" }
                        );
                        
                        if(added){
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
                
                            console.log("Message sent: %s", info.messageId);
                        }else{
                            msg = 'Not possible to add user to database'
                        }
                        
                    }else{
                        msg = 'Not possible to add user to blockchain'
                    }


                    
                }); 
            });
           
        }
        

    }else{
        console.log('Error register')
    }

});


router.get('/register/confirm/:confirmationToken', [], verifyUser)

router.get('/reset-password/:confirmationToken', [], (req, res)=>{

    const {confirmationToken} = req.params;

    res.render('password-reset', {token: confirmationToken, error: false, updated: false, msg: ''} )

})

router.post('/reset-password/confirm/:confirmationToken', [], async(req, res) =>{

    const {confirmationToken} = req.params;
    const {password, passwordrpt} = req.body;
    var updated = updatePassword(confirmationToken, password, passwordrpt );

    if (updated){
        res.redirect('/login')
    }

})

router.get('/verify', async(req, res) =>{


    var user = await getUserByEmail(req.user._json.email);

    if (user.active === 1){
        res.redirect('/')
    }else{
        res.render('rol-profile', {user: req.user ,error: false, registered: false})
    }
    
    
})



module.exports = router;