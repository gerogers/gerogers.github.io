// vi:se ts=50 sw=4 ai ml:
// %W% %E%

"use strict";

const strVers = "0.92";
const strMagic = "GoMoKu02";
const canvas = document.getElementById("canvasId");
const helper = document.getElementById("helperId");
helper.hidden = true;
const ctx = canvas.getContext('2d');
let btnGroup = document.getElementById("btn-group");
const MAX_DIM = 19;
const MAX_LIM = MAX_DIM * MAX_DIM;
const MAX_RC = MAX_DIM + MAX_DIM - 1;   // max diagonals
const UNPLAYED = 0;
const PLAYER_X = 1;
const PLAYER_O = 2;
const UNDO_PLAY = 3;
const RECENT_O = 4;
const BLANK = 5;
const IMPLICIT = 6;
const IMPLICIT1 = 7;
const IMPLICIT2 = 8;
const NO_PLAY = 0xffff;
const FIRST_PLAY = 0xfffe;
const MAX_PLAYER = PLAYER_O;
const SWITCH_PLAYERS = (PLAYER_X ^ PLAYER_O);
const EDGE = (PLAYER_X | PLAYER_O);
const DIRECTIONS = 4;

// flags set in status array
const PLAY_ATTACK       = 1;
const PLAY_DEFEND       = 2;
const PLAY_PARTDEFEND   = 4;
const PLAY_SG           = 8;

const borderTxtCols = "abcdefghijklmnoprstu";
const borderTxtRows = "ABCDEFGHIJKLMNOPRSTU";
const lookup_5 =
    [   2, 4, 4, 6, 4, 6, 6, 8, 4, 6, 6, 8, 6, 8, 8,10,
        4, 6, 6, 8, 6, 8, 8,10, 6, 8, 8,10, 8,10,10, 0];

const clrBorder = "#700070";
const clrBoard = "#c0ffc0";
const clrGrid = "#000";
const clrSelected = "#ffffc0";
const clrDeselected = "lightGray";
const clrPlayX = "#000";
const clrPlayO = "#f00";
const clrLastO = "#ff8080";
const clrLastORing = "#f00";
const clrMatch = "lightGray";
const clrWin = "magenta";
const clrBlank = "white";

let cols = MAX_DIM;
let rows = MAX_DIM;
let w;
let h;
let ch = " ";
let twoPlayer = false;
let player;         // of next move
let winner;         // 0 if not yet won
let undoneWinner;   // allows restoration on redo
let winX;           // x co-ord of winning piece
let winY;           // y co-ord of winning piece
let loadAction;     // which action after reading data
let maxSGId;        // next sub-goal Id
let viewX;          // 4 views of X plays
let viewO;          // 4 views of O plays
let values;         // by player and index
let nodeCount;      // by player, direction and index
let passAllowed;    // state of pass button
let undoAllowed;    // state of undo button
let redoAllowed;    // state of redo button
let sizeHist;       // number of entries in history
let firstMove;      // index of first move
let lastMove;       // index of last move
let lastUndo;       // index of last undone move
let prevMove;       // index to previous move
let nextMove;       // index to next move
let prevUndo;       // index to previous undo
let status;         // flags for played positions
let score;          // holds pattern score for a point
let allow6;         // permit more than 5 in a row
let crLim;          // index used for first move passed
let historyShowing = false;
let SGsShowing = false;
let saving = false;
let loading = false;
let xCoOrds = [0, 0, 0, 0];
let yCoOrds = [0, 0, 0, 0];

// drawing dimensions
let penWidth;
let xo;         // defines border width
let yo;         // defines border depth
let unX;        // x unit size
let unY;        // y unit size
let pceOffX;    // x offset for drawing pieces
let pceOffY;    // y offset for drawing pieces
let pceDimX;    // x dimension of piece
let pceDimY;    // y dimension of piece
let y0txt;      // y for top row font base
let y1txt;      // y for bottom row font base
let x0txt;       // x from board edge to text edge
let x1txt;       // x from board edge to text edge
let metrics;
let iWidth;
let iHeight;

class pointScore {
    constructor(XArray, OArray, adjacency) {
        this.fourByteX = XArray;
        this.fourByteO = OArray;
        this.adj = adjacency;
    }

    orderA(array) {
        let a = array[0] & 0xf;
        let b = array[1] & 0xf;
        let c = array[2] & 0xf;
        let d = array[3] & 0xf;
        let p;

        if (a < d) {
            p = a; a = d; d = p;
        }
        if (b < c) {
            p = b; b = c; c = p;
        }
        if (a < b) {
            p = a; a = b; b = p;
        }
        if (c < d) {
            p = c; c = d; d = p;
        }
        if (b < c) {
            p = b; b = c; c = p;
        }

        return ((a << 12) | (b << 8) | (c << 4) | d);
    }

