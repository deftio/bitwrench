# Example 5: Tic-Tac-Toe

Tests: game state, derived state (win detection), conditional updates,
reset, two-player interaction. This is the React tutorial example --
let's see how the same thing feels in bitwrench.

---

## The game

```javascript
function makeTicTacToe() {
  var cells = [];
  for (var i = 0; i < 9; i++) {
    cells.push({
      t: 'button', a: {
        class: 'ttt-cell',
        onclick: (function(idx) {
          return function() { cellClick(this, idx); };
        })(i)
      },
      c: ''
    });
  }

  return {
    t: 'div', a: { class: 'ttt-game' },
    c: [
      { t: 'div', a: { class: 'ttt-status' }, c: "X's turn" },
      { t: 'div', a: { class: 'ttt-board' }, c: cells },
      { t: 'button', a: {
        class: 'ttt-reset',
        onclick: function() { resetGame(this); }
      }, c: 'New Game' }
    ],
    o: {
      type: 'tic-tac-toe',
      state: {
        board: [null, null, null, null, null, null, null, null, null],
        turn: 'X',
        winner: null,
        moveCount: 0
      },
      slots: { status: '.ttt-status' },
      handle: {
        play: function(el, index) {
          var state = el._bw_state;
          // Ignore if game over or cell taken
          if (state.winner || state.board[index]) return;

          // Update state
          state.board[index] = state.turn;
          state.moveCount++;

          // Update cell DOM
          var cells = el.querySelectorAll('.ttt-cell');
          cells[index].textContent = state.turn;
          cells[index].classList.add('ttt-played');

          // Check winner
          state.winner = checkWinner(state.board);

          if (state.winner) {
            el.bw.setStatus(state.winner + ' wins!');
            highlightWin(el, state.board, state.winner);
          } else if (state.moveCount === 9) {
            el.bw.setStatus('Draw!');
          } else {
            state.turn = (state.turn === 'X') ? 'O' : 'X';
            el.bw.setStatus(state.turn + "'s turn");
          }
        },

        reset: function(el) {
          var state = el._bw_state;
          state.board = [null, null, null, null, null, null, null, null, null];
          state.turn = 'X';
          state.winner = null;
          state.moveCount = 0;

          var cells = el.querySelectorAll('.ttt-cell');
          cells.forEach(function(cell) {
            cell.textContent = '';
            cell.classList.remove('ttt-played', 'ttt-winner');
          });

          el.bw.setStatus("X's turn");
        },

        // For bw.update() smart dispatch
        update: function(el, data) {
          if (data.play !== undefined) el.bw.play(data.play);
          if (data.reset) el.bw.reset();
        }
      }
    }
  };
}

function cellClick(btn, index) {
  var game = btn.closest('.bw_is_component_bccl_tic_tac_toe');
  if (game) game.bw.play(index);
}

function resetGame(btn) {
  var game = btn.closest('.bw_is_component_bccl_tic_tac_toe');
  if (game) game.bw.reset();
}

function checkWinner(board) {
  var lines = [
    [0,1,2], [3,4,5], [6,7,8],  // rows
    [0,3,6], [1,4,7], [2,5,8],  // cols
    [0,4,8], [2,4,6]             // diagonals
  ];
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0], b = lines[i][1], c = lines[i][2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function highlightWin(el, board, winner) {
  var lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  var cells = el.querySelectorAll('.ttt-cell');
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0], b = lines[i][1], c = lines[i][2];
    if (board[a] === winner && board[b] === winner && board[c] === winner) {
      cells[a].classList.add('ttt-winner');
      cells[b].classList.add('ttt-winner');
      cells[c].classList.add('ttt-winner');
    }
  }
}
```

---

## Usage

```javascript
var game = bw.mount('#app', makeTicTacToe());

// Play programmatically
game.bw.play(4);  // X plays center
game.bw.play(0);  // O plays top-left
game.bw.play(8);  // X plays bottom-right

// Via bw.update
bw.update(game, { play: 2 });

// Reset
game.bw.reset();

// Via bwserve (two players on different machines)
// Player 1 sends: conn.send({ type: 'update', ref: '.bw_is_component_bccl_tic_tac_toe', data: { play: 4 } })
// Player 2 sees the move appear
```

---

## CSS (palette-driven)

