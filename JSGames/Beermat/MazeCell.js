// vi:se ts=40 sw=4 ai ml:

"use strict";

// attributes held in MazeCell.attr
const T = 1;
const N = 2;
const E = 4;
const S = 8;
const W = 0x10;
const Q1 = 0x20;
const Q2 = 0x40;
const OUTR = 0x80;
const CNTR = 0x100;

const DIRS = 0x1e;    // N | E | S | W
const NTDR = ~0x1e;   // not direction bits
const mask = (Q1 | Q2 | CNTR | OUTR);

class MazeCell {
    constructor(left) {
        this.left = left;
        this.right = null;
        this.up = null;
        this.down = null;
        this.attr = 0;
    }

    light() {
        return ((this.attr & 1) == 0);
    }

    dark() {
        return ((this.attr & 1) != 0);
    }

    // clear direction bits
    wipe() {
        this.attr &= NTDR;
    }

    // function to keep nodes around start/end point in sync
    dupAttrs() {
        switch (((this.attr & mask) >> 5) - 4) {
        case 0: // OUTR 0
            this.right.attr     &= NTDR;        // OUTR 1, clear direction bits
            this.right.attr     |= (this.attr & DIRS);   // OUTR 1 cpy dir bits
            break;
        case 1: // OUTR 1
            this.left.attr      &= NTDR;        // OUTR 0, clear dir bits
            this.left.attr      |= (this.attr & DIRS);   // OUTR 0 cpy dir bits
            break;
        case 2: // OUTR 2
            this.down.attr      &= NTDR;        // OUTR 3, clear dir bits
            this.down.attr      |= (this.attr & DIRS);   // OUTR 3 cpy dir bits
            break;
        case 3: // OUTR 3
            this.up.attr        &= NTDR;        // OUTR 2, clear dir bits
            this.up.attr        |= (this.attr & DIRS);   // OUTR 2 cpy dir bits
            break;
        case 4: // CNTR 0
            this.right.attr     &= NTDR;        // CNTR 1, clear dir bits
            this.right.attr     |= (this.attr & DIRS);   // CNTR 1 cpy dir bits
            this.down.attr      &= NTDR;        // CNTR 2, clear dir bits
            this.down.attr      |= (this.attr & DIRS);   // CNTR 2 cpy dir bits
            this.down.right.attr &= NTDR;       // CNTR 3, // clear dir bits
            this.down.right.attr |= (this.attr & DIRS);   // CNTR 3 cpy dirs
            break;
        case 5: // CNTR 1
            this.left.attr      &= NTDR;        // CNTR 0, clear dir bits
            this.left.attr      |= (this.attr & DIRS);   // CNTR 0 cpy dirs
            this.left.down.attr &= NTDR;        // CNTR 2, clear dir bits
            this.left.down.attr |= (this.attr & DIRS);   // CNTR 2 cpy dirs
            this.down.attr      &= NTDR;        // CNTR 3, clear dir bits
            this.down.attr      |= (this.attr & DIRS);   // CNTR 3 cpy dirs
            break;
        case 6: // CNTR 2
            this.up.attr        &= NTDR;        // CNTR 0, clear dir bits
            this.up.attr        |= (this.attr & DIRS);   // CNTR 0 cpy dirs
            this.up.right.attr  &= NTDR;        // CNTR 1, clear dir bits
            this.up.right.attr  |= (this.attr & DIRS);   // CNTR 1 cpy dirs
            this.right.attr     &= NTDR;        // CNTR 3, clear dir bits
            this.right.attr     |= (this.attr & DIRS);   // CNTR 3 cpy dirs
            break;
        case 7: // CNTR 3
            this.up.left.attr   &= NTDR;        // CNTR 0, clear dir bits
            this.up.left.attr   |= (this.attr & DIRS);   // CNTR 0
            this.up.attr        &= NTDR;        // CNTR 1, clear dir bits
            this.up.attr        |= (this.attr & DIRS);   // CNTR 1 cpy dirs
            this.left.attr      &= NTDR;        // CNTR 2, clear dir bits
            this.left.attr      |= (this.attr & DIRS);   // CNTR 2 cpy dirs
            break;
        }
    }

    invertN() {
        this.attr ^= 2;
        if ((this.attr & (OUTR | CNTR)) != 0) {
            this.dupAttrs();
        }
    }

    invertE() {
        this.attr ^= 4;
        if ((this.attr & (OUTR | CNTR)) != 0) {
            this.dupAttrs();
        }
    }

    invertS() {
        this.attr ^= 8;
        if ((this.attr & (OUTR | CNTR)) != 0) {
            this.dupAttrs();
        }
    }

    invertW() {
        this.attr ^= 0x10;
        if ((this.attr & (OUTR | CNTR)) != 0) {
            this.dupAttrs();
        }
    }

