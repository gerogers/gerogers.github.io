// vi:set ts=50 sw=4 ai ml:
// 3.03  18/04/2024, normalise new plank during construction,
//       fixes problem detecting crossing planks
"use strict";
const strVer = "Planks version 3.04";
const strDate = "Script last updated Apr 2024";
const params = document.getElementsByClassName('params');
let parLen = params.length;
const frame = document.getElementById('frame');
const puzlId = document.getElementById('puzzleId');
const canvas = document.getElementById('planksId');
const colours = document.getElementById('colours');
const loadSave = document.getElementById('loadSaveId');
const topBtns = document.getElementById('topBtnsId');
const prevId = document.getElementById('prevId');
const nextId = document.getElementById('nextId');
const btmBtns = document.getElementById('btmBtnsId');
const aboutBtn = document.getElementById('aboutId');
const loadMsg = document.getElementById('loadMsgId');
const saveBtn = document.getElementById('saveId');
let textarea = document.getElementById('textId');
const aboutDiv = document.getElementById('aboutDiv');
const aboutTxt = document.getElementById('aboutTxt');
const toHex = "0123456789abcdefghijklmnopqrstuvwxyz";

// screen regions for text messages
const iLowLeft = 0;
const iLowMid = 1;
const iLowRight = 2;
const iHigh = 3;

let first = 0;
if (colours != null) {
    first = 1;
}

// predefine colours
let m_clrSwamp = "green";
let m_clrSwampWin = "#00ffff";
let m_clrLand = "#009900";
let m_clrGrid = "#000000";
let m_clrLog = "#707000";
let m_clrActiveLog = "#ffa500";
let m_clrTarget = "red";
let m_clrPlank = "yellow";

let okClr = "white";
let disClr = "#9f9f9f";

if (first == 1) {
    parseColours(`${colours.value}`);
}

let ctx = canvas.getContext('2d');
let canvw = 0;    // canvas width
let canvh = 0;    // canvas height
let m_va;
let puzIndx = first;
let puzName;
let puzPositions;
let puzNodes;
let restored = false;
let win = false;
let puzNo = first;
let nextMove;           // used in recording and replaying moves
let moves = 0;          // count of plank moves
let aboutActive = false;
const byLog = 1;
const hexShape = 6;
let shape = 0;          // set to hexShape for hexagons
let cols = 1;
let rows = 1;
let startX = -1;
let startY = -1;
let manX = -1;
let manY = -1;
let targetX = 0;
let targetY = 0;
let mouseX = -1;
let mouseY = -1;
let lenPlanks = 0;
let elements = 1;
let btn = null;
let btnGroup = null;
let offX = -1;
let offY = -1;
let winShown = false;
let saving = false;
let loading = false;
let planks;
let plankHeld = -1;     // a plank which is being carried (neg if none)
let bReplay = false;    // true while replaying recorded moves
let strHistory = "";
let strPositions = "";
let strNodes = "";
let sparePlank;
let OKw;
let OKh;
let OKx;
let OKy;
let rx = new Array(4);
let ry = new Array(4);
let hx = new Array(6);
let hy = new Array(6);

//puzPositions = params[puzIndx].name;
// find the puzzle occupying largest area
let boardSize = 0;

for (puzIndx = first; puzIndx < parLen; puzIndx++) {
    puzPositions = params[puzIndx].name;
    cols = parseInt(puzPositions.charAt(0), 36);
    rows = parseInt(puzPositions.charAt(1), 36);
    if ((cols * rows) > boardSize) {
        boardSize = cols * rows;
    }
}

puzIndx = first;
let playArea = new Array(boardSize);

class ViewAttr {
    constructor(iLMargin, iTMargin, iScale, iRows) {
        this.iLMargin = iLMargin;
        this.iTMargin = iTMargin;
        this.iScale = iScale;
        this.iRows = iRows;    // 0 for square grid, rows for hexagonal
    }

    setVA(iLMargin, iTMargin, iScale, iRows) {
        this.iLMargin = iLMargin;
        this.iTMargin = iTMargin;
        this.iScale = iScale;
        this.iRows = iRows;
    }
}

class Plank {
    constructor(iX1, iY1, iX2, iY2) {
        this.m_bCarried = false;
        this.m_bTouching = false;
        this.m_X1 = iX1;
        this.m_Y1 = iY1;
        this.m_X2 = iX2;
        this.m_Y2 = iY2;
        this.m_iLen = (this.m_X1 == this.m_X2) ? this.m_Y2 - this.m_Y1 :
                                                 this.m_X2 - this.m_X1;
        if (this.m_iLen < 0) {
            this.m_iLen = -this.m_iLen;
        }

        Normalise(this);
        this.m_X1Init = this.m_X1;
        this.m_Y1Init = this.m_Y1;
        this.m_X2Init = this.m_X2;
        this.m_Y2Init = this.m_Y2;
    }

    Set(iX1, iY1, iX2, iY2) {
        this.m_bCarried = false;
        this.m_bTouching = false;
        this.m_X1 = iX1;
        this.m_Y1 = iY1;
        this.m_X2 = iX2;
        this.m_Y2 = iY2;
        this.m_iLen = (this.m_X1 == this.m_X2) ? this.m_Y2 - this.m_Y1 :
                                                 this.m_X2 - this.m_X1;
        if (this.m_iLen < 0) {
            this.m_iLen = -this.m_iLen;
        }

        Normalise(this);
        this.m_X1Init = this.m_X1;
        this.m_Y1Init = this.m_Y1;
        this.m_X2Init = this.m_X2;
        this.m_Y2Init = this.m_Y2;
    }

    Reset() {
        this.m_bCarried = false;
        this.m_bTouching = false;
        this.m_X1 = this.m_X1Init;
        this.m_Y1 = this.m_Y1Init;
        this.m_X2 = this.m_X2Init;
        this.m_Y2 = this.m_Y2Init;
    }

