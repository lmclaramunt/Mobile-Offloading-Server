const { response } = require('express');
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { addUser, 
  getAllUsers,
  newAdmin, 
  updateAdmin,
  getUsername,
  updateBattery,
  filterServants,
  getNumServant
  } = require('./users');

server.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});

app.use(express.static(path.join(__dirname, 'public')));

// Map to keep track of server that have connected
// Initially everyone will be a in this map
const servantsMap = new Map();

// To keep track of who the admin is when the service starts
let admin = null;

let sessionStarted = false;

// User connects to the socket.io
io.on('connection', (socket) => {
  socket.on('login', (data) =>{
    if(!sessionStarted){
      addUser(socket.id, data.username, data.battery, 
        data.latitude, data.longitude, (err, response) => {
          if(err){
            socket.emit('login results', {results: false});   // User not able to login
          }else if(!response){ 
            // User won't be admin by defaul when added to the Map, unless is the first one
            // So let's check if he/she should be the new admin 
            newAdmin(socket.id, data.battery, (newAdmin, response) => {  
              if(newAdmin){   
                // It's been confirmed that the new user should be the new admin, so update the Map and user's
                updateAdmin(socket.id, () => {
                  // Let other know about new user, who is the admin
                  socket.broadcast.emit('userAdded', ({ ...data, admin: true}));        
                });              
              }else{
                // The admin has not changed
                socket.broadcast.emit('userAdded', ({...data, admin: false}));
              }
            });
            socket.emit('login results', {results: true});
            servantsMap.set(socket.id, socket);
          }else{
            // If it's the first user to login, then it will definetely be assigned the admin role
            socket.broadcast.emit('userAdded', ({...data, admin: true}));
            socket.emit('login results', {results: true});
            servantsMap.set(socket.id, socket);
          }
        });
    }else{
      socket.emit('lobby closed', '');
    }
  });

  socket.on('joinLobby', () => {
    getAllUsers((users) => {
      socket.emit('lobbyUsers', users);
    });
  });

  socket.on('battery change', (battery) => {
    updateBattery(socket.id, battery, () => {     
      newAdmin(socket.id, battery, (newAdmin, response) => {
        if(newAdmin){   
          // It's been confirmed that there should be a new admin, update the map
          updateAdmin(response.id, () => {
              // Let other users know that the user whose batter changed is now the admin
              getUsername(response.id, (err, response) => {
                if(!err){
                  console.log('Update admin');
                  socket.emit('update admin', {username: response});
                  socket.broadcast.emit('update admin', {username: response});
                }
              });               
          });              
        }
        getUsername(socket.id, (err, response) => {
          // Update user values, battert is the only one that has changed
          if(!err){
            var userVal = {
              username: response,
              battery: battery
            };      
            console.log('Update user');
            socket.emit('update user', (userVal));
            socket.broadcast.emit('update user', (userVal));
          }
        });       
      });
    });    
  });

  // Once the master is done writing the matrices
  socket.on('start master', () => {
    admin = socket;
    filterServants(socket.id, (response)=> {
      for(let [key, servant] of servantsMap){
        if(response.includes(key)){
          servant.emit('rejected', '');
          servantsMap.delete(key);
        }else{
          servant.emit('go servant', {id: key});
        }
      }
    });
    socket.emit('go admin', {servants: servantsMap.size});
    sessionStarted = true;
  });

  socket.on('new matrices', (data) => {
    var firstMatrix = JSON.parse(data[0]);
    var secondMatrix = JSON.parse(data[1]);
    var firstRows = data[2];
    var secondRows = data[3];
    var secondColumns = data[4];
    var distributed = data[5];
    if(distributed){
      var numServants = getNumServant();
      var rowsPerServant = firstRows/numServants;
      var servantRows = [];
      var servants = [];
      var s = 0;
      for(let [key, value] of servantsMap){
        if(key !== socket.id){
          servants.push(value);
        }
      }
      for(var i = 0; i < firstMatrix.length; i++){
        servantRows.push(firstMatrix[i]);
        if((i+1)%rowsPerServant === 0){
          var matricesInfo = {
            finalRows: rowsPerServant,
            secondRows: secondRows,
            secondColumns: secondColumns,
            firstMatrix: servantRows,
            secondMatrix: secondMatrix,
            firstRow: i-(i%rowsPerServant),
            lastRow: i 
          };
          servants[s].emit('servant matrices', matricesInfo);
          servantRows = [];
          s++;
        }
      }
    }else{
      // Master does not distribute matrices among the servants
      // Sends entire matrices to each servant, for testing purposes
      var matricesInfo = {
        firstColumns: secondRows,
        secondColumns: secondColumns,
        firstMatrix: firstMatrix,
        secondMatrix: secondMatrix
      }
      for(let [key, servant] of servantsMap){
        if(key !== socket.id){
          servant.emit('servant test', matricesInfo);
        }
      }
    }
  });

  // Servants sent back their results from matrix multiplication
  // Give results to the master
  socket.on('multiplication result', (data) => {
    admin.emit('partial results', (data));
  });

  // TODO: disconnect
});