    North() {
        return ((this.attr & 2) != 0);
    }

    East() {
        return ((this.attr & 4) != 0);
    }

    South() {
        return ((this.attr & 8) != 0);
    }

    West() {
        return ((this.attr & 0x10) != 0);
    }
}


let A = 'A'.codePointAt(0);
let Z = 'Z'.codePointAt(0);
let a = 'a'.codePointAt(0);
let z = 'z'.codePointAt(0);

function fetch(x) {
    let c = bmTbl.codePointAt(x);
    return ((c >= A && c <= Z) ? (c - A) :
            (c >= a && c <= z) ? (c - a + 26) : -1);
}

let bmTbl =
    "ttAMPPDABKBBNBBNAEAKAELAELAFBJAGJAGJAGBBHAIHAIHAHBBBFAKHAIFAIBADDBDAIH" +
    "AIFAHBAGFAIDBDAIHAEBAHFAMDAIDBDADBAIFAKFAKFBBBAHHAIHAIHBBAGJAGJAGJBAFL" +
    "AELAEKBAENBBNBBKBBADKEBKEBKBBBBBKBEKBEKADBBKBBNBBNAEBKAELAELAFAJAGJAGJ" +
    "AGABHAIHAIHAHABBFAKFAKHAGAADDBDAIDBDAIHAFAAGFAKFAIFAGAAHFAKFAIDBDADAAI" +
    "FAKFAKFBBAAHHAIHAIHBAAGJAGJAGJAAFLAELAEKAAENBBNBBKBAADKEBKEBKBBABBKBEK" +
    "BEKADABKBBNBBNAEAKAELAELAFBJAGJAGJAGBBHAIHAIHAHBBBFAKFAKFAIBADDAMFAKDA" +
    "JBAEDBDAIDAMDBDAEBAFHAMDAKFADBAGHAKFAKFBBBAHHAIHAIHBBAGJAGJAGJBAFLAELA" +
    "EKBAENBBNBBKBBDPPMOddOOOdd";

let cols = fetch(0);
let rows = fetch(1);
let head = null;
let prevCell = null;
let curCell = null;
let prevRow = null;
let curRow = null;
let curClr = 0;
let row = 0;
let col = 0;
let curNode = null;
let whiteEP1x = 0;
let whiteEP1y = 0;
let whiteEP1node = null;
let whiteEP2x = 0;
let whiteEP2y = 0;
let whiteEP2node = null;
let blackEP1x = 0;
let blackEP1y = 0;
let blackEP1node = null;
let blackEP2x = 0;
let blackEP2y = 0;
let blackEP2node = null;
let whites = 0;
let blacks = 0;
let active = false;
let awayFromHome = false;
let startX = 0;
let startY = 0;
let startNode = null;
let endX = 0;
let endY = 0;
let curX = 0;
let curY = 0;
let btnPressed = null;
let btnGroup = null;
let NorthBtn = null;
let EastBtn = null;
let SouthBtn = null;
let WestBtn = null;

function findCell(c, r) {
    let n = 0;
    let cell = head;
    for (n = 0; n < c; n++) {
        cell = cell.right;
    }
    for (n = 0; n < r; n++) {
        cell = cell.down;
    }
    return cell;
}

// create all cells for maze
// initially, the top row is created and its left and right pointers set up.
head = prevRow = prevCell = new MazeCell(null); // top left cell

// chain on the rest of the top row
for (col = 1; col < cols; col++) {
    curCell = new MazeCell(prevCell);
    prevCell.right = curCell;
    prevCell = curCell;
}

// now, as each row is created, the row above is pointed down to it and
// items in the new row are pointed up.
for (row = 1; row < rows; row++) {
    prevRow.down = curRow = prevCell = new MazeCell(null);
    curRow.up = prevRow;
    prevRow = prevRow.right;
    for (col = 1; col < cols; col++) {
        prevRow.down = curCell = new MazeCell(prevCell);
        curCell.up = prevRow;
        prevCell.right = curCell;
        prevCell = curCell;
        prevRow = prevRow.right;
    }
    prevRow = curRow;
}

curCell = curRow = head;
let i = 2;
let v = 0;
let n = 0;

