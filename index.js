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

/**
 * class Room - description
 *
 * @param  {type} name description
 * @return {type}      description
 */
class Room {

  /**
   * constructor - description
   *
   * @param  {type} name description
   * @return {type}      description
   */
  constructor (name) {
    this.players = [];
    this.creationTime = Date.now();
    this.name = name;
  }

  /**
   * join - description
   *
   * @param  {type} socket description
   * @return {type}        description
   */
  join (socket) {
    if (this.players.length >= 2)
      return console.error("The room has enough players already");
    this.players.push(socket);
    // If the room is now full, notify both players that they have an opponent
    if (this.players.length != 2)
      return;
    this.players[0].emit("opponent-joined");
    this.players[1].emit("opponent-joined");
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
   * getOpponent - If the socket is in this room, it will return the other
   * socket in the room if one exists, and null otherwise.
   *
   * @param  {type} socket description
   * @return {type}        description
   */
  getOpponent (socket) {
    if (this.players.length != 2)
      return null;
    // Returns the socket that is not the one provided
    if (this.players[0] == socket)
      return this.players[1];
    if (this.players[1] == socket)
      return this.players[0];
    return null;
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

  /**
   * toObject - description
   *
   * @return {type}  description
   */
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

  /**
   * data - description
   *
   * @param  {type} let i in rooms description
   * @return {type}                description
   */
  socket.on("create-room", (data) => {
    if (!('name' in data))
      return socket.emit("message", "Missing room name");
    const room = new Room(data.name);
    room.join(socket);
    rooms.push(room);
    socket.emit('color-assignment', {color: 'red'});
    // Send to all sockets the updated list
    emitRoomData();
  });

  /**
   * data - description
   *
   * @param  {type} let i in rooms description
   * @return {type}                description
   */
  socket.on('join-room',  (data) => {
    for (let i in rooms) {
      if (rooms[i].name != data.name)
        continue;
      rooms[i].join(socket);
      socket.emit('color-assignment', {color: 'yellow'});
      // Send to all sockets the updated list
      emitRoomData();
      break;
    }
  });

  socket.on('mouse-move', (data) => {
    // Get the room
    const room = getRoom(socket);
    if (room == null)
      return;
    // Get the opponent
    const opp = room.getOpponent(socket);
    if (opp == null)
      return;
    // forward the data from the socket to the opponent
    opp.emit ('opponent-mouse-moved', data);
  });

  socket.on('clicked', (data) => {
    // Get the room
    const room = getRoom(socket);
    if (room == null)
      return;
    // Get the opponent
    const opp = room.getOpponent(socket);
    if (opp == null)
      return;
    // forward the data from the socket to the opponent
    opp.emit ('opponent-clicked', data);
  })

  /**
   * for - description
   *
   * @param  {type} let i in rooms description
   * @return {type}                description
   */
  socket.on('disconnect', () => {
    for (let i in rooms) {
      let room = rooms[i];
      // Skip the room if this socket isn't inside
      if (!room.has(socket))
        continue;
      // Remove the player from the room
      const roomEmpty = room.remove(socket);
      if (roomEmpty) rooms.splice(i, 1);
      emitRoomData();
      return;
    }
  });
});

/**
 * getRoom - Returns the first room that contains the given socket, and returns
 * it. If no such room is found, returns null
 *
 * @param  {Socket} socket The socket object
 * @return {Room}          The first room in rooms that has the socket
 */
function getRoom(socket) {
  for (let i in rooms)
    if (rooms[i].has(socket))
      return rooms[i];
  return null;
}


/**
 * emitRoomData - description
 *
 * @param  {type} socket description
 * @return {type}        description
 */
function emitRoomData (socket) {
  const waitingRooms = rooms.filter((room) => room.players.length < 2);
  if (!socket)
    return io.emit("rooms-data", waitingRooms.map((room) => room.toObject()));
  // Filters out all full rooms before sending the data to everyone
  socket.emit("rooms-data", waitingRooms.map((room) => room.toObject()));
}