    orderI(p) {
        let a = (p & 0xf000) >>> 12;
        let b = (p & 0x0f00) >>> 8;
        let c = (p & 0x00f0) >>> 4;
        let d = (p & 0x000f);

        if (a < d) {
            p = a; a = d; d = p;
        }
        if (b < c) {
            p = b; b = c; c = p;
        }
        if (a < b) {
            p = a; a = b; b = p;
        }
        if (c < d) {
            p = c; c = d; d = p;
        }
        if (b < c) {
            p = b; b = c; c = p;
        }

        return ((a << 12) | (b << 8) | (c << 4) | d);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class ar5 {
    constructor() {
        this.next = null;
        this.i5 = [ 0, 0, 0, 0, 0 ];
    }
}

class ar10 {
    constructor() {
        this.next = null;
        this.i10 = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    }
}

class lineElement {
    constructor() {
        this.el = [ 0, 0, 0, 0 ];
    }

    copy(pE1) {
        this.el[0] = pE1.el[0];
        this.el[1] = pE1.el[1];
        this.el[2] = pE1.el[2];
        this.el[3] = pE1.el[3];
    }

    swap(pE1) {
        let hold;
        for (let i = 0; i < 4; i++) {
            hold = this.el[i];
            this.el[i] = pE1.el[i];
            pE1.el[i] = hold;
        }
    }

    addElement(newNode, thisNode) {
        let i;
        let j;

        // first look to see if newnode is already present
        for (i = 0; i < 4; i++) {
            if (newnode == el[i]) {
                return;      // node already present
            }
        }

        // now look to see if thisNode labels this direction
        for (i = 0; i < 4; i++) {
            if (thisNode == el[i]) {
                // yes, so change it to the supplied newNode
                // ASSERT ((i == 0) && (el[1] == 0))
                if ((i != 0) || (el[1] != 0)) {
                    console.log(
                        "Direction with own node is not only node label");
                }

                el[i] = newNode;
                return;
            }
        }

        // finally find correct place to slot in newNode
        for (i = 0; i < 4; i++) {
            if (el[i] == 0) {
                el[i] = newNode;
                return;
            }

            if (newNode < el[i]) {
                // move existing entries up
                for (j = 3; j > i; j--) {
                    el[j] = el[j - 1];
                }

                el[i] = newNode;
                return;
            }
        }
    }
}

class lineList {
    constructor() {
        let i;
        this.list = new Array(4);

        for (i = 0; i < 4; i++) {
            list[i] = new lineElement();
        }
    }

    emptyList() {
        let i;
        let j;
        let lim = list[0].el.length;

        for (i = 0; i < 4; i++) {
            for (j = 0; j < lim; j++) {
                list[i].el[j] = 0;
            }
        }
    }
    
    copy(ll) {
        let i;
        let j;
        let lim = list[0].el.length;

        for (i = 0; i < 4; i++) {
            for (j = 0; j < lim; j++) {
                list[i].el[j] = ll.list.el[j];
            }
        }
    }
}

let ar5Pool = null;       // pool of int[5] objects
let ar10Pool = null;      // pool of int[10] objects

function getAr5() {
    let ar;

    if (ar5Pool != null) {
        ar = ar5Pool;
        ar5Pool = ar.next;
        ar.next = null;
    } else {
        ar = new ar5();
    }

    return (ar);
}

function freeAr5(ar) {
    if (ar != null) {
        ar.next = ar5Pool;
        ar5Pool = ar;
    }
}

function getAr10() {
    let ar;

    if (ar10Pool != null) {
        ar = ar10Pool;
        ar10Pool = ar.next;
        ar.next = null;
    } else {
        ar = new ar10();
    }

    return (ar);
}

function freeAr10(ar) {
    if (ar != null) {
        ar.next = ar10Pool;
        ar10Pool = ar;
    }
}

// The representation of played pieces is optimised for extracting
// 5-patterns in different directions.
// Four separate arrays are maintained for the view in the four
// playing directions. For each direction there is a row of int,
// each int comprising a bit-map of played X or played O.
// The bit-maps include "guard" bits permitting regions beyond the
// playing area to be examined without violating bounds.
// The board edges are indicated by both an X and O piece, this
// results in an apparent piece of the wrong colour blocking any
// pattern being checked beyond the edge.
function setup() {
    if (rows > MAX_DIM) {
        rows = MAX_DIM;
    }
    if (cols > MAX_DIM) {
        cols = MAX_DIM;
    }

    enablePass(true);
    enableUndo(false);
    enableRedo(false);

    // until we add machine plays, set two player
    setTwoPlayer(true);

    crLim = cols * rows;
    allow6 = false;
    sizeHist = 0;
    firstMove = NO_PLAY;
    lastMove = NO_PLAY;
    viewX = new Array(DIRECTIONS);
    viewO = new Array(DIRECTIONS);
    viewX[0] = new Array(MAX_DIM);      // horizontal view     -
    viewO[0] = new Array(MAX_DIM);
    viewX[1] = new Array(MAX_DIM);      // vertical view       |
    viewO[1] = new Array(MAX_DIM);
    viewX[2] = new Array(MAX_RC);       // diagonal view       /
    viewO[2] = new Array(MAX_RC);
    viewX[3] = new Array(MAX_RC);       // other diagonal view \
    viewO[3] = new Array(MAX_RC);

    prevMove = new Array(MAX_LIM + 1);
    nextMove = new Array(MAX_LIM + 1);
    prevUndo = new Array(MAX_LIM + 1);
    status = new Array(MAX_LIM);
    values = new Array(MAX_PLAYER + 1);
    values[UNPLAYED] = null;
    values[PLAYER_X] = new Array(MAX_LIM);
    values[PLAYER_O] = new Array(MAX_LIM);
    nodeCount = new Array(MAX_PLAYER + 1);
    nodeCount[UNPLAYED] = null;
    nodeCount[PLAYER_X] = new Array(DIRECTIONS);
    nodeCount[PLAYER_O] = new Array(DIRECTIONS);
    for (let dir = 0; dir < DIRECTIONS; dir++) {
        nodeCount[PLAYER_X][dir] = new Array(MAX_LIM);
        nodeCount[PLAYER_O][dir] = new Array(MAX_LIM);
    }

    score = new pointScore([0,0,0,0], [0,0,0,0], 0);
    resetHistory();
    resetBoard();
    assessWholeBoard();
}

function resetHistory() {
    // set each entry in the history arrays to NO_PLAY
    for (let index = 0; index < crLim; index++) {
        prevMove[index] = NO_PLAY;
        nextMove[index] = NO_PLAY;
    }

    prevMove[crLim] = NO_PLAY;
    nextMove[crLim] = NO_PLAY;
    if (historyShowing) {
        updateRightView();
    }
}

function cancelWinner() {
    winner = 0;
}

function resetBoard() {
    let index;
    let rc = rows + cols - 1;       // number of diagonal lines

    player = PLAYER_X;
    winner = 0;
    undoneWinner = 0;
    redoAllowed = false;
    document.getElementById("redoId").disabled = true;
    lastUndo = NO_PLAY;

    for (index = 0; index < crLim; index++) {
        prevUndo[index] = NO_PLAY;
        status[index] = 0;
    }

    prevUndo[crLim] = NO_PLAY;

    // set up the edge of board markers
    let markers = (1 << 4) | (1 << (cols + 5));

    for (index = 0; index < rows; index++) {
        viewX[0][index] = markers;
        viewO[0][index] = markers;
    }

    markers = (1 << 4) | (1 << (rows + 5));

    for (index = 0; index < cols; index++) {
        viewX[1][index] = markers;
        viewO[1][index] = markers;
    }

    // left diagonal (i.e. the diagonal with negative slope)
    for (index = 0; (index < rows) && (index < cols); index++) {
        markers = (1 << (cols - index + 3)) | (1 << (cols + 5));
        viewX[2][index] = markers;
        viewO[2][index] = markers;
    }

    for (index = rows; index < cols; index++) {
        markers = (1 << (cols - index + 3)) | (1 << (rc - index + 5));
        viewX[2][index] = markers;
        viewO[2][index] = markers;
    }

    markers = (1 << 4) | (1 - (cols + 5));

    for (index = cols; index < rows; index++) {
        viewX[2][index] = markers;
        viewO[2][index] = markers;
    }

    for (index = rows > cols ? rows : cols; index < rc; index++) {
        markers = (1 << 4) | (1 << (rc - index + 5));
        viewX[2][index] = markers;
        viewO[2][index] = markers;
    }

    // right diagonal
    for (index = 0; index < rows && index < cols; index++) {
        markers = (1 << 4) | (1 << (index + 6));
        viewX[3][index] = markers;
        viewO[3][index] = markers;
    }

    for (index = rows; index < cols; index++) {
        markers = (1 << (index - rows + 5)) | (1 << (index + 6));
        viewX[3][index] = markers;
        viewO[3][index] = markers;
    }

    markers = (1 << 4) | (1 << (cols + 5));

    for (index = cols; index < rows; index++) {
        viewX[3][index] = markers;
        viewO[3][index] = markers;
    }

    for (index = rows > cols ? rows : cols; index < rc; index++) {
        markers = (1 << (index - rows + 5)) | (1 << (cols + 5));
        viewX[3][index] = markers;
        viewO[3][index] = markers;
    }
}

function getNextMove(curMove) {
    return nextMove[curMove];
}

function drawBoard(ctx) {
    let i;

    ctx.fillStyle = clrBorder;
    ctx.fillRect(0, 0, w, h);
    ctx.font = "15px Arial";
    let metricsCaps = ctx.measureText("R");
    let metricsLower = ctx.measureText("m");
    let iUpCaps = metricsCaps.actualBoundingBoxAscent;
    let iDownCaps = metricsCaps.actualBoundingBoxDescent;
    let iHeightCaps = iUpCaps + iDownCaps;
    let iWidthCaps = metricsCaps.actualBoundingBoxRight -
                        metricsCaps.actualBoundingBoxLeft;
    let iUpLower = metricsLower.actualBoundingBoxAscent;
    let iDownLower = metricsLower.actualBoundingBoxDescent;
    let iHeightLower = iUpLower + iDownLower;
    let iWidthLower = metricsLower.actualBoundingBoxRight -
                        metricsLower.actualBoundingBoxLeft;
    unX = Math.floor(w / (cols + 4));
    unY = Math.floor(h / (rows + 4));

    // choose to keep points on a square matrix
    if (unX < unY) {
        unY = unX;
    } else {
        unX = unY;
    }

    penWidth = 2;
    xo = Math.floor((w - penWidth - (cols - 1) * unX) / 2);
    yo = Math.floor((h - penWidth - (rows - 1) * unY) / 2);
    y0txt = Math.floor((yo - (unY + unY/2 - iHeightLower) / 2) - iDownLower);
    y1txt = Math.floor(y0txt + (rows - 1) * unY + unY + unY/2);
    x0txt = Math.floor((unX + iWidthCaps) / 2);
    x1txt = Math.floor((unX + iWidthCaps) / 2 + (cols - 1) * unX);
    pceOffX = -Math.floor((unX * 3) / 8);
    pceOffY = -Math.floor((unY * 3) / 8);
    pceDimX = -Math.floor(pceOffX * 2 + (penWidth & 1));
    pceDimY = -Math.floor(pceOffY * 2 + (penWidth & 1));
    ctx.fillStyle = clrBoard;
    ctx.fillRect(xo - unX - Math.floor(unX/2), yo - unY - Math.floor(unY/2),
        (cols + 2) * unX, (rows + 2) * unY);

    // add grid
    ctx.fillStyle = clrGrid;

    for (i = 0; i < cols; i++) {
        ctx.fillRect(xo - Math.floor(penWidth/2) + i * unX,
                     yo - Math.floor(penWidth/2),
                     penWidth,
                     (rows - 1) * unY + penWidth);
    }

    for (i = 0; i < rows; i++) {
        ctx.fillRect(xo - Math.floor(penWidth/2),
                     yo - Math.floor(penWidth/2) + i * unY,
                     (cols - 1) * unX + penWidth,
                     penWidth);
    }

    // add co-ordinate markers
    ctx.strokeStyle = clrGrid;

    for (i = 0; i < cols; i++) {
        let ch = borderTxtCols.charAt(i);
        metrics = ctx.measureText(ch);
        iWidth = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
        ctx.fillText(ch, xo + i * unX - iWidth/2, y0txt);
        ctx.fillText(ch, xo + i * unX - iWidth/2, y1txt);
    }

    for (i = 0; i < rows; i++) {
        let ch = borderTxtRows.charAt(i);
        metrics = ctx.measureText(ch);
        iWidth = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
        iHeight = metrics.actualBoundingBoxAscent +
                      metrics.actualBoundingBoxDescent;
        ctx.fillText(ch, xo - x0txt - iWidth/2, yo + i * unY + iHeight/2);
        ctx.fillText(ch, xo + x1txt - iWidth/2, yo + i * unY + iHeight/2);
    }

    player = PLAYER_X; 
    let sh = getFirstMove();
    
    if (sh != NO_PLAY) {
        do {
            if (sh != cols * rows) {
                // not a passed (first) move
                displayMove(ctx, sh % cols, Math.floor(sh / cols), player);
            }

            player ^= SWITCH_PLAYERS;
            sh = getNextMove(sh);
        } while (sh != NO_PLAY);
    }

    if (getWinner() != 0) {
        displayWin(ctx);
    }
}

function closeAllBut(id) {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        let thisDrop = dropdowns[i];
        if ((thisDrop.id != id) && (thisDrop.classList.contains("show"))) {
            thisDrop.classList.remove("show");
        }
    }
}

function actions() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
}

