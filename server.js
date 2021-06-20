const { response } = require('express');
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { addUser, getAllUsers,
  newAdmin, updateAdmin, getUsername, updateBattery
   } = require('./users');

server.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});

app.use(express.static(path.join(__dirname, 'public')));

// User connects to the socket.io
io.on('connection', (socket) => {
  
  socket.on('login', (data) =>{
    addUser(socket.id, data.username, data.battery, 
      data.latitude, data.longitude, (err, response) => {
        if(err){
          socket.emit('login results', {results: false});   // User not able to login
        }else if(!response){ 
          // User won't be admin by defaul when added to the Map, unless is the first one
          // So let's check if he/she should be the new admin 
          newAdmin(socket.id, data.battery, (response) => {  
            if(response){   
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
        }else{
          // If it's the first user to login, then it will definetely be assigned the admin role
          socket.broadcast.emit('userAdded', ({...data, admin: true}));
          socket.emit('login results', {results: true});
        }
      });
  });

  socket.on('joinLobby', (data) => {
    getAllUsers((users) => {
      socket.emit('lobbyUsers', users);
    });
  });

  socket.on('battery change', (battery) => {
    getUsername(socket.id, (err, response) => {
      if(!err){
        const username = response;
        updateBattery(socket.id, battery, () => {
          var userVal = {
            username: username,
            battery: battery
          };
          newAdmin(socket.id, battery, (response) => {
            if(response){   
              // It's been confirmed that there should be a new admin, update the map
              updateAdmin(socket.id, () => {
                 // Let other sers know user whose batter changed is now the admin
                 socket.emit('update user', {...userVal, admin: true});
                 socket.broadcast.emit('update user', {...userVal, admin: true});
              });              
            }else{
              // Update user values, battert is the only one that has changed
              socket.emit('update user', {...userVal, admin: false});
              socket.broadcast.emit('update user', {...userVal, admin: false});
            }
          });
        });
      }
    });
    
  });

});