for (row = 0; row < rows; row++) {
    v = fetch(i++);

    if ((v < 0) || (v > 1)) {
        alert(`Faulty maze data, row ${row}, first byte $v, not 0 or 1`);
        break;
    }

    for (col = 0; col < cols;) {
        n = fetch(i++);
        if (n == 0) {
            n = fetch(i++);

            if (n == 0) {
                alert(`Faulty maze data, row ${row}, col ${col}, 2 zeroes`);
                break;
            }

            if ((col + n) > cols) {
alert(`Faulty maze data, row ${row}, col ${col} + ${n} exceeds width ${cols}`);
                break;
            } else {
                for (; n > 0; n--) {
                    curCell.attr = v;
                    curCell = curCell.right;
                    col++;
                    v ^= 1;        // switch light/dark
                }
            }
        } else {
            if ((col + n) > cols) {
alert(`Faulty maze data, row ${row}, col ${col} + ${n} exceeds width ${cols}`);
                break;
            } else {
                for(; n > 0; n--) {
                    curCell.attr = v;
                    curCell = curCell.right;
                    col++;
                }
                v ^= 1;            // switch light/dark
            }
        }

        if (col > cols) {
        alert(`Faulty maze data, row ${row}, col ${col} exceeds width ${cols}`);
            break;
        }
    }

    // end of row, reset to start of next row
    curCell = curRow = curRow.down;
}
n = bmTbl.length - i;
if (n != 8) {
    alert(`Maze data should end with 4 pairs of co-ords but residue is ${n}`);
} else {
    for (n = 0; n < 4; n++) {
        col = fetch(i++);
        row = fetch(i++);
        if ((col > 0) && ((col + 2) < cols) &&
                (row > 0) && ((row + 2) < rows)) {
            let ep = findCell(col, row);
            ep.attr            |= CNTR;
            ep.right.attr      |= (CNTR | Q1);
            ep.down.attr       |= (CNTR | Q2);
            ep.right.down.attr |= (CNTR | Q1 | Q2);

            ep.up.attr              |= OUTR;
            ep.up.right.attr        |= (OUTR | Q1);
            ep.down.down.attr       |= OUTR;
            ep.down.down.right.attr |= (OUTR | Q1);

            ep.left.attr             |= (OUTR | Q2);
            ep.left.down.attr        |= (OUTR | Q1 | Q2);
            ep.right.right.attr      |= (OUTR | Q2);
            ep.right.right.down.attr |= (OUTR | Q1 | Q2);
            
            if (ep.light()) {
                if (whites++ == 0) {
                    whiteEP2x = col;
                    whiteEP2y = row;
                    whiteEP2node = ep;
                } else {
                    whiteEP1x = col;
                    whiteEP1y = row;
                    whiteEP1node = ep;
                }
            } else {
                if (blacks++ == 0) {
                    blackEP1x = col;
                    blackEP1y = row;
                    blackEP1node = ep;
                } else {
                    blackEP2x = col;
                    blackEP2y = row;
                    blackEP2node = ep;
                }
            }
        } else {
            alert(`end-point(${col}, ${row}) outside maze`);
        }
    }
}

let selected = null;
const canvas = document.getElementById('beermat');
const ctx = canvas.getContext('2d');
let cWidth = canvas.width;
let cHeight = canvas.height;
ctx.fillStyle = "#000000";
ctx.fillRect(0, 0, cWidth, cHeight);
let border = 24;
let cw = (cWidth < cHeight ? cWidth - 2 * border : cHeight - 2 * border);
let w = Math.floor(cw / cols);
let w1 = 0;
let w2 = Math.floor((w + 1) / 2);
let xo = w2;
let h = Math.floor(cw / rows);
let h1 = 0;
let h2 = Math.floor((h + 1) / 2);
let yo = h2;
let x = border;
let y = cHeight - border - cw;
let clridx = 0;
let clr = "";
let lightTrackFinished = false;
let darkTrackFinished = false;

class HLButton {
    constructor(bx, by, bw, bh, bLabel) {
        this.bx = bx;
        this.by = by;
        this.bw = bw;
        this.bh = bh;
        this.bLabel = bLabel;
        this.bPressed = false;
        this.bSelected = false;
        this.next = null;        // next button in group
    }

    isPressed() {
        return (this.bPressed);
    }

    isSelected() {
        return (this.bPressed);
    }

    draw() {
        let wi = 0;
        let he = 0;
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(this.bx, this.by, this.bw, this.bh);
        ctx.fillStyle = (this.isPressed() ? "#ffffff" : "#808080");
        ctx.fillRect(this.bx, this.by + this.bh - 2, this.bw, 2);
        ctx.fillRect(this.bx + this.bw - 2, this.by, 2, this.bh);
        ctx.fillStyle = (this.isPressed() ? "#808080" : "#ffffff");
        ctx.fillRect(this.bx, this.by, this.bw, 1);
        ctx.fillRect(this.bx, this.by + 1, this.bw - 1, 1);
        ctx.fillRect(this.bx, this.by, 1, this.bh);
        ctx.fillRect(this.bx + 1, this.by, 1, this.bh - 1);
        ctx.font = "12px sans-serif";
        let tm = ctx.measureText(this.bLabel);
        if (!isNaN(tm.width)) {
            wi = tm.width;
        } else if (!isNAN(tm.actualBoundingBoxRight)) {
            wi = tm.tm.actualBoundingBoxRight;
        } else {
            wi = 8;
        }
        if (!isNaN(tm.height)) {
            he = tm.height;
        } else if (!isNaN(tm.actualBoundingBoxAscent)) {
            he = tm.actualBoundingBoxAscent;
        } else {
            he = 8;
        }
        let xx = this.bx + (this.bw - wi) / 2;
        let yy = this.by + (this.bh + he) / 2;
        ctx.fillStyle = "#000000";
        ctx.fillText(this.bLabel, xx, yy);
    }
}