function redoWin(col, row) {
    if ((col == winX) && (row == winY)) {
        winner = undoneWinner;
        return true;
    }

    return false;
}

function cancelPass() {
    player = PLAYER_X;
    enablePass(true);
    undoAllowed = false;
    enableUndo(false);

    if (!redoAllowed) {
        redoAllowed = true;
        enableRedo(true);
    }
}

function load() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
    if (saving) {
        return;
    }
    loading = true;
    const inputDiv = document.getElementById("inputDiv");
    inputDiv.hidden = false;
}

function readDataFile() {
    const file = document.querySelector("#inputId").files[0];
    let str = typeof file;
    if (str.localeCompare("undefined") == 0) {
        document.getElementById("inputDiv").hidden = true;
        loading = false;
        return;
    }
    const reader = new FileReader();
    let strData;
    reader.onload = function(event) {
        strData = event.target.result;
        let inputForm = document.getElementById("fileForm");
        inputForm.reset();

        document.getElementById("inputDiv").hidden = true;
        restore(strData);
    };
    reader.onerror = err => confirm(err);
    reader.readAsText(file);
}

function fnAbortLoad() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
    loading = false;
    document.getElementById("inputDiv").hidden = true;
}

function restore(dataString) {
    let c = 0;
    let r = 0;
    let x;
    let y;
    let indx = 0;
    let prev;
    let next;
    let first = NO_PLAY;
    let last = NO_PLAY;
    let lines = dataString.split("\n");

    if (!lines[0].startsWith(strMagic)) {
        confirm("Saved file doesn't begin: " + strMagic);
    } else {
        let i;
        let line;
        // curently skip SGs in saved game
        for (line = 1; line < lines.length; line++) {
            if (lines[line].trim().endsWith(".")) {
                break;
            }
        }
        if (line == lines.length) {
            confirm(`Saved file has no line ending "."`);
        } else {
            // get columns and rows
            let str = lines[++line].trim();
            if ((str.length != 4) || isNaN(str)) {
                confirm("4 digits for cols and rows not found");
            } else {
                let n = parseInt(str);
                c = Math.floor(n / 100);
                r = n % 100;
                if ((c < 5) || (c > MAX_DIM) || (r < 5) || (r > MAX_DIM)) {
                    confirm(`Dimensions not between 5 and ${MAX_DIM}`);
                    return;
                }

                // Build a new history array. If all entries are valid, then
                // exchange it for the current one.
                prev = new Array(MAX_LIM + 1);
                next = new Array(MAX_LIM + 1);
                let lim = c * r;
                let sz = 0;

                for (i = 0; i <= lim; i++) {
                    prev[i] = NO_PLAY;
                    next[i] = NO_PLAY;
                }

                for (line++; line < lines.length; line++) {
                    str = lines[line].trim();
                    for (i = 0; i < str.length; i += 2) {
                        if (indx == NO_PLAY) {
                            confirm('saved game is corrupt (stopped short)');
                            return;
                        }
                        x = borderTxtCols.indexOf(str.charAt(i));
                        y = borderTxtRows.indexOf(str.charAt(i + 1));
                        if ((x < 0) || (x > c) || (y < 0) || (y > r) ||
                            ((y == r) && (x > 0) && (x < c))) {
                            confirm(`saved game corrupt at line ${line}, ` +
                                `char ${i} or ${i + 1}`);
                            return;
                        }

                        if ((x == c) && (y == r)) {
                            indx = NO_PLAY;
                            continue;
                        }

                        indx = y * c + x;

                        if ((prev[indx] != NO_PLAY) || (last == indx)) {
                            confirm(`Saved position loops, index = ${i}`);
                            return;
                        }

                        prev[indx] = last;

                        if (first == NO_PLAY) {
                            first = indx;
                        } else {
                            next[last] = indx;
                        }

                        last = indx;
                        sz++;
                    }
                }

                if (indx != NO_PLAY) {
                    confirm('Saved position is incorrectly terminated');
                    return;
                }

                cols = c;
                rows = r;
                firstMove = first;
                lastMove = last;
                prevMove = prev;
                prev = null;
                nextMove = next;
                next = null;
                resetBoard();
                sizeHist = sz;

                // replay everything in history
                i = 0;
                for (   indx = first;
                        (indx != NO_PLAY) && (i++ < sz - 1);
                        indx = nextMove[indx]) {
                    if (!undoAllowed) {
                        // previously disabled, allow undo button
                        enableUndo(true);
                        enablePass(false);
                    }

                    y = Math.floor(indx / cols);
                    x = indx % cols;
                    addToBoard(x, y);
                }

                y = Math.floor(indx / cols);
                x = indx % cols;
                cancelRedoList();

                if (indx == NO_PLAY) {
                    // no moves restored, disable undo button
                    if (undoAllowed) {
                        enableUndo(false);
                        enablePass(true);
                    }
                } else {
                    if (indx != rows * cols) {
                        // if not a pass, see if last move will be a winner
                        checkForWin(x, y);
                    }

                    addToBoard(x, y);
                    assess(x, y);
                }

                /*
                if ((player == PLAYER_O) && winner == 0)) {
                    // set 2 player mode
                }
                */

                drawBoard(ctx);
            }
        }
    }

    loading = false;
    if (historyShowing || SGsShowing) {
        const rtDiv = document.getElementById("rtDivId");
        rtDiv.hidden = false;
        boardChanged();
    }

}

