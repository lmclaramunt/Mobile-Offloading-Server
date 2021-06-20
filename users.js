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
    for(let [key, user] of usersMap){
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
    getAdminBattery((response) => {
        if(battery > response.battery &&
            id != response.id){
            return callback(true);
        }else{
            return callback(false);
        }
    })
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
    for(let [key, user] of usersMap){
        usersArray.push(user);
    }
    return callback(usersArray);
}

module.exports = {
    addUser,
    getUsername,
    getAllUsers,
    newAdmin,
    updateAdmin,
    updateBattery
}