btnGroup = NorthBtn = new HLButton(1, 1, 2 * border + w * cols, border, "N");
NorthBtn.next = WestBtn =
    new HLButton(1, 1 + border, border, h * rows, "W");
WestBtn.next = EastBtn =
    new HLButton(1 + border + w * cols, 1 + border, border, h * rows, "E");
EastBtn.next = SouthBtn =
    new HLButton(1, 1 + border + h * rows, 2 * border + w * cols, border, "S");

let btn = btnGroup;

while (btn != null) {
    btn.draw();
    btn = btn.next;
}

function drawN() {
    if ((curNode.attr & (CNTR | OUTR)) == 0) {
        // normal node
        xo = curX * w + w2 - 1;
        yo = curY * h;
        w1 = 2;
        h1 = h2 + 1;
    } else {
        switch (((curNode.attr & mask) >> 5) - 4) {
        case 0:  // OUTR 0
            xo = curX * w + w - 1;
            yo = curY * h;
            w1 = 2;
            h1 = h2 + 1;
            break
        case 1:  // OUTR 1
            xo = curX * w - 1;
            yo = curY * h;
            w1 = 2;
            h1 = h2 + 1;
            break;
        case 2:  // OUTR 2
            xo = curX * w + w2 - 1;
            yo = curY * h;
            w1 = 2;
            h1 = h + 1;
            break;
        case 3:  // OUTR 3
            xo = curX * w + w2 - 1;
            yo = curY * h - h;
            w1 = 2;
            h1 = h + 1;
            break;
        case 4:  // CNTR 0
            xo = curX * w + w - 1;
            yo = curY * h;
            w1 = 2;
            h1 = h2;
            break;
        case 5:  // CNTR 1
            xo = curX * w - 1;
            yo = curY * h;
            w1 = 2;
            h1 = h2;
            break;
        case 6:  // CNTR 2
            xo = curX * w + w - 1;
            yo = curY * h - h;
            w1 = 2;
            h1 = h2;
            break;
        case 7:  // CNTR 3
            xo = curX * w - 1;
            yo = curY * h - h;
            w1 = 2;
            h1 = h2;
            break;
        default:
            return;
        }
    }

    if (curNode.North()) {
        ctx.fillStyle = (curNode.light() ? "white" : "black");
        ctx.fillRect(x + xo, y + yo, w1, h1);
    } else if (curNode.light()) {
        for (i = yo; i < yo + h1; i++) {
            clridx = Math.floor((255 * i) / (h * rows - 1));
            ctx.fillStyle = "rgb(0, " + `${clridx}` + ", " +
                (255 - `${clridx}`).toString() + ")";
            ctx.fillRect(x + xo, y + i, w1, 1);
        }
    } else {
        for (i = xo; i < xo + 2; i++) {
            clridx = Math.floor((255 * i) / (w * cols - 1));
            ctx.fillStyle = "rgb(255, " + `${clridx}` + ", 0)";
            ctx.fillRect(x + i, y + yo, 1, h1);
        }
    }
}

function drawE() {
    if ((curNode.attr & (CNTR | OUTR)) == 0) {
        // normal node
        xo = curX * w + w2 - 1;
        yo = curY * h + h2 - 1;
        w1 = w2 + 1;
        h1 = 2;
    } else {
        switch (((curNode.attr & mask) >> 5) - 4) {
        case 0:  // OUTR 0
            xo = curX * w + w - 1;
            yo = curY * h + h2 - 1;
            w1 = w + 1;
            h1 = 2;
            break;
        case 1:  // OUTR 1
            xo = curX * w - 1;
            yo = curY * h + h2 - 1;
            w1 = w + 1;
            h1 = 2;
            break;
        case 2:  // OUTR 2
            xo = curX * w + w2;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 3:  // OUTR 3
            xo = curX * w + w2;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 4:  // CNTR 0
            xo = curX * w + w + w2;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 5:  // CNTR 1
            xo = curX * w + w2;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 6:  // CNTR 2
            xo = curX * w + w + w2;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 7:  // CNTR 3
            xo = curX * w + w2;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        default:
            return;
        }
    }

    if (curNode.East()) {
        ctx.fillStyle = (curNode.light() ? "white" : "black");
        ctx.fillRect(x + xo, y + yo, w1, h1);
    } else if (curNode.light()) {
        for (i = yo; i < yo + h1; i++) {
            clridx = Math.floor((255 * i) / (h * rows - 1));
            ctx.fillStyle = "rgb(0, " + `${clridx}` + ", " +
                (255 - `${clridx}`).toString() + ")";
            ctx.fillRect(x + xo, y + i, w1, 1);
        }
    } else {
        for (i = xo; i < xo + w1; i++) {
            clridx = Math.floor((255 * i) / (w * cols - 1));
            ctx.fillStyle = "rgb(255, " + `${clridx}` + ", 0)";
            ctx.fillRect(x + i, y + yo, 1, h1);
        }
    }
}