function save() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
    if (loading) {
        return;
    }
    saving = true;

    if (historyShowing || SGsShowing) {
        const rtDiv = document.getElementById("rtDivId");
        rtDiv.hidden = true;
    }
    const saveDiv = document.getElementById("saveDiv");
    if (saveDiv.hidden) {
        saveDiv.hidden = false;
    }
    const text2Lbl = document.getElementById("text2Lbl");
    text2Lbl.innerHTML = "&nbsp;&nbsp;Copy text below and paste into a file";
    const textarea = document.getElementById("rtTA2");
    textarea.rows = 23;
    textarea.cols = 50;
    textarea.value = "GoMoKu02\r\n.\r\n" + makeHistory();
}

function level() {
    closeAllBut("levelDrop");
    document.getElementById("levelDrop").classList.toggle("show");
}

function lvlMin() {
    alert("lvlMin");
}

function lvlMed() {
    alert("lvlMed");
}

function lvlTricky() {
    alert("lvlTricky");
}

function options() {
    closeAllBut("optionsDrop");
    document.getElementById("optionsDrop").classList.toggle("show");
}

function brdDims() {
    alert("brdDims");
}

function fiveARow() {
    alert("fiveARow");
}

function logSGsSeen() {
    alert("logSGsSeen");
}

function log3waySGs() {
    alert("log3waySGs");
}

function help() {
    if (canvas.hidden) {
        helper.hidden = true;
        canvas.hidden = false;
    } else {
        closeAllBut("helpDrop");
        document.getElementById("helpDrop").classList.toggle("show");
    }
}

function getHelpFile(fileName) {
        helper.innerHTML = `<iframe class "iframe" src="${fileName}" 
        width="${canvas.width}" height="${canvas.height}"></iframe>\n`;
}

function GomokuHelp() {
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
    let cw = canvas.width;
    let ch = canvas.height;
    canvas.hidden = true;
    helper.hidden = false;
    helper.width = cw;
    helper.height = ch;

    getHelpFile("helpIndex.html");
}

function helpAbout() {
    confirm("Gomoku version " + strVers + ". " +
    "Copyright (c) Graham Rogers, 2024");
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
}

function fnNewGame() {
    console.log("NewGame");
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
    setup();
    resize();
}


function cancelRedoList() {
    // Rub-out last undo index and reassess
    lastUndo = NO_PLAY;
    enableRedo(false);
    assessWholeBoard();
}

function fnPass() {
    if (getLastMove() == NO_PLAY) {
        console.log("pass");
        enablePass(false);
        cancelRedoList();    // new played move, so cancel redo sequence
        playPiece(0, rows);

        /*
        // The player has passed, so we'd better make a move
        if (!twoPlayer) {
            chooseMove();
        }
        */
        updateRightView();
    }
}