    PointIsInside(x, y, va) {
        // to make it easier to touch the plank, is is
        // considered to be twice as wide as it is shown
        if (this.m_Y1 == this.m_Y2) {
            // plank lying horizontally
            if (va.iRows == 0) {
                // rectangular swamp
                rx[0] = va.iLMargin + (this.m_X1 * 8 + 1) * va.iScale;
                rx[1] = rx[0] + (this.m_iLen * 8 - 2) * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 8 - 1) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + 4 * va.iScale;
                ry[3] = ry[2];
            } else {
                // hexagonal swamp
                rx[0] = va.iLMargin +
                         (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7 + 5) *
                         va.iScale);
                rx[1] = rx[0] + (this.m_iLen * 14 - 2) * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 12 + 2) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + 6 * va.iScale;
                ry[3] = ry[2];
            }
        } else if (this.m_X1 == this.m_X2) {
            if (va.iRows == 0) {
                // plank lying vertically on rectangular swamp
                rx[0] = va.iLMargin + (this.m_X1 * 8 - 1) * va.iScale;
                rx[1] = rx[0] + 4 * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 8 + 1) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + (this.m_iLen * 8 - 2) * va.iScale;
                ry[3] = ry[2];
            } else {
                // plank lying like this -> / on hexagonal swamp;
                rx[0] = va.iLMargin +
                        (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7) + 1) *
                        va.iScale;
                rx[1] = rx[0] + 4 * va.iScale;
                rx[2] = rx[1] - ((this.m_iLen * 7) - 1) * va.iScale;
                rx[3] = rx[2] - 4 * va.iScale;

                ry[0] = va.iTMargin + (this.m_Y1 * 12 + 3) * va.iScale;
                ry[1] = ry[0] + 2 * va.iScale;
                ry[2] = ry[1] + (this.m_iLen * 12 - 1) * va.iScale;
                ry[3] = ry[2] - 2 * va.iScale;
            }
        } else if (va.iRows != 0) {
            // plank lying like this -> \ on hexagonal swamp
            rx[0] = va.iLMargin +
                     (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7) + 2) *
                     va.iScale;
            rx[1] = rx[0] + 4 * va.iScale;
            rx[2] = rx[1] + ((this.m_iLen * 7) - 1) * va.iScale;
            rx[3] = rx[2] - 4 * va.iScale;

            ry[0] = va.iTMargin + (this.m_Y1 * 12 + 5) * va.iScale;
            ry[1] = ry[0] - 2 * va.iScale;
            ry[2] = ry[1] + (this.m_iLen * 12 - 1) * va.iScale;
            ry[3] = ry[2] + 2 * va.iScale;
        }

        let inside = false;
        let i = 0;

        for (let j = 3; i < 4; j = i++) {
            let xi = rx[i]; let yi = ry[i];
            let xj = rx[j]; let yj = ry[j];

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    DrawPlank(va, clrFill, clrStroke) {
        if (this.m_Y1 == this.m_Y2) {
            // plank lying horizontally
            if (va.iRows == 0) {
                // rectangular swamp
                rx[0] = va.iLMargin + (this.m_X1 * 8 + 1) * va.iScale;
                rx[1] = rx[0] + (this.m_iLen * 8 - 2) * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 8 - 1) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + 2 * va.iScale;
                ry[3] = ry[2];
            } else {
                // hexagonal swamp
                rx[0] = va.iLMargin +
                    (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7) + 5) *
                    va.iScale;
                rx[1] = rx[0] + (this.m_iLen * 14 - 2) * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 12 + 2) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + 4 * va.iScale;
                ry[3] = ry[2];
            }
        } else if (this.m_X1 == this.m_X2) {
            if (va.iRows == 0) {
                // plank lying vertically on rectangular swamp
                rx[0] = va.iLMargin + (this.m_X1 * 8 - 1) * va.iScale;
                rx[1] = rx[0] + 2 * va.iScale;
                rx[2] = rx[1];
                rx[3] = rx[0];

                ry[0] = va.iTMargin + (this.m_Y1 * 8 + 1) * va.iScale;
                ry[1] = ry[0];
                ry[2] = ry[1] + (this.m_iLen * 8 - 2) * va.iScale;
                ry[3] = ry[2];
            } else {
                // plank lying like this -> / on hexagonal swamp
                rx[0] = va.iLMargin +
                        (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7) + 2) *
                        va.iScale;
                rx[1] = rx[0] + 3 * va.iScale;
                rx[2] = rx[1] - ((this.m_iLen * 7) - 1) * va.iScale;
                rx[3] = rx[2] - 3 * va.iScale;

                ry[0] = va.iTMargin + (this.m_Y1 * 12 + 4) * va.iScale;
                ry[1] = ry[0] + 2 * va.iScale;
                ry[2] = ry[1] + (this.m_iLen * 12 - 2) * va.iScale;
                ry[3] = ry[2] - 2 * va.iScale;
            }
        } else if (va.iRows != 0) {
            // plank lying like this -> \ on hexagonal swamp
            rx[0] = va.iLMargin +
                (((2 * this.m_X1 + va.iRows - this.m_Y1) * 7) + 3) *
                va.iScale;
            rx[1] = rx[0] + 3 * va.iScale;
            rx[2] = rx[1] + ((this.m_iLen * 7) - 1) * va.iScale;
            rx[3] = rx[2] - 3 * va.iScale;

            ry[0] = va.iTMargin + (this.m_Y1 * 12 + 6) * va.iScale;
            ry[1] = ry[0] - 2 * va.iScale;
            ry[2] = ry[1] + (this.m_iLen * 12 - 2) * va.iScale;
            ry[3] = ry[2] + 2 * va.iScale;
        }

        if (!this.m_bCarried) {
            ctx.fillStyle = clrFill;
            fillPolygon(rx, ry, 4);
        }

        ctx.strokeStyle = clrStroke;
        drawPolygon(rx, ry, 4);
    }
}

function Normalise(pl) {
    let x = pl.m_X2;
    let y = pl.m_Y2;

    if (((y == pl.m_Y1) && (x < pl.m_X1)) ||
        ((y != pl.m_Y1) && (y < pl.m_Y1))) {
        // need to swap the ends of this plank around
        pl.m_X2 = pl.m_X1;
        pl.m_Y2 = pl.m_Y1;
        pl.m_X1 = x;
        pl.m_Y1 = y;
    }
}

sparePlank = new Plank(0, 0, 0, 0,);
setPuzzle();
resize();

