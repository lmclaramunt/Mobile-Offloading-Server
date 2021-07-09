const { response } = require("express");

const usersMap = new Map();

// Function used to keep track of users who have joined the server
function addUser(id, username, battery, latitude, longitude, callback){
    newName(username, (response) => {
       if(!response){
        return callback(true, false);
       }else{
        const admin = (usersMap.size === 0) ? true : false; 
        const user = {
            username: username,
            battery: battery,
            latitude: latitude,
            longitude: longitude,
            admin: admin
        };
        usersMap.set(id, user);
        return callback(false, admin);  
       }
    });
}

// Check if a name is new in the Map
function newName(name, callback){
    for(let [, user] of usersMap){
        if (name === user.username){
            return callback(false);
        }
    }
    return callback(true);
}


// Find user in the Map 
function getUsername(id, callback){
    if(usersMap.has(id)){
        return callback(false, usersMap.get(id).username);
    }else{
        return callback(true, null);
    }
}

// Check if there should be a new admin based on battery level
function newAdmin(id, battery, callback){    
    getAdminBattery((response) =>{
        if(response.id === id){
            getMaxBattery((response) => {
                if(battery < response.battery){
                    return callback(true, {id: response.id, battery: response.battery});
                }else{
                    return callback(false, null);
                }
            });
        }else if(battery > response.battery){
            return callback(true, {id: id, battery: battery});
        }else{
            return callback(false, null);
        }
    });     
}

// Get max battery in the Map
function getMaxBattery(callback){
    var maxBattery = 0;
    var maxUserId = 0;
    for(let [key, user] of usersMap){
        if(user.battery > maxBattery){
            maxBattery = user.battery;
            maxUserId = key;
        }
    }
    return callback({id: maxUserId, battery: maxBattery});
}

// Get user with max battery, it should be the admin 
function getAdminBattery(callback){
    var adminBattery = 0;
    var adminUser = 0;
    for(let [key, user] of usersMap){
        if(user.admin){
            adminBattery = user.battery;
            adminUser = key;
        }
    }
    return callback({id: adminUser, battery: adminBattery})
}

// Update who is the admin
function updateAdmin(newAdminId, callback){
    for(let [key, user] of usersMap){
        user.admin = (key === newAdminId) ? true: false;
    }
    return callback();
}

// Update the battery for a user
function updateBattery(id, battery, callback){
    for(let [key, user] of usersMap){
        if(key === id){
            user.battery = battery;
        }
    }
    return callback();
}

// Get all users that are currently in the server
function getAllUsers(callback){
    const usersArray = [];
    for(let [, user] of usersMap){
        usersArray.push(user);
    }
    return callback(usersArray);
}

// Get the users who will server as servants
// They must be within one km of the admin and with at least 20% of battery
function filterServants(admin_id, callback){
    const uselessServants = [];
    getAdminLocation((err, response) => {
        if(!err){
            const admin_latitude = response.latitude;
            const admin_longitutde = response.longitude;
            for(let [key, user] of usersMap){
                userWithinRange(admin_latitude, admin_longitutde, user.latitude, 
                    user.longitude, (response) => {
                        if(key === admin_id || user.battery < 20 || !response){
                            uselessServants.push(key);
                            usersMap.delete(key);  
                        }
                });
            }
        }
    });
    
    return callback(uselessServants);
}

// Get the location (latitude and longitude) of the admin user
function getAdminLocation(callback){
    for(let [, user] of usersMap){
        if(user.admin){
            return callback(false, {latitude: user.latitude, longitude: user.longitude});
        }
    }
    return callback(true, null);
}

// Check if a user is within range of the admin (1 km)
function userWithinRange(admin_lat, admin_long, serv_lat, serv_long, callback){
    const earthRadius = 6371;
    const distLat = toRadians(admin_lat-serv_lat);     // In radians
    const distLong = toRadians(admin_long-serv_long);
    const a = Math.pow(Math.sin(distLat/2), 2) +
        Math.cos(toRadians(admin_lat)) * Math.cos(toRadians(serv_lat)) *
        Math.pow(Math.sin(distLong/2),2);
    const c = 2 * Math.atan(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadius * c; 
    if(distance > 0.1){
        return callback(false);
    }else{
        return callback(true);
    }
}

// Convert a degree to radians
function toRadians(degrees){
    return degrees * (Math.PI/180);
}

// Get number of remaining servants
function getNumServant(){
    return usersMap.size;
}

module.exports = {
    addUser,
    getUsername,
    getAllUsers,
    newAdmin,
    updateAdmin,
    updateBattery,
    getAdminBattery,
    filterServants,
    getNumServant
}