function fnUndo() {
    let cancelled = undoHistory();

    if (cancelled != NO_PLAY) {
        if (cancelled == cols * rows) {
            // cancelling a pass
            console.log("undo pass");
            cancelPass();
            updateRightView();
            return;
        }

        let cnCol = cancelled % cols;
        let cnRow = Math.floor(cancelled / cols);
        console.log("undo [" + borderTxtCols.charAt(cnCol) +
                               borderTxtRows.charAt(cnRow) + "]");

        // if this is cancelling a win, rub out the line through the
        // winning pieces
        let winner = getWinner();

        if (winner == PLAYER_O || winner == PLAYER_X) {
            console.log("Undo winning move");
            cancelWinner();
            undoPlay(cancelled);
            drawBoard(ctx);    // the easy way is to redraw everything
        } else {
            undoPlay(cancelled);
            displayMove(ctx, cnCol, cnRow, UNDO_PLAY);
        }

        // Don't reassess the area around the unplayed piece at this stage.
        // Redo may be chosen to replay the piece, in which case the
        // history of why the move was chosen can be left intact.
        // The reassessment needs deferring until a new move is made when
        // there are redoable moves available.

        // In two player mode, only undo one play. Also,
        // if PLAYER_X (not the program) just won, and now wishes to tease
        // by withdrawing it, only undo his play.
        if (!twoPlayer && winner != PLAYER_X) {
            cancelled = undoHistory();

            if (cancelled != NO_PLAY) {
                if (cancelled == cols * rows) {
                    cancelPass();
                } else {
                    undoPlay(cancelled);
                    cnCol = cancelled % cols;
                    cnRow = Math.floor(cancelled / cols);
                    console.log("and undo [" + borderTxtCols.charAt(cnCol) +
                                     borderTxtRows.charAt(cnRow) + "]");
                    displayMove(ctx, cnCol, cnRow, UNDO_PLAY);
                }
            }
        }

    } else {
        console.log("Nothing to undo!");
    }

    updateRightView();
}

// Remove last entry from the undo array
// Return the index of the removed entry
function removeUndoRecord() {
    let redo = lastUndo;

    if (redo != NO_PLAY) {
        lastUndo = prevUndo[redo];
        prevUndo[redo] = NO_PLAY;

        if (lastUndo == NO_PLAY) {
            enableRedo(false);
        }
    }

    return redo;
}

function fnRedo() {
    let i;
    let row;
    let col;
    console.log("redo");

    i = removeUndoRecord();

    if (i != NO_PLAY) {
        col = i % cols;
        row = Math.floor(i / cols);

        if (i == cols * rows) {
            // just replay the pass
            replayPiece(col, row);
        } else {
            displayMove(ctx, col, row);
            replayPiece(col, row);

            if (redoWin(col, row)) {
                displayWin(ctx);
                updateRightView();
                return;
            }
        }
    } else {
        console.log("Nothing to redo");
    }

    if (!twoPlayer) {
        i = removeUndoRecord();

        if (i != NO_PLAY) {
            col = i % cols;
            row = Math.floor(i / cols);
            displayMove(ctx, col, row);
            replayPiece(col, row);

            if (redoWin(col, row)) {
                displayWin(ctx);
            }
        } else {
            console.log("No second move to redo");
        }
    }

    updateRightView();
}

function setTwoPlayer(val) {
    twoPlayer = val;
    let twoButton = document.getElementById("twoId"); 
    twoButton.style.backgroundColor = (val ? clrSelected : clrDeselected);
}

function fntwo() {
    setTwoPlayer(!twoPlayer);
}

function fnHistory() {
    const rtPnl = document.getElementById("rtDivId");
    if (historyShowing) {
        historyShowing = false;    // toggle History
        rtPnl.hidden = true;
        return;
    }

    const lbl = document.getElementById("textLbl");
    rtPnl.hidden = false;
    historyShowing = true;
    SGsShowing = false;
    lbl.innerHTML = "&nbsp;&nbsp;Game history";
    let ta = document.getElementById("rtTA");
    ta.rows = 23;
    ta.cols = 50;
    ta.value = "";
    boardChanged();
}

function fnSGs() {
    const rtPnl = document.getElementById("rtDivId");
    if (SGsShowing) {
        SGsShowing = false;    // toggle SGs
        rtPnl.hidden = true;
        return;
    }

    const lbl = document.getElementById("textLbl");
    rtPnl.hidden = false;
    SGsShowing = true;
    historyShowing = false;
    lbl.innerHTML = "List of Sub-goals";
    let ta = document.getElementById("rtTA");
    ta.rows = 23;
    ta.cols = 50;
    ta.value =
        "This area will be used to display the current list of sub-goals.";
    let div1 = document.getElementById("leftDivId");
}

function updateRightView() {
    if (saving || loading ) {
        return;
    }
    if (historyShowing) {
        boardChanged();
    }
}

function fnDone() {
    if (saving) {
        const saveDiv = document.getElementById("saveDiv");
        saveDiv.hidden = true;
        saving = false;
        if (historyShowing) {
          // restore to view
          const rtDiv = document.getElementById("rtDivId");
          rtDiv.hidden = false;
        }
        if (SGsShowing) {
            // restore to view
            const rtPnl = document.getElementById("rtDivId");
            rtPnl.hidden = false;
        }
    }
    updateRightView();
}

function fnOnClick(event) {
    let xa = event.offsetX;
    let ya = event.offsetY;

    // convert abs co-ords into grid co-ords
    xa -= (xo - unX / 2);
    ya -= (yo - unY / 2);

    if ((xa < 0) || (xa >= cols * unX) ||
        (ya < 0) || (ya >= rows * unY)) {
        return;    // key click in border country
    }

    let x = Math.floor(xa / unX);
    let y = Math.floor(ya / unY);
    click(x, y);
}

function resize() {
    w = btnGroup.offsetWidth;
    h = w;
    canvas.width = w;
    canvas.height = h;
    const rtDiv = document.getElementById("rtDivId");
    if (!rtDiv.hidden) {
        const textarea = document.getElementById("rtTA");
        textarea.width = parent.innerWidth - w;
    }
    drawBoard(ctx);
}

function addToHistory(col, row) {
    let index = row * cols + col;

    if ((prevMove[index] != NO_PLAY) || (lastMove == index)) {
        return false;
    }

    prevMove[index] = lastMove;

    if (firstMove == NO_PLAY) {
        firstMove = index;
    } else {
        nextMove[lastMove] = index;
    }

    lastMove = index;
    sizeHist++;
    return true;
}

// generate a history string - in save format
function makeHistory() {
    let i = firstMove;
    let ct = 0;
    let histStr = "";

    if (cols < 10) {
        histStr += "0";
    }
    histStr += cols;
    if (rows < 10) {
        histStr += "0";
    }
    histStr += rows;
    histStr += "\r\n";

    while (i != NO_PLAY) {
        histStr += borderTxtCols.charAt(Math.floor(i % cols)) +
            borderTxtRows.charAt(Math.floor(i / cols));

        if ((++ct % 32) == 0) {
            histStr += "\r\n";
        }

        i = nextMove[i];
    }

    histStr += borderTxtCols.charAt(cols);
    histStr += borderTxtRows.charAt(rows);
    histStr += "\r\n";
    return histStr;
}

// called after any change affecting the history record
function boardChanged() {
    const rtDiv = document.getElementById("rtDivId");
    if (!rtDiv.hidden) {
        const textarea = document.getElementById("rtTA");
        textarea.value = "";
        let index = firstMove;
        let start = true;
        let x;
        let y;
        let c = cols;

        if (index == cols * rows) {
            textarea.value += "Pass";
            start = false;
            index = nextMove[index];
        }

        while (index != NO_PLAY) {
            if (!start) { textarea.value += "  "; }
            textarea.value += Indx2Str(index);
            if (start) {
                start = false;
            } else {
                x = status[index] & 0xf;
                if ((x & PLAY_ATTACK) != 0) {
                    textarea.value += " A";
                } else if ((x & PLAY_PARTDEFEND) != 0) {
                    textarea.value += " d";
                } else if ((x & PLAY_DEFEND) != 0) {
                    textarea.value += " D";
                }

                if ((x & PLAY_SG) != 0) {
                    textarea.value += " SG";  // extend this when SGs added
                }

                textarea.value += "\r\n";
                start = true;
            }

            index = nextMove[index];
        }
    }
}