function findPuzzle(pos, nod) {
    let i;

    for (i = first; i < parLen; i++) {
        if ((pos == params[i].name) && (nod == params[i].value)) {
            return i;
        }
    }

    return -1;
}

function setPuzzle() {
    loading = false;
    saving = false;

    if (restored) {
        puzPositions = strPositions;
        puzNodes = strNodes;
        let index = findPuzzle(strPositions, strNodes);
        if (index >= 0) {
            puzIndx = index;
            puzName = params[index].title;
        } else {
            puzName = "Restored";
        }
    } else {
        puzPositions = params[puzIndx].name;
        puzNodes = params[puzIndx].value;
        puzName = params[puzIndx].title;
    }

    puzlId.innerHTML=puzName;
    cols = parseInt(puzPositions.charAt(0), 36);
    rows = parseInt(puzPositions.charAt(1), 36);
    startX = parseInt(puzPositions.charAt(2), 36);
    startY = parseInt(puzPositions.charAt(3), 36);
    manX = startX;
    manY = startY;
    targetX = parseInt(puzPositions.charAt(4), 36);
    targetY = parseInt(puzPositions.charAt(5), 36);
    lenPlanks = Math.floor((puzPositions.length - 6) / 4);

    if (((puzPositions.length - 6) % 4) != 0) {
        shape = parseInt(puzPositions.charAt(6 + (lenPlanks * 4)), 36);
    } else {
        shape = 0;
    }

    planks = new Array(lenPlanks);

    for (let i = 0; i < lenPlanks; i++) {
        planks[i] = new Plank(parseInt(puzPositions.charAt(6 + (i * 4)), 36),
                            parseInt(puzPositions.charAt(7 + (i * 4)), 36),
                            parseInt(puzPositions.charAt(8 + (i * 4)), 36),
                            parseInt(puzPositions.charAt(9 + (i * 4)), 36));
    }

    markActivePlanks();

    // read the co-ords of the stumps and populate the play area
    let i = 0;
    let j;
    let x;
    let y;
    let indx;

    for (y = 0; y < rows; y++) {
        // first clear the playArea
        for (x = 0; x < cols; x++) {
            playArea[y * cols + x] = 0;
        }

        j = parseInt(puzNodes.charAt(i++), 36);

        while (j-- > 0) {
            x = parseInt(puzNodes.charAt(i++), 36);
            playArea[y * cols + x] = byLog;
        }
    }

    squareOne();
}

function toExtendedHex(n) {
    if ((n >= 0) && (n < 36)) {
        return (toHex.charAt(n));
    } else {
        return ("?");
    }
}

function fnRestart() {
    strHistory = "";
    nextMove = 0;
    moves = 0;
    saveId.innerText = "Load";
    setPuzzle();
    resize();
}

function fixButton(btnId, ok) {
    if (ok) {
        btnId.disabled = false;
        btnId.style.backgroundColor = okClr;
        btnId.style.color = "black";
    } else {
        btnId.disabled = true;
        btnId.style.backgroundColor = disClr;
        btnId.style.color = "#e0e0e0";
    }
}

function fnPrev() {
    if (puzIndx > first) {
        puzIndx--;
        strHistory = "";
        restored = false;
        nextMove = 0;
        moves = 0;
        saveId.innerText = "Load";
        fixButton(nextId, true);
        fixButton(prevId, (puzIndx > first));
        setPuzzle();
        resize();
    } else {
        fixButton(prevId, false);
    }
}

function fnNext() {
    if (puzIndx < (parLen - 1)) {
        puzIndx++;
        strHistory = "";
        restored = false;
        nextMove = 0;
        moves = 0;
        saveId.innerText = "Load";
        fixButton(prevId, true);
        fixButton(nextId, (puzIndx < (parLen - 1)));
        setPuzzle();
        resize();
    } else {
        nextId.disabled = true;
    }
}

function fnAbout() {
    aboutActive = true;
    let w = canvas.width;
    let h = canvas.height;
    canvas.hidden = true;
    aboutDiv.hidden = false;
    aboutDiv.width = w;
    aboutDiv.height = h;
    ctx.font = "14px sans-serif";
    let abtMessage = strVer + "<br>" + strDate + "<br><br>" +
        "Concept &copy; Andrea N. Gilbert, 2000<br>Unless otherwise stated: "
      + "puzzles &copy; Andrea N. Gilbert, 2000-2002<br>" +
        "Original Applet &copy; Graham E. Rogers, 2000-2003<br>" +
        "This JS version &copy; Graham E. Rogers, 2024 - borrowing heavily " +
        "from Jeremy D. Miller's 2017 version for Load button validation" +
        " - inspired!<br><br>Hint: when playing the hexagonal puzzles, " +
        "planks must lie at right angles to a hexagon edge<br>";
    aboutTxt.innerHTML = abtMessage;
}

function fnAboutDone() {
    aboutActive = false;
    aboutDiv.hidden = true;
    resize();
}

// function to prepare history string for display
function makeHistory() {
    let str = "Planks format 1\nPositions = \"" + puzPositions +
        "\"\nNodes = \"" + puzNodes + "\"\n";
    let i = 0;

    while (i < nextMove) {
        if (strHistory.charAt(i++) == 'P') {
            // pick up plank
            str += "P" + strHistory.charAt(i++) + " -> ";
        } else {
            // lower plank
            str += "(" + strHistory.charAt(i) + "," +
                strHistory.charAt(i + 1) + ") - (" +
                strHistory.charAt(i + 2) + "," +
                strHistory.charAt(i + 3) + ")\n";
            i += 4;
        }
    }

    return str;
}

function fnSave() {
    if (saveId.innerText != "Save") {
        saving = false;
        fnLoad();
    } else {
        saving = true;
        resize();
        textarea.value = makeHistory();
    }
}

function fnLoad() {
    loadMsg.innerHTML =
    "To restore a previously saved game, copy its code into the box below and then press Done";
    loading = true;
    resize();
}

function fnReplay() {
    squareOne();
    resize();
}

