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

/* =============================== ROOM VARS =============================== */

const rooms = [];

class Room {
  constructor (name) {
    this.players = [];
    this.creationTime = Date.now();
    this.name = name;
  }

  join (socket) {
    if (this.players.length >= 2)
      return console.error("The room has enough players already");
    this.players.push(socket);
    socket.emit("opponent-joined");
  }

  /**
   * has - Returns true if the socket has the current room
   *
   * @param  {Socket} socket the socket to check
   * @return {boolean}       true if the scoket is in the room's list of players
   */
  has (socket) {
    for (let i in this.players)
      if (this.players[i].id == socket.id)
        return true;
    return false;
  }

  /**
   * remove - Removes the socket from the room's list of players
   *
   * @param  {Socket} socket the socket to remove
   * @return {boolean}       true if no players remain in the room
   */
  remove (socket) {
    for (let i in this.players)
      if (this.players[i].id == socket.id)
        this.players.splice(i,1);
    return this.players.length == 0;
  }

  toObject () {
    return {
      name: this.name,
      creationTime: this.creationTime
    }
  }
}

/* ============================ EVENT HANDLERS ============================ */

io.on('connection', function(socket){
  // Notify the server that a new user has connected
  // console.log("Connection!");
  // Tell the user that they have successfully connected to the server
  // socket.emit("message", "You've successfully connected!");

  // Immediately send this socket the room data
  emitRoomData(socket);

  socket.on("create-room", (data) => {
    if (!('name' in data))
      return socket.emit("message", "Missing room name");
    const room = new Room(data.name);
    room.join(socket);
    rooms.push(room)
    // Send to all sockets the updated list
    emitRoomData();
  });

  socket.on('join-room',  (data) => {
    for (let i in rooms) {
      if (rooms[i].name != data.name)
        continue;
      rooms[i].join(socket);
      // Send to all sockets the updated list
      emitRoomData();
      break;
    }
  })


  // To add an event listener
  // socket.on(event, (data) => {});
  socket.on('disconnect', () => {
    for (let i in rooms) {
      let room = rooms[i];
      // Skip the room if this socket isn't inside
      if (!room.has(socket))
        continue;
      // Remove the player from the room
      const roomEmpty = room.remove(socket);
      if (roomEmpty) rooms.splice(i, 1);
      return;
    }
  });
});

function emitRoomData (socket) {
  const waitingRooms = rooms.filter((room) => room.players.length < 2);
  console.log(waitingRooms);
  if (!socket)
    return io.emit("rooms-data", waitingRooms.map((room) => room.toObject()));
  // Filters out all full rooms before sending the data to everyone
  socket.emit("rooms-data", waitingRooms.map((room) => room.toObject()));
}