function Indx2Str(index) {
    return ("[" + borderTxtCols.charAt(Math.floor(index % cols)) +
                  borderTxtRows.charAt(Math.floor(index / cols)) + "]");
}

// undoHistory
// Remove last entry from the history arrays.
// Return the index of the removed entry.
function undoHistory() {
    let cancel = lastMove;

    if (cancel != NO_PLAY) {
        //console.log(`undoHistory returns ${cancel} ` + Indx2Str(cancel));
        lastMove = prevMove[cancel];
        prevMove[cancel] = NO_PLAY;

        if (firstMove == cancel) {
            firstMove = NO_PLAY;
            undoAllowed = false;
            enableUndo(false);
            enablePass(true);
        } else {
            nextMove[lastMove] = NO_PLAY;
        }

        sizeHist--;
        prevUndo[cancel] = lastUndo;
        lastUndo = cancel & 0xffff;

        if (!redoAllowed) {
            redoAllowed = true;
            enableRedo(true);
        }
    } else {
        console.log("undoHistory returns NO_PLAY");
    }

    return (cancel);
}

function isOccupied(row, col) {
    return (((viewX[0][row] | viewO[0][row]) & (1 << (col + 5))) != 0);
}

function scoreNode(col, row, ps) {
    let dir;
    let j;
    let k;
    let score_X;
    let score_O;
    let X_array;
    let O_array;
    let X_7;
    let O_7;
    let edge_X;
    let edge_O;
    let adjacency = 0;

    // first check if a piece has been played here
    if (isOccupied(row, col)) {
        for (dir = 0; dir < DIRECTIONS; dir++) {
            ps.fourByteX[dir] = 0;
            ps.fourByteO[dir] = 0;
        }

        ps.adjacency &= 0xf;    // clear adjacent pieces count
        return;
    }

    // extract bit map around specified point, in each direction
    // and determine the strength of the point for each player
    for (dir = 0; dir < 4; dir++) {
        switch (dir) {
            case 0: {      // horizontal
                j = row;
                k = col;
                break;
            }

            case 1: {      // vertical
                j = col;
                k = row;
                break;
            }

            case 2: {      // left diagonal
                j = cols - 1 + row - col;
                k = col;
                break;
            }

            default: {      // right diagonal
                j = row + col;
                k = col;
                break;
            }
        }

        X_array = (viewX[dir][j] >> k);
        O_array = (viewO[dir][j] >> k);

        /*
         * The least significant 11 bits of X_array and O_array now
         * contain the played pieces for the specified position and
         * for 5 points either side. Starting at the left of this
         * array, consider the 5 possible 7-bit arrays which pass
         * through the selected position. The 7-bit array represents
         * a possible 5-pattern for X, provided that X is not played
         * at either extreme of the 7 (because 6 in a row doesn't count)
         * and provided that O isn't played in any of the 5 bits between.
         */
        score_X = 0;
        score_O = 0;

        for (k = 0; k < 5; k++) {
            X_7 = (X_array >> k);
            O_7 = (O_array >> k);
            edge_X = (X_7 & 0x41);
            edge_O = (O_7 & 0x41);

            // An apparent X play is an edge of board if the same
            // bit is set in the O array. We need to know this to
            // disallow 6-in-a-row.
            if (allow6 ||
                (edge_X == 0) || ((edge_X & edge_O) == edge_X)) {
                // X doesn't have a play at the edges of the pattern
                // (or the option is selected to allow more than 5 in a 
                // row). Are there any O plays within the 5-pattern?
                if ((O_7 & 0x3e) == 0) {
                    // It's a valid potential 5-pattern for X.
                    // Look up bits in 5-pattern
                    X_7 >>= 1;
                    X_7 &= 0x1f;
                    j = lookup_5[X_7];

                    if (j > score_X) {
                        score_X = j;
                    } else if (j == score_X) {
                        // set ls bit to indicate more than one pattern
                        score_X |= 1;
                    }
                }
            }

            // now look for O plays
            if (allow6 ||
                (edge_O == 0) || ((edge_O & edge_X) == edge_O)) {
                // O doesn't have a play at the edges of the pattern.
                // Are there any X plays within the 5-pattern?
                X_7 = (X_array >> k);   // first restore X_7

                if ((X_7 & 0x3e) == 0) {
                    // It's a valid potential 5-pattern for O.
                    // Look up bits in 5-pattern.
                    O_7 >>= 1;
                    O_7 &= 0x1f;
                    j = lookup_5[O_7];

                    if (j > score_O) {
                        score_O = j;
                    } else if (j == score_O) {
                        // set ls bit to indicate more than one pattern
                        score_O |= 1;
                    }
                }
            }
        }

        ps.fourByteX[dir] = score_X & 0xff;
        ps.fourByteO[dir] = score_O & 0xff;

        // while the bit arrays are to hand, compute the contribution of
        // this direction to the adjacency count.
        X_7 = X_array ^ O_array;

        if ((X_7 & 0x40) != 0) {
            adjacency++;
        }

        if ((X_7 & 0x10) != 0) {
            adjacency++;
        }
    }

    //ps.adj = (adjacency << 4) & 0xff;
    ps.adj = 0;    // let's try without points for being adjacent
}

function assess(col, row) {
    let r;
    let c;

    for (r = (row - 5) < 0 ? 0 : row - 5; r < rows && r < row + 6; r++) {
        for (c = (col - 5) < 0 ? 0 : col - 5;
             c < cols && c < col + 6;
             c++) {
            evaluate(c, r);
        }
    }
}

function assessWholeBoard() {
    let r;
    let c;
    
    for (r = 0; r < rows; r++) {
        for (c = 0; c < cols; c++) {
            evaluate(c, r);
        }
    }
}

function evaluate(col, row) {
    let index = row * cols + col;
    score.adj = status[index];
    scoreNode(col, row, score);
    status[index] = score.adj;

    for (let dir = 0; dir < DIRECTIONS; dir++) {
        // copy combined values into cache
        values[PLAYER_X][index] = score.orderA(score.fourByteX);
        values[PLAYER_O][index] = score.orderA(score.fourByteO);
    }
}

function getWinner() {
    return winner;
}

function setDrawnGame() {
    winner = PLAYER_O | PLAYER_X;
}

function enableUndo(enable) {
    undoAllowed = enable;
    document.getElementById("undoId").disabled = !enable;
}