function fnDoneSave() {
    if (saving) {
        saving = false;
        resize();
    }
    if (loading) {
        let txt = textarea.value;
        // abort load action if textarea empty
        if (txt.trim().length == 0) {
            loading = false;
            restored = false;
            setPuzzle();
            resize();
            return;
        }
        let m = parseLoadString(txt);
        loadMsg.innerHTML = m.msg;
        if (m.msg == "Success") {
            strPositions = m.positions;
            strNodes = m.nodes;
            strHistory = m.history;
            loading = false;
            restored = true;
            setPuzzle();
        }
    }

    resize();
}

function parseColours(str) {
    let i;
    let entry;
    let myArray = str.split(" ");
    let len = myArray.length;

    for (i = 0; i < len; i++) {
        entry = myArray[i].split('=');
        if (entry.length == 2) {
            switch(entry[0]) {
                case "swamp":
                    m_clrSwamp = entry[1];
                    break;
                case "swampWin":
                    m_clrSwampWin = entry[1];
                    break;
                case "land":
                    m_clrLand = entry[1];
                    break;
                case "grid":
                    m_clrGrid = entry[1];
                    break;
                case "log":
                    m_clrLog = entry[1];
                    break;
                case "activeLog":
                    m_clrActiveLog = entry[1];
                    break;
                case "target":
                    m_clrTarget = entry[1];
                    break;
                case "plank":
                    m_clrPlank = entry[1];
                    break;
            }
        }
    }
}

function resize() {
    if (saving) {
        loadSave.hidden = false;
        loadMsg.hidden = true;
        canvas.hidden = true;
    } else if (loading) {
        loadSave.hidden = false;
        loadMsg.hidden = false;
        canvas.hidden = true;
    } else if (aboutActive) {
        aboutDiv.hidden = false;
    } else {
        aboutDiv.hidden = true;
        loadSave.hidden = true;
        loadMsg.hidden = true;
        canvas.hidden = false;
        if (strHistory.length != 0) {
            saveId.innerText = "Save";
        }
    }
    let margin = frame.offsetLeft;
    let w = puzlId.offsetWidth;
    let h = window.innerHeight - frame.offsetTop - 2 * topBtnsId.offsetHeight
      - 2 * margin - 12; 
    // now resize to match inner window dimensions
    topBtns.width = w;
    btmBtns.width = w;
    canvas.width = w;
    canvas.height = h;
    loadSave.width = w;
    loadSave.height = h;
    ctx.fillStyle = m_clrLand;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPuzzle();
}

function mouseDown(event) {
}

function mouseUp(event) {
    // All active planks (touching planks one of which touches the position
    // of the man), are marked. If no plank is being carried, see if any of
    // these marked planks has been clicked. If so, pick it up. We are
    // generous here, the fact that the man can reach the plank even though
    // he's not actually touching it, is good enough. We defer moving the
    // man or the plank until the drop point has been nominated.
    let ptX = event.offsetX;
    let ptY = event.offsetY;
    let i;
    if (plankHeld == -1) {
        for (i = 0; i < lenPlanks; i++) {
            if (planks[i].m_bTouching &&
                planks[i].PointIsInside(ptX, ptY, m_va)) {
                pickUpPlank(i);
                resize();
                mouseX = -1;
                mouseY = -1;
                return;
            }
        }
    }

    // See if we're putting down a held plank
    if (plankHeld != -1) {
        let ptMx = manX ;
        let ptMy = manY;

        // A further generosity is afforded here. The plank may be laid
        // anywhere in reach of a position the man can currently get to.
        let iToggle;

        for (i = 0; (plankHeld != -1) && (i < lenPlanks); i++) {
            if (planks[i].m_bTouching) {
                // look at both ends of the held plank
                for (iToggle = 0; iToggle < 2; iToggle++) {
                    if (iToggle == 0) {
                        ptMx = planks[i].m_X1;
                        ptMy = planks[i].m_Y1;
                    } else {
                        ptMx = planks[i].m_X2;
                        ptMy = planks[i].m_Y2;
                    }

                    if (dropPlankIfInRange(ptX, ptY, ptMx, ptMy)) {
                        break;
                    }
                }
            }
        }
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawPolygon(xs, ys) {
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
        ctx.lineTo(xs[i], ys[i]);
    }
    ctx.closePath();
    ctx.stroke();
}

function fillPolygon(xs, ys) {
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
        ctx.lineTo(xs[i], ys[i]);
    }
    ctx.closePath();
    ctx.fill();
}

function drawHex(iX, iY, clrFill, clrStroke) {
    hx[0] = m_va.iLMargin + (((iX + iX + rows - iY) * 7 - 3) * m_va.iScale);
    hx[1] = hx[0];
    hx[2] = hx[1] + 7 * m_va.iScale;
    hx[3] = hx[2] + 7 * m_va.iScale;
    hx[4] = hx[3];
    hx[5] = hx[4] - (7 * m_va.iScale);

    hy[0] = m_va.iTMargin + ((iY * 12) * m_va.iScale);
    hy[1] = hy[0] + 8 * m_va.iScale;
    hy[2] = hy[1] + 4 * m_va.iScale;
    hy[3] = hy[2] - 4 * m_va.iScale;
    hy[4] = hy[3] - 8 * m_va.iScale;
    hy[5] = hy[4] - 4 * m_va.iScale;
    ctx.fillStyle = clrFill;
    fillPolygon(hx, hy);
    ctx.strokeStyle = clrStroke;
    drawPolygon(hx, hy);
}