```javascript
var palette = bw.loadStyles(themeConfig).palette;

bw.injectCSS(bw.css({
  '.ttt-board': {
    display: 'grid',
    'grid-template-columns': 'repeat(3, 80px)',
    gap: '4px'
  },
  '.ttt-cell': {
    width: '80px',
    height: '80px',
    'font-size': '32px',
    'font-weight': '700',
    border: '1px solid ' + palette.dark.border,
    'background-color': palette.surface,
    cursor: 'pointer'
  },
  '.ttt-cell:hover:not(.ttt-played)': {
    'background-color': palette.primary.light
  },
  '.ttt-played': {
    cursor: 'default'
  },
  '.ttt-winner': {
    'background-color': palette.success.light,
    color: palette.success.base
  },
  '.ttt-status': {
    'font-size': '18px',
    'font-weight': '600',
    padding: '8px 0'
  }
}), { id: 'ttt-styles' });
```

---

## Comparison with React tutorial

The React tic-tac-toe tutorial (reactjs.org) builds the same game.
Let's compare the patterns:

### State management

**React:**
```jsx
const [squares, setSquares] = useState(Array(9).fill(null));
const [xIsNext, setXIsNext] = useState(true);

function handleClick(i) {
  const nextSquares = squares.slice();
  nextSquares[i] = xIsNext ? 'X' : 'O';
  setSquares(nextSquares);
  setXIsNext(!xIsNext);
}
```

**bitwrench:**
```javascript
handle: {
  play: function(el, index) {
    var state = el._bw_state;
    state.board[index] = state.turn;
    var cells = el.querySelectorAll('.ttt-cell');
    cells[index].textContent = state.turn;
    state.turn = (state.turn === 'X') ? 'O' : 'X';
  }
}
```

React: immutable state, copy array, call setter, framework re-renders.
bitwrench: mutate state directly, update specific DOM node, no re-render.

React is more "correct" in the functional programming sense (immutable
updates enable time-travel debugging). bitwrench is more direct (change
the thing, update the display). Both work. bitwrench is fewer lines and
no framework overhead. React has undo/redo for free via state history.
bitwrench would need explicit history tracking for that feature.

### Component structure

**React:** Three components -- Game, Board, Square. Square is a pure
component that receives value and onClick as props. Board renders 9
Squares. Game manages state and renders Board + status.

**bitwrench:** One component. The board cells are plain DOM (buttons),
not separate components. Game state, rendering, and event handling
are all in one handle namespace.

Is this worse? For tic-tac-toe, no. The cells don't have independent
state or behavior -- they're display elements. Making each cell a
component adds complexity without benefit. The React tutorial splits
them for pedagogical reasons (teaching component composition), not
because the problem demands it.

For a chess game where each piece has complex behavior, you might want
piece components. bitwrench supports that (each piece is a TACO with
o.handle). But start simple -- add components when they earn their keep.

### Event handling

**React:** onClick prop passed through from Game -> Board -> Square.
Three layers of prop drilling.

**bitwrench:** onclick on the button, closest() to find the game
component, call handle method. One hop. No prop drilling.

### Conditional rendering

**React:** `{winner ? 'Winner: ' + winner : 'Next: ' + (xIsNext ? 'X' : 'O')}`
in JSX. Template conditional.

**bitwrench:** `el.bw.setStatus(state.winner + ' wins!')` or
`el.bw.setStatus(state.turn + "'s turn")`. Just an if/else in JS.
No template language needed.

### Reset

**React:** Lift state up, pass reset callback down. Or use key prop to
force re-mount.

**bitwrench:** `el.bw.reset()`. Mutate state, update DOM. Done.

---

## Ergonomics verdict

**Good:**
- One component for the whole game. Clean, readable, no unnecessary
  abstraction.
- Direct DOM updates (cells[index].textContent = 'X') are fast and clear.
  No diffing, no reconciliation.
- el.bw.play(index) from any context: click handler, programmatic, bwserve.
- Reset is trivial: loop through cells, clear them.
- CSS from palette. Grid layout. Standard.
- Total code: ~120 lines (including helpers). React tutorial: ~200 lines
  (excluding framework boilerplate).

**Not an issue (despite appearances):**
- Direct DOM manipulation inside handle methods. This IS the bitwrench
  pattern. The component owns its rendering. querySelectorAll('.ttt-cell')
  inside the handle is like Win32 GetDlgItem() inside a message handler.
  Normal.

**Would be an issue at larger scale:**
- No undo/redo. React's immutable state approach gives this for free.
  bitwrench would need explicit state history. For tic-tac-toe, not needed.
  For a document editor, yes. This is a real trade-off.
- No automatic re-render. Every state change requires explicit DOM update.
  For 9 cells, trivial. For a complex form with 50 fields, more work.
  But: handle methods colocate state change + DOM update. You write it
  once, in one place. The React approach (change state, re-render
  everything, diff to find what changed) is more convenient but heavier.
