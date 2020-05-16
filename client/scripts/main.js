// Enum for the state of each Connect Four Square
const EMPTY = 0;
const RED   = 1;
const BLUE  = 2;

const SLOT_WIDTH = 50;
// Game Variables
let currentTurn = RED;
let currentPlayer = RED;

// Connect to the Server
const socket = io();

$(start);

function start () {
  ReactDOM.render(<ConnectFourBoard />, document.getElementById('root'));
}

/* ========================= SERVER EVENT HANDLERS ========================= */

socket.on("message", (data) => {
  console.log(data);
});


/* =========================== CLASS DEFINITIONS =========================== */


class ConnectFourSquare extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      piece: EMPTY
    };
  }

  render = () => {
    const innerCircle = <span class="connect-four-square" style={{width: SLOT_WIDTH*3/4+'px', height: SLOT_WIDTH*3/4+'px'}}></span>;
    return <td align={"center"} width={SLOT_WIDTH+'px'} height={SLOT_WIDTH+'px'}>{innerCircle}</td>;
  }
}


class ConnectFourBoard extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      rows: 6,
      cols: 7,
    }

    this.grid = new Array(this.state.rows * this.state.cols);
    this.grid.fill(<ConnectFourSquare />);

  }
  render () {
    // Generates the grid for the rest of the board
    const rows = [];
    for (let r = 0; r < this.state.rows; r++) {
      const row = [];
      for(let c = 0; c < this.state.cols; c++)
        row.push(this.grid[r*this.state.cols + c]);
      rows.push(<tr>{row}</tr>);
    }
    // Creates a row of squares
    const topRowElements = new Array(this.state.rows);
    topRowElements.fill(<td width={SLOT_WIDTH+'px'} height={SLOT_WIDTH+'px'}></td>);
    // The top row where the animation will be displayed
    const topRow = <tr class="top-row">{topRowElements}</tr>;

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