function drawS() {
    if ((curNode.attr & (CNTR | OUTR)) == 0) {
        // normal node
        xo = curX * w + w2 - 1;
        yo = curY * h + w2 - 1;
        w1 = 2;
        h1 = h2 + 1;
    } else {
        switch (((curNode.attr & mask) >> 5) - 4) {
        case 0:  // OUTR 0
            xo = curX * w + w - 1;
            yo = curY * h + h2 - 1;
            w1 = 2;
            h1 = h2 + 1;
            break;
        case 1: // OUTR 1
            xo = curX * w - 1;
            yo = curY * h + h2 - 1;
            w1 = 2;
            h1 = h2 + 1;
            break;
        case 2:  // OUTR 2
            xo = curX * w + w2 - 1;
            yo = curY * w + w + w2 - 1;
            w1 = 2;
            h1 = h + 1;
            break;
        case 3:  // OUTR 3:
            xo = curX * w + w2 - 1;
            yo = curY * h - 1;
            w1 = 2;
            h1 = h + 1;
            break;
        case 4:  // CNTR 0
            xo = curX * w + w - 1;
            yo = curY * h + h + h2;
            w1 = 2;
            h1 = h2;
            break;
        case 5:  // CNTR 1
            xo = curX * w - 1;
            yo = curY * h + h + h2;
            w1 = 2;
            h1 = h2;
            break;
        case 6:  // CNTR 2
            xo = curX * w + w - 1;
            yo = curY * h + h2;
            w1 = 2;
            h1 = h2;
            break;
        case 7:  // CNTR 3
            xo = curX * w - 1;
            yo = curY * h + h2;
            w1 = 2;
            h1 = h2;
            break;
        default:
            return;
        }
    }

    if (curNode.South()) {
        ctx.fillStyle = (curNode.light() ? "white" : "black");
        ctx.fillRect(x + xo, y + yo, w1, h1);
    } else if (curNode.light()) {
        for (i = yo; i < yo + h1; i++) {
            clridx = Math.floor((255 * i) / (h * rows - 1));
            ctx.fillStyle = "rgb(0, " + `${clridx}` + ", " +
                (255 - `${clridx}`).toString() + ")";
            ctx.fillRect(x + xo, y + i, w1, 1);
        }
    } else {
        for (i = xo; i < xo + w1; i++) {
            clridx = Math.floor((255 * i) / (w * cols - 1));
            ctx.fillStyle = "rgb(255, " + `${clridx}` + ", 0)";
            ctx.fillRect(x + i, y + yo, 1, h1);
        }
    }
}

function drawW() {
    if ((curNode.attr & (CNTR | OUTR)) == 0) {
        // normal node
        xo = curX * w;
        yo = curY * h + h2 - 1;
        w1 = w2 + 1;
        h1 = 2;
    } else {
        switch (((curNode.attr & mask) >> 5) - 4) {
        case 0:  // OUTR 0
            xo = curX * w;
            yo = curY * h + h2 - 1;
            w1 = w + 1;
            h1 = 2;
            break;
        case 1:  // OUTR 1
            xo = curX * w - w;
            yo = curY * h + h2 - 1;
            w1 = w + 1;
            h1 = 2;
            break;
        case 2:  // OUTR 2
            xo = curX * w;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 3:  // OUTR 3
            xo = curX * w;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 4:  // CNTR 0
            xo = curX * w;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 5:  // CNTR 1
            xo = curX * w - w;
            yo = curY * h + h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 6:  // CNTR 2
            xo = curX * w;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        case 7:  // CNTR 3
            xo = curX * w - w;
            yo = curY * h - 1;
            w1 = w2;
            h1 = 2;
            break;
        default:
            return;
        }
    }

    if (curNode.West()) {
        ctx.fillStyle = (curNode.light() ? "white" : "black");
        ctx.fillRect(x + xo, y + yo, w1, h1);
    } else if (curNode.light()) {
        for (i = yo; i < yo + h1; i++) {
            clridx = Math.floor((255 * i) / (h * rows - 1));
            ctx.fillStyle = "rgb(0, " + `${clridx}` + ", " +
                (255 - `${clridx}`).toString() + ")";
            ctx.fillRect(x + xo, y + i, w1, 1);
        }
    } else {
        for (i = xo; i < xo + w1; i++) {
            clridx = Math.floor((255 * i) / (w * cols - 1));
            ctx.fillStyle = "rgb(255, " + `${clridx}` + ", 0)";
            ctx.fillRect(x + i, y + yo, 1, h1);
        }
    }
}