function enableRedo(enable) {
    redoAllowed = enable;
    document.getElementById("redoId").disabled = !enable;
}

function enablePass(enable) {
    passAllowed = enable;
    document.getElementById("passId").disabled = !enable;
}

function playPiece(col, row) {
    if (addToHistory(col, row)) {
        if (!undoAllowed) {
            // previously disabled, allow undo button now
            enableUndo(true);
            enablePass(false);
        }

        if (col * row != crLim) {
            addToBoard(col, row);
            assess(col, row);
        } else {
            player ^= SWITCH_PLAYERS;    // first move passed
        }
    }
}

function replayPiece(col, row) {
    if (addToHistory(col, row)) {
        if (!undoAllowed) {
            // previously disabled, allow undo button now
            enableUndo(true);
            enablePass(false);
        }

        if (col * row != crLim) {
            addToBoard(col, row);
        }
    }
}

function undoPlay(index) {
    let y = Math.floor(index / cols);
    let x = index % cols;
    let dir;
    let j;
    let k;

    if (index != rows * cols) {
        // not undoing a pass
        // clear the appropriate bit in each representation
        for (dir = 0; dir < DIRECTIONS; dir++) {
            switch (dir) {
                case 0:     // horizontal
                {
                    j = y;
                    k = 1 << (x + 5);
                    break;
                }

                case 1:     // vertical
                {
                    j = x;
                    k = 1 << (y + 5);
                    break;
                }

                case 2:     // left diagonal
                {
                    j = cols - 1 + y - x;
                    k = 1 << (x + 5);
                    break;
                }

                default:    // right diagonal
                {
                    j = y + x;
                    k = 1 << (x + 5);
                    break;
                }
            }

            viewX[dir][j] &= ~k;
            viewO[dir][j] &= ~k;
        }
    }

    player ^= SWITCH_PLAYERS;
}

function isUnplayed(col, row) {
    let k = (1 << (col + 5));

    return (((viewX[0][row] & k) == 0) && ((viewO[0][row] & k) == 0));
}

function addToBoard(col, row) {
    let dir;
    let j = 0;
    let k = 0;

    if ((col != 0) || (row != rows)) {
        // This is not a pass.
        // Set the appropriate bit in each representation
        for (dir = 0; dir < 4; dir++) {
            switch (dir) {
                case 0: {   // horizontal
                    j = row;
                    k = (1 << (col + 5));
                    break;
                }

                case 1: {   // vertical
                    j = col;
                    k = (1 << (row + 5));
                    break;
                }

                case 2: {   // left diagonal
                    j = cols - 1 + row - col;
                    k = (1 << (col + 5));
                    break;
                }

                case 3: {   // right diagonal
                    j = row + col;
                    k = (1 << (col + 5));
                    break;
                }
            }

            if (player == PLAYER_X) {
                viewX[dir][j] |= k;
            } else {
                viewO[dir][j] |= k;
            }
        }
    }

    player ^= SWITCH_PLAYERS;
}

function getPlayer() {
    return player;
}

function getFirstMove() {
    return firstMove;
}

function getLastMove() {
    return lastMove;
}

function displayMove(gc, c, r, p) {
    let clrPiece;
    let clrBoundary;

    if (p == undefined) {
        p = getPlayer();
    }

    switch (p) {
        case PLAYER_X:
            clrPiece = clrPlayX;
            clrBoundary = clrPlayX;
            break;

        case PLAYER_O:
            clrPiece = clrPlayO;
            clrBoundary = clrPlayO;
            break;

        case RECENT_O:
            clrPiece = clrLastO;
            clrBoundary = clrLastORing;
            break;

        case UNDO_PLAY:
            clrPiece = clrBoard;
            clrBoundary = clrBoard;
            break;

        case BLANK:
            clrPiece = clrBlank;
            clrBoundary = clrGrid;
            break;

        default:
            clrPiece = clrMatch;
            clrBoundary = clrGrid;
            break;
    }

    let x = xo + c * unX;
    let y = yo + r * unY;

    gc.fillStyle = clrPiece;

    if (p >= IMPLICIT && p <= IMPLICIT2) {
        x -= pceOffX + 2 * penWidth - (p - IMPLICIT) * 2;
        y -= pceOffY + 2 * penWidth - (p - IMPLICIT) * 2;
        gc.fillRect(x, y, 2 * penWidth, 2 * penWidth);
        return;
    }

    gc.beginPath();
    gc.arc(x, y, unX / 3, 0, 2 * Math.PI);
    gc.fill();

    if ((clrPiece.localeCompare(clrBoundary) != 0) || (p == UNDO_PLAY)) {
        gc.strokeStyle = clrBoundary;
        gc.beginPath();
        gc.arc(x, y, unX / 3, 0, 2 * Math.PI);
        gc.stroke();
    }

    if (p == UNDO_PLAY) {
        // Having drawn over the previously played piece in board colour,
        // it is now necessary to redraw the grid lines.
        gc.fillStyle = clrGrid;

        // Now redraw the damaged grid lines. Go an extra pixel each way
        // for safety. However, if the line is at the edge of the board,
        // be more circumspect.
        gc.fillRect(x - Math.floor(penWidth / 2),
                    r == 0 ? y - Math.floor(penWidth/2) : y + pceOffY - 1,
                    penWidth,
                    (r == rows - 1) ? Math.floor(pceDimY/2) + penWidth
                                    : pceDimY + 2);
        gc.fillRect(c == 0 ? x - Math.floor(penWidth/2) : x + pceOffX - 1,
                    y - Math.floor(penWidth / 2),
                    (c == cols - 1) ? Math.floor(pceDimX / 2) +
                                        Math.floor((penWidth + 1) / 2) :
                                    pceDimX + 2,
                    penWidth);
    }
}

