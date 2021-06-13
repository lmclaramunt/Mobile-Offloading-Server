const usersArray = [];

// Function used to keep track of users who have joined the server
function addUser(id, username, battery, latitude, longitude){
    const user = {id, username, battery, latitude, longitude};
    usersArray.push(user);
    return user;
}

// Find user in the Array that keeps track of users in the server
function getUser(id){
    return usersArray.find(user => user.id === id);
}

// Get all users that are currently in the server
function getAllUsers(){
    return usersArray;
}

module.exports = {
    addUser,
    getUser,
    getAllUsers
}