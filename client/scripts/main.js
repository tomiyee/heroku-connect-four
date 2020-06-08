// Enum for the state of each Connect Four Square
const EMPTY   = null;
const RED     = "red";
const YELLOW  = "yellow";
const TEMP_R  = "temp-red";
const TEMP_Y  = "temp-yellow";

const SLOT_WIDTH = 50;
// Game Variables
let currentTurn = RED;
let currentPlayer = RED;

// Connect to the Server
const socket = io();

let root;
let rooms;
let game;

$(start);

/**
 * start - description
 *
 * @return {type}  description
 */
function start () {
  // Renders the React Objects
  rooms = ReactDOM.render(<Rooms />, document.getElementById('room-root'));
  game = ReactDOM.render( <ConnectFourBoard />, document.getElementById('root'));
  $('#root').hide();
}

/**
 * calculateWinner - description
 *
 * @param  {type} squares description
 * @param  {type} rows=6  description
 * @param  {type} cols=7  description
 * @param  {type} len=4   description
 * @return {type}         description
 */
function calculateWinner(squares, rows=6, cols=7, len=4) {

  // horizontal lines
  for (let r = 0; r < rows; r++) {
    for (let offset = 0; offset < cols-len+1; offset++){
      // Condition 1, the first square must not be empty
      if (squares[r*cols+offset] == null)
        continue;
      // Condition 2, the rest of the squares must match
      let match = true;
      for (let c = 0; c < len-1; c++) {
        if (squares[r*cols+offset + c] !== squares[r*cols+offset + c+1]) {
          match = false;
          break;
        }
      }
      if (match) return squares[r*cols+offset];
    }
  }

  // vertical lines
  for (let c = 0; c < cols; c++) {
    for (let offset = 0; offset < rows-len+1; offset++){
      // Condition 1, the first square must not be empty
      if (squares[offset*cols+c] == null)
        continue;
      // Condition 2, the rest of the squares must match
      let match = true;
      for (let r = 0; r < len-1; r++) {
        if (squares[(r+offset)*cols + c] !== squares[(r+offset+1)*cols + c]) {
          match = false;
          break;
        }
      }
      if (match) return squares[offset*cols+c];
    }
  }

  // Down-Right Diagonal Lines
  for (let c = 0; c < cols-len+1; c++) {
    for (let r = 0; r < rows-len+1; r++) {
      // Condition 1, the first square must not be empty
      if (squares[r*cols + c] == null)
        continue;
      // Condition 2, the rest of the squares must match
      let match = true;
      for (let offset = 0; offset < len-1; offset++) {
        if(squares[(r+offset)*cols+(c+offset)] !== squares[(r+offset+1)*cols+(c+offset+1)]) {
          match = false;
          break;
        }
      }
      if (match) return squares[r*cols + c];
    }
  }

  // Up-Right Diagonal Lines
  for (let r = len-1; r < rows; r++) {
    for (let c = 0; c < cols-len+1; c++) {
      // Condition 1, the first square must not be empty
      if (squares[r*cols + c] == null)
        continue;
      // Condition 2, the rest of the squares must match
      let match = true;
      for (let offset = 0; offset < len-1; offset++) {
        if(squares[(r-offset)*cols+(c+offset)] !== squares[(r-offset-1)*cols+(c+offset+1)]) {
          match = false;
          break;
        }
      }
      if (match) return squares[r*cols + c];
    }
  }

  return null;
}

/**
 * createRoom - description
 *
 * @return {type}  description
 */
function createRoom () {
  // Fetch the value of and empty the room name input
  const roomName = $('.create-room-input').val();
  if (roomName.length == 0) return;
  $('.create-room-input').val('');

  // If the name isn't empty, send a create room request
  socket.emit('create-room', {'name': roomName});
  $('#room-root').hide();
  $('#root').show();
}

/**
 * joinRoom - description
 *
 * @param  {type} roomName description
 * @return {type}          description
 */