function paintMaze() {
    let hold = curNode;
    let xx = curX;
    let yy = curY;
    curNode = curRow = head;

    // paint maze
    for (curY = 0; curY < rows; curY++) {
        for (curX = 0; curX < cols; curX++) {
            if (curNode.light()) {
                for (i = curY * h; i < curY * h + h; i++) {
                    clridx = Math.floor((255 * i) / (h * rows - 1));
                    ctx.fillStyle = "rgb(0, " + `${clridx}` + ", " +
                        (255 - `${clridx}`).toString() + ")";
                    ctx.fillRect(x + curX * w, y + i, w, 1);
                }
                ctx.fillStyle = "white";
            } else {
                for (i = curX * w; i < curX * w + w; i++) {
                    clridx = Math.floor((255 * i) / (w * cols - 1));
                    ctx.fillStyle = "rgb(255, " + `${clridx}` + ", 0)";
                    ctx.fillRect(x + i, y + curY * h, 1, h);
                }
                ctx.fillStyle = "black";
            }

            if (curNode.West()) {
                drawW();
            }

            if (curNode.East()) {
                drawE();
            }

            if (curNode.North()) {
                drawN();
            }

            if (curNode.South()) {
                drawS();
            }

            curNode = curNode.right;
        }
        curRow = curRow.down;
        curNode = curRow;
    }

    // insert start and end points
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(x + (whiteEP1x + 1) * w - w2, y + (whiteEP1y + 1) * h - h2,
                    w, h);

    ctx.fillRect(x + (whiteEP2x + 1) * w - w2, y + (whiteEP2y + 1) * h - h2,
                    w, h);

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(x + (blackEP1x + 1) * w - w2, y + (blackEP1y + 1) * h - h2,
                    w, h);

    ctx.fillRect(x + (blackEP2x + 1) * w - w2, y + (blackEP2y + 1) * h - h2,
                    w, h);
    curNode = hold;
    curX = xx;
    curY = yy;
}

paintMaze();

function resetWhite() {
    let b = false;
    let hold = curNode;
    curNode = curRow = head;

    for (row = 0; row < rows; row++) {
        for (col = 0; col < cols; col++) {
            if (curNode.light()) {
                curNode.wipe();
            }
            curNode = curNode.right;
        }
        curRow = curRow.down;
        curNode = curRow;
    }

    if (curClr == 0) {
        curX = startX;
        curY = startY;
        curNode = startNode;
        b = active;
        active = false;
    } else {
        curNode = hold;
    }

    lightTrackFinished = false;
    return b;
}

function resetBlack() {
    let b = false;
    let hold = curNode;
    curNode = curRow = head;

    for (row = 0; row < rows; row++) {
        for (col = 0; col < cols; col++) {
            if (curNode.dark()) {
                curNode.wipe();
            }
            curNode = curNode.right;
        }
        curRow = curRow.down;
        curNode = curRow;
    }

    if (curClr == 1) {
        curX = startX;
        curY = startY;
        curNode = startNode;
        b = active;
        active = false;
    } else {
        curNode = hold;
    }

    darkTrackFinished = false;
    return b;
}

function disableSetStart() {
    let btn = document.getElementById("SetStart");
    btn.disabled = true;
    btn.className = "dropbtn-disabled";
}

function enableSetStart() {
    let btn = document.getElementById("SetStart");
    btn.disabled = false;
    btn.className = "dropbtn";
}