function displayWin(gc) {
    let ptLeft = new Point(0, 0);
    let ptRight = new Point(0, 0);
    let who = locateWin(ptLeft, ptRight);

    if (who == 0) {
        return;    // error by caller
    }

    let leftX = ptLeft.x;
    let leftY = ptLeft.y;
    let rightX = ptRight.x;
    let rightY = ptRight.y;
    let x = xo + unX * leftX - Math.floor(penWidth / 2);
    let y = yo + unY * leftY - Math.floor(penWidth / 2);
    xCoOrds[0] = x;

    if (leftX == rightX) {
        xCoOrds[1] = x + penWidth;
        xCoOrds[2] = xCoOrds[1];
        xCoOrds[3] = x;
        yCoOrds[0] = y + Math.floor(penWidth / 2);
        yCoOrds[1] = yCoOrds[0];
        yCoOrds[2] = yCoOrds[1] + unY * 4;
        yCoOrds[3] = yCoOrds[2];
    } else if (leftY == rightY) {
        xCoOrds[0] = x + Math.floor(penWidth / 2);
        xCoOrds[1] = xCoOrds[0] + unX * 4;
        xCoOrds[2] = xCoOrds[1];
        xCoOrds[3] = xCoOrds[0];
        yCoOrds[0] = y;
        yCoOrds[1] = y;
        yCoOrds[2] = y + penWidth;
        yCoOrds[3] = yCoOrds[2];
    } else if (leftY < rightY) {
        xCoOrds[1] = x + Math.floor(penWidth * 2 / 3);
        xCoOrds[2] = xCoOrds[1] + unX * 4;
        xCoOrds[3] = x + unX * 4;
        yCoOrds[0] = y + Math.floor(penWidth * 2 / 3);
        yCoOrds[1] = y;
        yCoOrds[2] = y + unY * 4;
        yCoOrds[3] = yCoOrds[0] + unY * 4;
    } else {
        xCoOrds[1] = x + unX * 4;
        xCoOrds[2] = xCoOrds[1] + Math.floor(penWidth * 2 / 3);
        xCoOrds[3] = xCoOrds[2] - unX * 4;
        yCoOrds[0] = y;
        yCoOrds[1] = y - unY * 4;
        yCoOrds[2] = yCoOrds[1] + Math.floor(penWidth * 2 / 3);
        yCoOrds[3] = yCoOrds[2] + unY * 4;
    }

    gc.fillStyle = clrWin;
    gc.beginPath();
    gc.moveTo(xCoOrds[0], yCoOrds[0]);
    for (let i = 1; i < 4; i++) {
        gc.lineTo(xCoOrds[i], yCoOrds[i]);
    }
    gc.closePath();
    gc.fill();
}

function checkForWin(col, row) {
    let index = row * cols + col;

    if (values[player][index] >= 0xA000) {
        winner = undoneWinner = player;
        winX = col;
        winY = row;
    }
}

// check if last player has just completed 6 in a row,
// called with co-ordinates of point just played.
// returns true for a 6 (or more) otherwise false
function checkFor6(col, row) {
    let dir;
    let j;
    let k;
    let X_array;
    let O_array

    // get the 11 bit framing pattern for each direction and check it out
    for (dir = 0; dir < 4; dir++) {
        switch (dir) {
            case 0: {   // horizontal
                j = row;
                k = col;
                break;
            }

            case 1: {   // vertical
                j = col;
                k = row;
                break;
            }

            case 2: {   // left diagonal
                j = cols - 1 + row - col;
                k = col;
                break;
            }

            default: {  // right diagonal
                j = row + col;
                k = col;
                break;
            }
        }

        X_array = viewX[dir][j] >>> k;
        O_array = viewO[dir][j] >>> k;

        for (k = 0; k < 6; k++) {
            if (((X_array & 0x3f) == 0x3f) && ((O_array & 0x3f) == 0)) {
                return true;
            }

            if (((O_array & 0x3f) == 0x3f) && ((X_array & 0x3f) == 0)) {
                return true;
            }

            X_array >>>= 1;
            O_array >>>= 1;
        }
    }

    return false;
}

// locate winning line
// fills in co-ordinates of ends of line and returns player (or 0)
function locateWin(p_left, p_right) {
    let dir;
    let j;
    let k;
    let arrayX;
    let arrayO;
    let edgeX;
    let edgeO;
    let winningPlayer = 0;

    // Get the 11 bit framing pattern for each direction and check it out
    for (dir = 0; dir < 4; dir++) {
        switch (dir) {
            case 0: {   // horizontal
                j = winY;
                k = winX;
                break;
            }

            case 1: {   // vertical
                j = winX;
                k = winY;
                break;
            }

            case 2: {   // left diagonal
                j = cols - 1 + winY - winX;
                k = winX;
                break;
            }

            default: {  // right diagonal
                j = winY + winX;
                k = winX;
                break;
            }
        }

        arrayX = viewX[dir][j] >>> k;
        arrayO = viewO[dir][j] >>> k;

        for (k = 0; k < 5; k++) {
            edgeX = arrayX & 0x41;
            edgeO = arrayO & 0x41;

            // an apparant X play is an edge of board if the same
            // bit is set in the O array
            if (allow6 ||
                (edgeX == 0) || ((edgeX & edgeO) == edgeX)) {

                // X doesn't have a play at the edges of the pattern
                // Are all five pieces played in between?
                if ((arrayX & 0x3e) == 0x3e) {
                    // yes it's a win for X
                    winningPlayer = PLAYER_X;
                    break;
                }
            }

            if (allow6 ||
                (edgeO == 0) || ((edgeO & edgeX) == edgeO)) {

                // O doesn't have a play at the edges of the pattern
                // Are all five pieces played in between?
                if ((arrayO & 0x3e) == 0x3e) {
                    // yes it's a win for O
                    winningPlayer = PLAYER_O;
                    break;
                }
            }

            arrayX >>>= 1;
            arrayO >>>= 1;
        }

        if (winningPlayer != 0) {
            switch (dir) {
                case 0: {   // horizontal
                    p_right.y = winY;
                    p_right.x = winX + k;
                    p_left.y = winY;
                    p_left.x = p_right.x - 4;
                    break;
                }

                case 1: {   // vertical
                    p_right.x = winX;
                    p_right.y = winY + k;
                    p_left.x = winX;
                    p_left.y = p_right.y - 4;
                    break;
                }

                case 2: {   // left diagonal
                    p_right.y = winY + k;
                    p_right.x = winX + k;
                    p_left.y = p_right.y - 4;
                    p_left.x = p_right.x - 4;
                    break;
                }

                default: {  // right diagonal
                    p_right.y = winY - k;
                    p_right.x = winX + k;
                    p_left.y = p_right.y + 4;
                    p_left.x = p_right.x - 4;
                    break;
                }
            }

            return winningPlayer;
        }
    }

    return 0;    // no win found
}

function click(x, y) {
    /*
    let lastMove;

    if (pending >= 0) {
        lastMove = pending;
        pending = -1;
        brd.freeNLchain(brd.way3);
        finishMove(lastMove);
        drawBoard(ctx);
        return;
    }
    */

    if ((getWinner() == 0) && isUnplayed(x, y)) {
        if ((getPlayer() == PLAYER_X) &&
            (lastMove = getLastMove()) != NO_PLAY) {
            // re-draw last move in standard form
            displayMove(ctx, lastMove % cols, Math.floor(lastMove / cols),
                        UNDO_PLAY);
            displayMove(ctx, lastMove % cols, Math.floor(lastMove / cols),
                        PLAYER_O);
        }

        cancelRedoList();
        displayMove(ctx, x, y);
        
        // check for win
        checkForWin(x, y);
        playPiece(x, y);

        // now look for a response
        if (getWinner() == 0) {
            if (checkFor6(x, y)) {
                confirm("Sorry, six in a row doesn't count");
            }

            if (twoPlayer) {
                updateRightView();
            } /* else {
                chooseMove();
            }
            */
        } else {
            displayWin(ctx);    // highlight winning pieces
            updateRightView();
        }
    }
}

setup();
resize();