function joinRoom (roomName) {
  socket.emit('join-room', {'name': roomName});
  $('#room-root').hide();
  $('#root').show();
  game.setState({hasOpponent:true});

}

/* ========================= SERVER EVENT HANDLERS ========================= */

socket.on("message", (data) => {
  console.log(data);
});

socket.on("rooms-data", (data) => {
  console.log("Room Data has been received");
  // sorts the rooms in order of oldest to newest
  const sorted = data.sort((a,b) => a.creationTime - b.creationTime);
  if (rooms)
    rooms.setState({"rooms": sorted});
});

socket.on('opponent-joined', () => {
  game.setState({hasOpponent:true});
})

// Event called whenever the opponent clicked on the grid
socket.on("opponent-clicked", (squareR, squareC) => {

});

// Event called whenever the opponent moved their mouse accross the grid
socket.on("opponent-mouse-moved", (squareR, squareC) => {

});

/* =========================== CLASS DEFINITIONS =========================== */

/**
 * class CreateRoom - description
 *
 * @param  {type} props description
 * @return {type}       description
 */
class CreateRoom extends React.Component {
  constructor (props) {
    super(props);
  }

  keyDownHandler (e, i) {
    // Only respond to ENTER
    if (e.keyCode != 13)
      return;
    createRoom();
  }

  render () {
    return (
      <div class='create-room'>
        <input class='create-room-input' onKeyDown={(e) => this.keyDownHandler(e, this)}/>
        <button class='create-room-button' onClick={createRoom}>Create a Room</button>
      </div>
    );
  }
}

/**
 * class Rooms - description
 *
 * @param  {type} props description
 * @return {type}       description
 */
class Rooms extends React.Component {

  constructor (props) {
    super(props);
    // Using the ref attribute, I can call methods of the Rooms class
    this._child = React.createRef();
    // The initial state
    this.state = {
      rooms: []
    };
  }

  render () {
    return (
      <center>
        <div class='rooms-container'>
          <div class='rooms-list-container'>
            <table class='rooms-list'>
              <tr>
                <th>Existing Rooms</th>
                <th>Players</th>
              </tr>
              {this.state.rooms.map((room) => (
                <tr
                  class='room-data'
                  onClick={() => joinRoom(room.name)}
                >
                  <td>{room.name}</td>
                  <td>1/2</td>
                </tr>)
              )}
            </table>
          </div>
          <CreateRoom />
        </div>
      </center>
    );
  }
}

/**
 * class ConnectFourSquare - description
 *
 * @param  {type} props description
 * @return {type}       description
 */
class ConnectFourSquare extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      piece: EMPTY
    };
  }

  render = () => {
    const dimensions = {
      width: SLOT_WIDTH*3/4+'px',
      height: SLOT_WIDTH*3/4+'px'
    }
    const classes = ["connect-four-square"];
    if (this.props.value != null) {
      classes.push(this.props.value);
    }

    const innerCircle = (
      <span
        className={classes.join(' ')}
        style={dimensions}
      >
      </span>);
    return (
      <td
        align={"center"}
        width={SLOT_WIDTH+'px'}
        height={SLOT_WIDTH+'px'}
        onClick={this.props.onClick}
        onMouseMove={this.props.onMouseMove}
      >
        {innerCircle}
      </td>);
  }
}

/**
 * class ConnectFourBoard - description
 *
 * @param  {type} props description
 * @return {type}       description
 */
class ConnectFourBoard extends React.Component {
  constructor (props) {
    super(props);

    const r = this.props.rows || 6;
    const c = this.props.cols || 7;

    this.state = {
      hasOpponent: false,
      rows: r,
      cols: c,
      grid: new Array(r*c).fill(EMPTY),
      redTurn: true,
      mouseCol: -1,
    }
  }