function stateChange() {
    if (active) {
        disableSetStart();
    } else {
        enableSetStart();
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

// toggle between hiding and showing the dropdown content for resetsDrop
function resets() {
    closeAllBut("resetsDrop");
    document.getElementById("resetsDrop").classList.toggle("show");
}

// toggle between hiding and showing the dropdown content for setStartDrop
function starts() {
    closeAllBut("setStartDrop");
    document.getElementById("setStartDrop").classList.toggle("show");
}

// toggle between hiding and showing the dropdown content for helpDrop
function helps() {
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
}

function resetW() {
    if (resetWhite()) {
        stateChange();
    }
    paintMaze();
    return false;
}
function resetB() {
    if (resetBlack()) {
        stateChange();
    }
    paintMaze();
    return false;
}
function resetA() {
    resetW();
    resetB();
    return false;
}
function firstW() {
    //alert("First White selected");
    if (!active) {
        curX = startX = whiteEP1x;
        curY = startY = whiteEP1y;
        endX = whiteEP2x;
        endY = whiteEP2y;
        curNode = startNode = whiteEP1node;
        curClr = 0;
    }
}
function secondW() {
    //alert("Second White selected");
    if (!active) {
        curX = startX = whiteEP2x;
        curY = startY = whiteEP2y;
        endX = whiteEP1x;
        endY = whiteEP1y;
        curNode = startNode = whiteEP2node;
        curClr = 0;
    }
}
function firstB() {
    //alert("First Black selected");
    if (!active) {
        curX = startX = blackEP1x;
        curY = startY = blackEP1y;
        endX = blackEP2x;
        endY = blackEP2y;
        curNode = startNode = blackEP1node;
        curClr = 1;
    }
}
function secondB() {
    //alert("Second Black selected");
    if (!active) {
        curX = startX = blackEP2x;
        curY = startY = blackEP2y;
        endX = blackEP1x;
        endY = blackEP1y;
        curNode = startNode = blackEP2node;
        curClr = 1;
    }
}
function about() {
    alert("Maze design, \u00A9 Andrea Gilbert, 2008\r\n" +
            "Javascript version 1.0, \u00A9 Graham Rogers, 2020");
}
function instr() {
    alert("Pick a start point from the Set-Start menu.\r\nMove around the " +
        "maze using the direction buttons.\r\nWhen either black or white " +
        "maze is solved, select the other and solve that.");
}

function chkWin() {
    // the target area is a 2 x 2 region and (endX, endY) is
    // the top left square of this area
    if ((curNode.attr & (CNTR | OUTR)) == 0) {
        awayFromHome = true;
    } else if (((curX == endX) || (curX == endX + 1)) &&
        ((curY == endY) || (curY == endY + 1))) {
        if (curNode.light())  {
            lightTrackFinished = true;
        } else {
            darkTrackFinished = true;
        }
        active = false;
        awayFromHome = false;
        alert(`Congratulations, current track finished`);
        return true;
    }

    if (awayFromHome && (((curX == startX) || (curX == startX + 1)) &&
        ((curY == startY) || (curY == startY + 1)))) {
        if (curClr == 0) {
            resetW();
        } else {
            resetB();
        }
        return true;
    }

    return false;
}

function move(dir) {
    let ret = false;
    let dy;
    let dx;
    let ix;
    let iy;
    //alert(`move from (${curX}, ${curY}) from path ${curClr}`);
    switch (dir) {
    case "Up":
        dy = curY - 1;

        if ((dy >= 0) && ((curNode.up.attr & T) == curClr)) {
            // leaving to the north - toggle North colour
            curNode.invertN();
            if ((((curNode.attr & CNTR) != 0) && ((curNode.attr & Q2) != 0)) ||
                (((curNode.attr & OUTR) != 0) && ((curNode.attr & Q2) != 0) &&
                 ((curNode.attr & Q1) != 0))) {
                curY--;
                curNode = curNode.up;    // move up from lower centre
            }
            drawN();
            // entering from the south
            curY--;                      // move focus up
            curNode = curNode.up;        // move focus up
            curNode.invertS();
            drawS();

            if (!active) {
                active = true;
                ret = true;
            }

            ret |= chkWin();

            // keep going until blocked or there's a choice
            while (
                ((dy = curY - 1) >= 0) &&
                ((curNode.up.attr & T) == curClr) &&
                (((dx = curX - 1) < 0) ||
                    ((curNode.left.attr & T) != curClr)) &&
                (((ix = curX + 1) >= cols) ||
                    ((curNode.right.attr & T) != curClr))
            ) {
                curNode.invertN();
                drawN();
                curY--;
                curNode = curNode.up;
                curNode.invertS();
                drawS();
                ret |= chkWin();
            }
        }
        break;
    case "Right":
        ix = curX + 1;

        if ((ix < cols) && ((curNode.right.attr & T) == curClr)) {
            //leaving to the east
            curNode.invertE();
            if ((((curNode.attr & CNTR) != 0) && ((curNode.attr & Q1) == 0)) ||
                (((curNode.attr & OUTR) != 0) && ((curNode.attr & Q1) == 0) &&
                 ((curNode.attr & Q2) == 0))) {
                curX++;                     // move right from left centre or ..
                curNode = curNode.right;    // .. from top or bottom left OUTR
            }
            drawE();
            // entering from the west
            curX++;
            curNode = curNode.right;
            curNode.invertW();
            drawW();

            if (!active) {
                active = true;
                ret = true;
            }

            ret |= chkWin();

            // keep going until blocked or there's a choice
            while (
                ((ix = curX + 1) < cols) &&
                ((curNode.right.attr & T) == curClr) &&
                (((dy = curY - 1) < 0) ||
                    ((curNode.up.attr & T) != curClr)) &&
                (((iy = curY + 1) >= rows) ||
                    ((curNode.down.attr & T) != curClr))
            ) {
                curNode.invertE();
                drawE();
                curX++;
                curNode = curNode.right;
                curNode.invertW();
                drawW();
                ret |= chkWin();
            }
        }
        break;
    case "Down":
        iy = curY + 1;

        if ((iy < rows) && ((curNode.down.attr & T) == curClr)) {
            // leaving to the south
            curNode.invertS();
            if ((((curNode.attr & CNTR) != 0) && ((curNode.attr & Q2) == 0)) ||
                (((curNode.attr & OUTR) != 0) && ((curNode.attr & Q2) != 0) &&
                 ((curNode.attr & Q1) == 0))) {
                curY++;
                curNode = curNode.down;    // move down from upper centre
            }
            drawS();
            // entering from the north
            curY++;
            curNode = curNode.down;
            curNode.invertN();
            drawN();

            if (!active) {
                active = true;
                ret = true;
            }

            ret |= chkWin();

            // keep going until blocked or there's a choice
            while (
                ((iy = curY + 1) < rows) &&
                ((curNode.down.attr & T) == curClr) &&
                (((dx = curX - 1) < 0) ||
                    ((curNode.left.attr & T) != curClr)) &&
                (((ix = curX + 1) >= cols) ||
                    ((curNode.right.attr & T) != curClr))
            ) {
                curNode.invertS();
                drawS();
                curY++;
                curNode = curNode.down;
                curNode.invertN();
                drawN();
                ret |= chkWin();
            }
        }
        break;
    case "Left":
        dx = curX - 1;

        if ((dx >= 0) && ((curNode.left.attr & T) == curClr)) {
            // leaving to the west
            curNode.invertW();
            if ((((curNode.attr & CNTR) != 0) && ((curNode.attr & Q1) != 0)) ||
                (((curNode.attr & OUTR) != 0) && ((curNode.attr & Q2) == 0) &&
                 ((curNode.attr & Q1) != 0))) {
                curX--;                    // move left from right centre or ..
                curNode = curNode.left;    // .. from top or bottom right OUTR
            }
            drawW();
            // entering from the east
            curX--;
            curNode = curNode.left;
            curNode.invertE();
            drawE();

            if (!active) {
                active = true;
                ret = true;
            }

            ret |= chkWin();

            // keep going until blocked or there's a choice
            while (
                ((dx = curX - 1) >= 0) &&
                ((curNode.left.attr & T) == curClr) &&
                (((dy = curY - 1) < 0) ||
                    ((curNode.up.attr & T) != curClr)) &&
                (((iy = curY + 1) >= rows) ||
                    ((curNode.down.attr & T) != curClr))
            ) {
                curNode.invertW();
                drawW();
                curX--;
                curNode = curNode.left;
                curNode.invertE();
                drawE();
                ret |= chkWin();
            }
        }
        break;
    }

    return ret;
}

let offX = -1;
let offY = -1;
let downSeen = false;

function findBtn(bx, by) {
    btn = btnGroup;
    while (btn != null) {
        if ((bx >= btn.bx) && (bx < (btn.bx + btn.bw)) &&
                (by >= btn.by) && (by < (btn.by + btn.bh))) {
            return btn;
        }
        btn = btn.next;
    }
    return null;
}

function matDown(event) {
    offX = event.offsetX;
    offY = event.offsetY;
    btnPressed = findBtn(offX, offY);
    if (btnPressed != null) {
        downSeen = true;
        for (btn = btnGroup; btn != null; btn = btn.next) {
            btn.bSelected = btn.bPressed = false;
        }
        btnPressed.bSelected = btnPressed.bPressed = true;
        btnPressed.draw();
    }
}

function chkStartSelected() {
    if ((curNode == null) && (!active)) {
        alert(`You must use Set-Start to choose a start point.`);
        return false;
    }
    return true;
}

function matUp(event) {
    if (downSeen) {
        downSeen = false;
        btn = findBtn(event.offsetX, event.offsetY);
        if (btn == btnPressed) {
            btn.bPressed = false;
            btn.draw();
            if (chkStartSelected()) {
                switch (btn.bLabel) {
                case "W":
                    if (move("Left")) {
                        stateChange();
                    }
                    break;
                case "E":
                    if (move("Right")) {
                        stateChange();
                    }
                    break;
                case "N":
                    if (move("Up")) {
                        stateChange();
                    }
                    break;
                case "S":
                    if (move("Down")) {
                        stateChange();
                    }
                    break;
                }
            }
        }
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropDown = dropdowns[i];
            if (openDropDown.classList.contains('show')) {
                openDropDown.classList.remove('show');
            }
        }
    }
}
