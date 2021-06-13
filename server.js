const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { addUser, getUser, getAllUsers } = require('./users');

server.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});

app.use(express.static(path.join(__dirname, 'public')));

// User connects to the socket.io
io.on('connection', (socket) => {
  
  socket.on('login', (data) =>{
    const user = addUser(socket.id, data.username, data.battery, data.latitude, data.longitude);
    socket.broadcast.emit('userAdded', (data));
  });

  socket.on('joinLobby', (data) => {
    console.log('Someone is asking for all users');
    socket.emit('lobbyUsers', getAllUsers());
  });

});