  /**
   * getValue - Returns the value of the square at the row and colum. The row
   * is 0 at the top and increases downwards. The col is 0 at the left and
   * increases to the right.
   *
   * @param {number} r - An integer representing the row of the square
   * @param {number} c - An integer representing the col of the square
   * @returns {EMPTY|RED|YELLOW} Enum for the square's state
   */
  getValue (r, c) {
    // Catch Cases where r,c is out of range
    if (r < 0 || r > this.state.rows-1)
      throw new Error(`Row ${r} is out of range.`);
    if (c < 0 || c > this.state.cols-1)
      throw new Error(`Col ${c} is out of range.`);
    // Return the value of the cell
    return this.state.grid[r*this.state.cols+c];
  }

  /**
   * getFirstEmpty - Returns the first cell in the column that is empty, checks
   * in decreasing order. Returns -1 if the column is full.
   *
   * @param {number} c - An integer representing the col of the square
   * @returns {number} The largest row in the column that is EMPTY
   */
  getFirstEmpty (c) {
    const takenValues = [RED, YELLOW];
    for (let r = this.state.rows-1; r >= 0; r --)
      if (takenValues.indexOf(this.getValue(r, c)) == -1)
        return r;
    return -1;
  }

  /**
   * clickHandler - Handles whenever the mouse clicks on a square.
   *
   * @param  {number} squareR The row of the square that got clicked on
   * @param  {number} squareC The column of the square that got clicked on
   */
  clickHandler (squareR, squareC) {
    console.log(`Clicked: ${squareR}, ${squareC}`);

    // The coordinates for the bottom most square
    const c = squareC;
    const r = this.getFirstEmpty(c);

    // Ignore if the player clicked on a full column
    if (r == -1) return;

    // Make a copy of the current grid
    const grid = this.state.grid.slice();
    // Mutate the copy of the current grid
    grid[r*this.state.cols+c] = this.state.redTurn ? RED : YELLOW;
    // Update the state to reflect the changes in state
    this.setState({
      "grid": grid,
      "redTurn": !this.state.redTurn
    });
  }

  /**
   * mouseMoveHandler - Handles whenever the mouse moves accross the board
   *
   * @param  {number} squareRow The row of the square that the mouse is on
   * @param  {number} squareCol The col of the square that the mouse is on
   */
  mouseMoveHandler (squareRow, squareCol) {
    // Ignore the event if the col has remained unchanged
    if (this.state.mouseCol == squareCol) return;

    // The coordinates for the bottom most square
    const c = squareCol;
    const r = this.getFirstEmpty(squareCol);

    // Make a copy of the current grid
    const grid = this.state.grid.slice();
    // Mutate the copy of the current grid
    if (this.state.mouseCol != -1) {
      const prevCol = this.state.mouseCol;
      const prevRow = this.getFirstEmpty(prevCol);
      grid[prevRow*this.state.cols+prevCol] = EMPTY;
    }
    grid[r*this.state.cols+c] = this.state.redTurn ? TEMP_R : TEMP_Y;
    // Update the mouseCol to the new Column
    this.setState({
      "grid": grid,
      "mouseCol": squareCol
    });
  }


  render () {
    // Creates a row of squares
    const topRowElements = new Array(this.state.rows);
    topRowElements.fill(<td width={SLOT_WIDTH+'px'} height={SLOT_WIDTH+'px'}></td>);
    // The top row where the animation will be displayed
    const topRow = <tr class="top-row">{topRowElements}</tr>;

    // Generates the grid for the rest of the board
    const rows = [];
    for (let r = 0; r < this.state.rows; r++) {
      const row = [];
      for(let c = 0; c < this.state.cols; c++){
        const square =
          <ConnectFourSquare
            value={this.state.grid[r*this.state.cols+c]}
            onClick={() => this.clickHandler(r, c)}
            onMouseMove={() => this.mouseMoveHandler(r, c)}
          />;
        row.push(square);
      }
      rows.push(<tr>{row}</tr>);
    }

    // Returns the constructed React Component
    return (
      <center>
        <table class="connect-four" cellspacing={0}>
          {topRow}
          {rows}
        </table>
      </center>
    );
  }
}