function drawLog(iX, iY, clrFill, clrStroke) {
    let iLeft;
    let iTop;
    let iRadius;

    if (shape != hexShape) {
        iLeft = m_va.iLMargin + (iX * 8 - 2) * m_va.iScale;
        iTop = m_va.iTMargin + (iY * 8 - 2) * m_va.iScale;
        iRadius = 2 * m_va.iScale;
    } else {
        iLeft = m_va.iLMargin + ((iX + iX + rows - iY) * 7 + 1) * m_va.iScale;
        iTop = m_va.iTMargin + ((iY * 12) + 1) * m_va.iScale;
        iRadius = 3 * m_va.iScale;
    }

    ctx.fillStyle = clrFill;
    ctx.strokeStyle = clrStroke;
    ctx.beginPath();
    ctx.arc(iLeft + iRadius, iTop + iRadius, iRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

function drawPuzzle() {
    if ((canvw == 0) || (canvh == 0)) {
        m_va = new ViewAttr(0, 0, 1, 0);
    }

    // reset sizes
    let nw;
    let nh;
    canvw = canvas.width;
    canvh = canvas.height;

    if (shape == hexShape) {
        nw = Math.floor(canvw / (((cols * 2) + 1 + rows) * 7));
        nh = Math.floor(canvh / ((rows + 1) * 12));

    } else {
        nw = Math.floor(canvw / (cols * 8));
        nh = Math.floor(canvh / ((rows + 1) * 8));
    }

    if (nw > nh) {
        nw = nh;
    }

    if (shape == hexShape) {
        m_va.setVA(Math.floor((canvw -
            (((cols * 2) + rows) * 7 * nw)) / 2),
            Math.floor((canvh - (rows * 12) * nw) / 2), nw, rows);
    } else {
        m_va.setVA(Math.floor((canvw - ((cols - 1) * 8 * nw)) / 2),
            Math.floor((canvh - ((rows - 1) * 8 * nw)) / 2), nw, 0);
    }

    let clr = m_clrSwampWin;
    if ((manX != targetX) || (manY != targetY)) {
        clr = m_clrSwamp;
    }

    let xMin = 0;
    let xMax = cols - 1;
    let iY;

    if ((startX == 0) || (targetX == 0)) {
        // if there are no other nodes in column 0, place xMin on the bank
        for (iY = 0; iY < rows; iY++) {
            if ((iY == startY) || (iY == targetY)) {
                continue;
            }
            if ((playArea[iY * cols] & byLog) != 0) {
                break;
            }
        }
        if (iY == rows) {
            // the start/finish point stands alone in column 0
            xMin++;    // so move the swamp left edge one column to the right
        }
    }

    if ((startX == xMax) || (targetX == xMax)) {
        // if there are no other nodes in column xMax, place xMax on the bank
        for (iY = 0; iY < rows; iY++) {
            if ((iY == startY) || (iY == targetY)) {
                continue;
            }
            if ((playArea[iY * cols + xMax] & byLog) != 0) {
                break;
            }
        }
        if (iY == rows) {
            // the start/finish point stands alone in the right hand column
            xMax--;     // so move the swamp right edge one column to the left
        }
    }

    ctx.fillStyle = clr;

    if (shape != hexShape) {
        ctx.fillRect(m_va.iLMargin + ((xMin * 8) - 4) * m_va.iScale,
            m_va.iTMargin - 4 * m_va.iScale,
            (xMax - xMin + 1) * 8 * m_va.iScale,
            canvh - 2 * m_va.iTMargin + 8 * m_va.iScale);
    }

    ctx.strokeStyle = m_clrGrid;
    
    for (let iY = 0; iY < rows; iY++) {
        if (shape == hexShape) {
            for (let iX = xMin; iX <= xMax; iX++) {
                // fill the swamp area with hexagons
                drawHex(iX, iY, clr, m_clrGrid);
            }
        } else {
            // cover the swamp area with a grid
            drawLine(m_va.iLMargin + xMin * 8 * m_va.iScale,
                m_va.iTMargin + (iY * 8 * m_va.iScale),
                m_va.iLMargin + (xMax * 8 * m_va.iScale),
                m_va.iTMargin + (iY * 8 * m_va.iScale));
        }
    }

    // if the start or end point is on the bank,
    // extend grid lines to start/target positions
    if (xMin != 0) {
        if (shape == hexShape) {
            if (startX == 0) {
                drawHex(startX, startY, m_clrLand, m_clrGrid);
            }
            if (targetX == 0) {
                drawHex(targetX, targetY, m_clrLand, m_clrGrid);
            }
        } else {
            ctx.strokeStyle = m_clrGrid;
            if (startX == 0) {
                drawLine(m_va.iLMargin + 8 * m_va.iScale,
                    m_va.iTMargin + startY * 8 * m_va.iScale,
                    m_va.iLMargin,
                    m_va.iTMargin + startY * 8 * m_va.iScale);
            }
            if (targetX == 0) {
                drawLine(m_va.iLMargin + 8 * m_va.iScale,
                    m_va.iTMargin + targetY * 8 * m_va.iScale,
                    m_va.iLMargin,
                    m_va.iTMargin + targetY * 8 * m_va.iScale);
            }
        }
    }

    if (xMax != (cols - 1)) {
        if (shape == hexShape) {
            if (startX == (cols - 1)) {
                drawHex(startX, startY, m_clrLand, m_clrGrid);
            }
            if (targetX == (cols - 1)) {
                drawHex(targetX, targetY, m_clrLand, m_clrGrid);
            }
        } else {
            ctx.strokeStyle = m_clrGrid;
            if (startX == (xMax + 1)) {
                drawLine(m_va.iLMargin + (cols - 2) * 8 * m_va.iScale,
                            m_va.iTMargin + startY * 8 * m_va.iScale,
                            m_va.iLMargin + (cols - 1) * 8 * m_va.iScale,
                            m_va.iTMargin + startY * 8 * m_va.iScale);
            }
            if (targetX == (xMax + 1)) {
                drawLine(m_va.iLMargin + (cols - 2) * 8 * m_va.iScale,
                            m_va.iTMargin + targetY * 8 * m_va.iScale,
                            m_va.iLMargin + (cols - 1) * 8 * m_va.iScale,
                            m_va.iTMargin + targetY * 8 * m_va.iScale);
            }
        }
    }

    if (shape != hexShape) {
        for (let iX = xMin; iX <= xMax; iX++) {
            drawLine(m_va.iLMargin + (iX * 8 * m_va.iScale),
                    m_va.iTMargin,
                    m_va.iLMargin + (iX * 8 * m_va.iScale),
                    m_va.iTMargin + ((rows - 1) * 8 * m_va.iScale));
        }
    }

    // now add the logs
    for (let iX = 0; iX < cols; iX++) {
        for (let iY = 0; iY < rows; iY++) {
            if ((playArea[iY * cols + iX] & byLog) != 0) {
                if (((iX == startX) && (iY == startY)) ||
                    ((iX == targetX) && (iY == targetY))) {
                    drawLog(iX, iY, m_clrTarget, m_clrGrid);
                } else {
                    drawLog(iX, iY, m_clrLog, m_clrGrid);
                }
            }
        }
    }

    let pl;

    // next redraw logs at the ends of active planks
    for (let iX = 0; iX < lenPlanks; iX++) {
        pl = planks[iX];

        if (pl.m_bTouching) {
            if (((pl.m_X1 != startX) || (pl.m_Y1 != startY)) &&
                ((pl.m_X1 != targetX) || (pl.m_Y1 != targetY))) {
                drawLog(pl.m_X1, pl.m_Y1, m_clrActiveLog, m_clrGrid);
            }
            if (((pl.m_X2 != startX) || (pl.m_Y2 != startY)) &&
                ((pl.m_X2 != targetX) || (pl.m_Y2 != targetY))) {
                drawLog(pl.m_X2, pl.m_Y2, m_clrActiveLog, m_clrGrid);
            }
        }
    }

    // draw the planks
    for (let i = 0; i < lenPlanks; i++) {
        planks[i].DrawPlank(m_va, m_clrPlank, m_clrGrid);
    }

    if ((manX == targetX) && (manY == targetY)) {
        outMessage("!! Congratulations !!", iHigh);
    }

    outMessage("\u00a9 see About", iLowMid);
    outMessage(moves, iLowRight);
}

// return true if the two lines intersect (other than at their ends)
// The a and b pairs must be presented normalised (as maintained for planks)
function planksCross(x1a, y1a, x1b, y1b, x2a, y2a, x2b, y2b) {
    let fRet = false;
    let slope1 = 1;
    let slope2 = 1;

    // Also return true if *both* ends match since this implies the
    // span is already occupied. ANG - 10/08/02
    if (((x1a == x2a) && (y1a == y2a)) && ((x1b == x2b) && (y1b == y2b))) {
        return true;
    }

    if (y1a == y1b) {
        slope1 = 0;    // horizontal
    } else if (x1a == x1b) {
        slope1 = 2;    // represents vertical
    }

    if (y2a == y2b) {
        slope2 = 0;
    } else if (x2a == x2b) {
        slope2 = 2;
    }

    if (slope1 != slope2) {
        let xAa;
        let yAa;
        let xAb;
        let yAb;
        let xBa;
        let yBa;
        let xBb;
        let yBb;

        if (slope1 < slope2) {
            xAa = x1a;
            yAa = y1a;
            xAb = x1b;
            yAb = y1b;
            xBa = x2a;
            yBa = y2a;
            xBb = x2b;
            yBb = y2b;
        } else {
            xAa = x2a;
            yAa = y2a;
            xAb = x2b;
            yAb = y2b;
            xBa = x1a;
            yBa = y1a;
            xBb = x1b;
            yBb = y1b;
        }

        switch (slope1 + slope2) {
            case 1:  // A horizontal, B diagonal
            {
                let x = yAa - yBa + xBa;    // intersection
                fRet =  (x > xAa) && (x < xAb) &&
                        (x > xBa) && (x < xBb) &&
                        (yAa > yBa) && (yAa < yBb);
            }
            break;
            case 2:  // A horizontal, B vertical
            {
                fRet =  (yAa > yBa) && (yAa < yBb) &&
                        (xBa > xAa) && (xBa < xAb);
            }
            break;
            case 3:  // A diagonal, B vertical
            {
                let y = xBa + yAa - xAa;    // intersection
                fRet  = (y > yAa) && (y < yAb) &&
                        (y > yBa) && (y < yBb) &&
                        (xBa > xAa) && (xBa < xAb);
            }
            break;
        }
    }

    return fRet;
}

function outMessage(str, where) {
    ctx.font = "14px Arial";
    let metrics = ctx.measureText(str);
    let iUp = metrics.actualBoundingBoxAscent;
    let iDown = metrics.actualBoundingBoxDescent;
    let iHeight = iUp + iDown;
    let iWidth = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
    let iX = 0;
    let iY = 0;

    switch (where) {
        case iLowLeft:
        {
            if (shape == hexShape) {
                iX = m_va.iLMargin;
                iY = m_va.iTMargin + (rows * 12 + 8) * m_va.iScale - iDown - 1;
            } else {
                iX = m_va.iLMargin + 4 * m_va.iScale - 2;
                iY = Math.floor((m_va.iTMargin * 3 - iHeight) / 2) +
                    ((cols - 1) * 8 + 2) * m_va.iScale - 1;
            }
            ctx.fillStyle = m_clrLand;
        }
        break;

        case iLowMid:
        {
            if (shape == hexShape) {
                iX = m_va.iLMargin + Math.floor(
                    ((2 * cols + rows) * 7 * m_va.iScale - iWidth) / 2);
                iY = m_va.iTMargin +
                    (rows * 12 + 8) * m_va.iScale - 2;
            } else {
                iX = m_va.iLMargin + Math.floor(
                    (((cols - 1) * 8 * m_va.iScale - iWidth) / 2) - 2);
                iY = Math.floor((m_va.iTMargin * 3 - iHeight) / 2) +
                    ((rows - 1) * 8 + 2) * m_va.iScale - 2;
            }
            ctx.fillStyle = m_clrLand;
        }
        break;

        case iLowRight:
        {
            if (shape == hexShape) {
                iX = m_va.iLMargin +
                    ((2 * cols + rows - 1) * 7 * m_va.iScale) - iWidth;
                iY = m_va.iTMargin +
                    (rows * 12 + 8) * m_va.iScale - iDown - 2;
            } else {
                iX = m_va.iLMargin +
                    ((cols - 1) * 8 - 4) * m_va.iScale - iWidth - 2;
                iY = Math.floor((m_va.iTMargin * 3 - iHeight) / 2) +
                    ((rows - 1) * 8 + 2) * m_va.iScale - 2;
            }
            ctx.fillStyle = m_clrLand;
        }
        break;

        case iHigh:
        {
            if (shape == hexShape) {
                iX = m_va.iLMargin + Math.floor(
                    ((2 * cols + rows) * 7 * m_va.iScale - iWidth) / 2);
                iY = Math.floor(
                    (m_va.iTMargin - 4 * m_va.iScale - iHeight) / 2 - 1);
            } else {
                iX = m_va.iLMargin + Math.floor(
                    ((cols - 1) * 8 * m_va.iScale - iWidth) / 2 - 2);
                iY = Math.floor(
                    (m_va.iTMargin - 4 * m_va.iScale - iHeight) / 2 - 1);
            }
        }
        ctx.fillStyle = "white";
        break;
    }

    if (iY < 0) {
        iY = 0;
    }

    ctx.fillRect(iX, iY, iWidth + 4, iHeight + 3);
    ctx.fillStyle = "black";
    ctx.fillText(str, iX + 2, iY + 2 + iUp);
}

function dropPlankIfInRange(x, y, xM, yM) {
    let xL;
    let yL;

    // look in 4 or 6 directions from where the man could be standing
    for (let d = 0; d < (shape != hexShape ? 4 : 6); d++) {
        // if the plank was lowered in an earlier direction, break out
        if (plankHeld == -1) {
            break;
        }
        // start off where the man is deemed to be
        xL = xM;
        yL = yM;

        // Now travel in the chosen direction for the length of the plank.
        // Move one unit at a time and discount directions which come across
        // logs at intermediate positions
        let i;
        let loops = planks[plankHeld].m_iLen; 

        for (i = 1; i <= loops; i++) {
            switch (d) {
            case 0:
                yL++;
                if (yL >= rows) {
                    continue;
                }
                break;
            case 1:
                xL++;
                if (xL >= cols) {
                    continue;
                }
                break;
            case 2:
                yL--;
                if (yL < 0) {
                    continue;
                }
                break;
            case 3:
                xL--;
                if (xL < 0) {
                    continue;
                }
                break;
            case 4:
                xL--;
                yL--;
                if ((xL < 0) || (yL < 0)) {
                    continue;
                }
                break;
            case 5:
                xL++;
                yL++;
                if ((xL >= cols) || (yL >= rows)) {
                    continue;
                }
                break;
            }

            if ((playArea[yL * cols + xL] & byLog) != 0) {
                // Found a log, it may be good or bad, but
                // no need to look further in this direction.
                break;
            }
        }

        if (i != loops) {
            // intermediate log found or else no log at all
            continue;   //next direction
        }

        // would a plank here cross over another plank?
        for (i = 0; i < lenPlanks; i++) {
            if (planks[i].m_bCarried) {
                // this is the plank we're thinking of placing, move on
                continue;
            }

            if ((d >= 2) && (d <= 4)) {
                if (planksCross(planks[i].m_X1, planks[i].m_Y1,
                    planks[i].m_X2, planks[i].m_Y2,
                    xL, yL, xM, yM)) {
                    break;
                }
            } else if (planksCross(planks[i].m_X1, planks[i].m_Y1,
                planks[i].m_X2, planks[i].m_Y2,
                xM, yM, xL, yL)) {
                break;
            }
        }

        if (i < lenPlanks) {
            // plank crosses another - next direction
            continue;
        }

        sparePlank.Set(xL, yL, xM, yM);

        if (sparePlank.PointIsInside(x, y, m_va)) {
            // put down plank at this position
            // is the man adjacent to it?
            if (!((manX == x) && (manY == y))) {
                // no, so first move the man
                moveMan(xM, yM);
                // and set one end of the plank to this position
            }

            lowerPlank(xL, yL);
            markActivePlanks();
            resize();
            mouseX = -1;
            mouseY = -1;
            break;
        }
    }

    return (plankHeld == -1);
}

function moveMan(x, y) {
    // Not that a carried plank is left in its original position until
    // its new position has been nominated. That way, we don't have to
    // decide in advance, at which end the man was standing when he
    // picked it up.
    manX = x;
    manY = y;
}

// Put the plank down at (xL, yL) - no validation, just do it.
// Forces one end to be where the man is standing and the other end to
// the supplied point.
function lowerPlank(xL, yL) {
    planks[plankHeld].m_X1 = manX;
    planks[plankHeld].m_Y1 = manY;
    planks[plankHeld].m_X2 = xL;
    planks[plankHeld].m_Y2 = yL;
    Normalise(planks[plankHeld]);
    planks[plankHeld].m_bCarried = false;
    plankHeld = -1;
    moves++;    // count plank moves

    if (!bReplay) {
        recordMove("L" + toExtendedHex(manX) + toExtendedHex(manY) +
                         toExtendedHex(xL) + toExtendedHex(yL));
    }

    if ((xL == targetX) && (yL == targetY)) {
        // plank extends to target, move the man onto dry land
        manX = targetX;
        manY = targetY;
    }
}

function squareOne() {
    // reset the position of each plank
    plankHeld = -1;

    for (let i = 0; i < lenPlanks; i++) {
        planks[i].Reset();
    }

    manX = startX;
    manY = startY;
    nextMove = 0;
    moves = 0;
    if (strHistory == "") {
        saveId.innerText = "Load";
    }
    markActivePlanks();
    fixButton(prevId, (puzIndx > first));
}

function replay() {
    // suppress re-recording moves
    bReplay = true;

    let i = nextMove;

    squareOne();

    while (nextMove < i) {
        redoMove();
    }

    markActivePlanks();

    // finally, clear replay flag
    bReplay = false;
    resize();
}

// pick up specifiedplank - no validation here, just do it
function pickUpPlank(indx) {
    planks[indx].m_bCarried = true;
    plankHeld = indx;

    if (!bReplay) {
        recordMove("P" + (indx + 1));
    }
}

function markActivePlanks() {
    // See which planks are touching the man directly.
    // A carried plank is not moved until it is dropped again,
    // so it can be included in this test.
    let i;

    for (i = 0; i < lenPlanks; i++) {
        planks[i].m_bTouching =
            ((planks[i].m_X1 == manX) && (planks[i].m_Y1 == manY)) ||
            ((planks[i].m_X2 == manX) && (planks[i].m_Y2 == manY));
    }

    // Now add planks which touch marked planks.
    let j;
    let bFound;

    do {
        bFound = false;

        for (i = 0; i < lenPlanks; i++) {
            if (!planks[i].m_bTouching) {
                for (j = 0; j < lenPlanks; j++) {
                    if (planks[j].m_bTouching &&
                        (((planks[i].m_X1 == planks[j].m_X1) &&
                          (planks[i].m_Y1 == planks[j].m_Y1)
                         ) ||
                         ((planks[i].m_X1 == planks[j].m_X2) &&
                          (planks[i].m_Y1 == planks[j].m_Y2)
                         ) ||
                         ((planks[i].m_X2 == planks[j].m_X1) &&
                          (planks[i].m_Y2 == planks[j].m_Y1)
                         ) ||
                         ((planks[i].m_X2 == planks[j].m_X2) &&
                          (planks[i].m_Y2 == planks[j].m_Y2)
                         )
                        )
                       ) {
                        planks[i].m_bTouching = true;
                        bFound = true;
                        break;
                    }
                }

                if (j < lenPlanks) {
                    break;
                }
            }
        }
    } while (bFound);
}

function recordMove(str) {
    if (nextMove < strHistory.length) {
        let iLen = str.length;

        // New move made after undoing.
        // Is this really new or a manual replay?
        if (strHistory.substr(nextMove, iLen) != str) {
            // undo followed by a change. Discard remaining history.
            strHistory = strHistory.substr(0, nextMove) + str;
        }

        nextMove += iLen;
    } else {
        if (strHistory.length == 0) {
            // about to record first move, change "Load" button to "Save"
            saveId.innerText = "Save";
        }

        strHistory += str;
        nextMove = strHistory.length;
    }
}

function parseLoadString(txt) {
    let lines = txt.split(/\r\n|\r|\n/);

    if (lines[0].trim() != "Planks format 1") {
        return {'msg':`Doesn't begin with "Planks format 1"`};
    }

    lines.shift();
    let positions = lines.shift();

    if (positions == undefined) {
        return {'msg':'Position string must be on line 2'};
    }

    positions = positions.split('=');

    if ((positions.length != 2) || (positions[0].trim() != 'Positions')) {
        return {'msg':'Invalid position format'};
    }

    positions = positions[1].trim();

    if (!positions.startsWith('"') || !positions.endsWith('"')) {
        return {'msg':'Invalid position format'};
    }

    positions = positions.substring(1, positions.length - 1);
    let len = positions.length;
    let rem = len % 4;

    if (((rem != 2) && (rem != 3)) ||
        ((rem == 3) && (!positions.endsWith('6'))) || (len < 6)) {
        return {'msg':'Positions are not valid'};
    }

    let nodes = lines.shift();

    if (nodes == undefined) {
        return {'msg':'Node string must be on line 3'};
    }

    nodes = nodes.split('=');

    if ((nodes.length != 2) || (nodes[0].trim() != 'Nodes')) {
        return {'msg':'Invalid node format'};
    }

    nodes = nodes[1].trim();

    if ((!(nodes.startsWith('"'))) || (!(nodes.endsWith('"')))) {
        return {'msg':'Invalid node format'};
    }

    nodes = nodes.substring(1, nodes.length - 1);

    let count = 0;
    let expectedRows = parseInt(positions.charAt(1), 36);

    while (count < nodes.length) {
        count += parseInt(nodes.charAt(count), 36) + 1;
        expectedRows--;
    }

    if ((count != nodes.length) || (expectedRows != 0)) {
        return {'msg':'Nodes are not valid'};
    }

    // parse History
    let history = "";

    while (lines.length > 0) {
        let move = lines.shift();

        move = move.split("->");
        move[0] = move[0].trim();

        if (move[0].charAt(0) != "P") {
            break;
        }

        move[0] = move[0].substring(1);    // drop the P

        if (move[0].length == 0) {
            break;
        }

        if (isNaN(parseInt(move[0], 36))) {
            break;
        }

        move[0] = parseInt(move[0], 36);
        history += "P" + move[0];

        if ((move[1] == undefined) || (move[1].trim == "")) {
            break;
        }

        move[1] = move[1].replace(/\(|\)| |-|,|/g, "");

        if (move[1].length != 4) {
            break;
        }

        let pos = [ parseInt(move[1].charAt(0), 36),
                    parseInt(move[1].charAt(1), 36),
                    parseInt(move[1].charAt(2), 36),
                    parseInt(move[1].charAt(3), 36) ];
        if (isNaN(pos[0]) || isNaN(pos[1]) || isNaN(pos[2]) || isNaN(pos[3])) {
            break;
        }

        history += "L" + move[1].charAt(0) + move[1].charAt(1) +
                         move[1].charAt(2) + move[1].charAt(3);
    }

    return {'msg':"Success", 'nodes':nodes, 'positions':positions,
            'history':history};
}

// mark position in history string one move before current mark
// return true if a move was available to undo - 
//        false if already at the starting blocks
function undoMove() {
    let bRet = true;

    if (nextMove == 0) {
        bRet = false;
    } else {
        // There are two types of entry in the history string:
        // Pn      to pick up plank n, where n is a decimal digit
        // Lxyij   to lower the helf plank at (x,y), (i,j)
        nextMove -= 2;    // undoes the first format

        if (strHistory.charAt(nextMove) != 'P') {
            // not format 1, so back off another 3 chars
            nextMove -= 3;
        }
    }

    return bRet;
}

function fnUndo() {
    if (undoMove()) {
        // replay all the moves to the backed-off position
        replay();
        ctx.fillStyle = m_clrLand;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPuzzle();
    }
}

// Redo move from history
function redoMove() {
    if (strHistory.charAt(nextMove) == 'P') {
        // pick up plank
        nextMove++;
        pickUpPlank(parseInt(strHistory.charAt(nextMove++), 36) - 1);
    } else if (strHistory.charAt(nextMove) == 'L') {
        // lower plank
        nextMove++;
        let i = parseInt(strHistory.charAt(nextMove++), 36);
        manX = i;
        manY = parseInt(strHistory.charAt(nextMove++), 36);
        i = parseInt(strHistory.charAt(nextMove++), 36);
        lowerPlank(i, parseInt(strHistory.charAt(nextMove++), 36));
    }
}

function fnRedo() {
    bReplay = true;

    if (nextMove < strHistory.length) {
        redoMove();
    }

    bReplay = false;
    markActivePlanks();
    resize();
}
