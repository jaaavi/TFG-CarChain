const { insertUser } = require("../controllers/user");

const bcrypt = require("bcrypt")
const createAdminUser = async () =>{
    
    var username = 'admin';
    var password = 'admin';
    var entityID = 0;
    var address = 9876997;	

    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log(process.env.PORT)
            const inserted = await insertUser(entityID,username, hash, '', 'admin', '', "", 'admin');
            if (inserted){
                console.log('Admin created');  
            }else{
                console.log('Admin insertion fails');
            }   
        });   
    });


}

createAdminUser()