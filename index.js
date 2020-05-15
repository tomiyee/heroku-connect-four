// Import various packages
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require ('socket.io');
// Generates the Initial Stuff
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

// sends the user to the client index.hml file when they request the homepage
app.get('/', (request, response) => response.sendFile( __dirname + "/client/index.html"));
app.use('/css', express.static( __dirname + '/client/css'));
app.use('/scripts', express.static( __dirname + '/client/scripts'));
app.use('/client', express.static( __dirname + '/client'));

// Prepare the server.
app.set('port', PORT);

// Starts the Server
server.listen(PORT, process.env.IP || "0.0.0.0", function () {
  let addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

/* ============================ EVENT HANDLERS ============================ */

io.on('connection', function(socket){
  console.log("Connection!")

  // To add an event listener
  // socket.on(event, (data) => {});

  // To send a signal to the socket
  // socket.emit(event, data)
});

// To send a signal to all sockets
// io.sockets.emit(event, data);
