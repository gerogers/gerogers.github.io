// vi:set ts=50 sw=4 ai ml:
"use strict";
const canvas = document.getElementById('canvas');
const puzlId = document.getElementById('puzzleId');
const topline = document.getElementById('topline');
const params = document.getElementsByClassName('params');
let parLen = params.length;
canvas.width;
canvas.height;
let ctx = canvas.getContext('2d');
let clrBorder = "black";
let clrEdge = '#444';
let clrTileFront = '#ffffa0';
let clrTileBack = '#994';
let clrTile = clrTileFront;
let clrPathFront = '#bbb';
let clrPathBack = '#555';
let clrPath = clrPathFront;
let clrDotPathFront = 'darkGray';
let clrDotPathBack = 'lightGray';
let clrDotPath = clrDotPathFront;
let clrRemarks = '#ffff00';
let clrArrowsFront = 'white';
let clrArrowsBack = 'gray';
let clrArrows = 'clrArrowsFront';
let clrTopAD = '#c00000';
let clrTopAL = 'red';
let cltTopBD = '#c0c000';
let clrTopBL = '#ffff00';
let clrTunnelA = '#6f0';
let clrTunnelB = 'blue';
let clrMan = '#6f0';
let clrManPointer = 'blue';
ctx.fillStyle = clrBorder;
ctx.fillRect(0, 0, canvas.width, canvas.height);
let lvl = 0;
let dims = 11;
let rows = 1;
let cols = 1;
let elements = 1;
let indexMan = 0;
let title = "";
let puzlValue;
let puzlComplete = false;
let playArea = new Array(1);
let playPieces = new Array(1);
let remarks = "";
let table = 2;
let offset = 0;
let offX = 0;
let offY = 0;
let nw = 1;        // item width
let nh = 1;        // item height
let lm = nw;       // left margin
let tm = nh;       // top margin
let keysEnabled = false;
let history = [0];
let moveCount = 0;
let undoing = false;

// object limits in rotations
let rotx1 = 0;
let rotx2 = 0;
let roty1 = 0;
let roty2 = 0;

let front = true;
let allSame = true;
let backDefined = false;
let objStrt = 0;
let objCount = 0;

class PlayPiece
{
    constructor(desc, xy) {
        this.desc = desc;
        this.x = (xy >> 4) & 0xf;
        this.y = (xy & 0xf);
        this.rstDesc = desc;
        this.rstX = (xy >> 4) & 0xf;
        this.rstY = (xy & 0xf);
    }
    resetItem() {
        this.desc = this.rstDesc;
        this.x = this.rstX;
        this.y = this.rstY;
    }
}

// decode base64 character n of array b to 6-bit value
function decode(b, n)
{
    let p = -1;
    let c = b.charAt(n);
    if ((c >= 'A') && (c <= 'Z')) {
        p = b.charCodeAt(n) - 'A'.charCodeAt(0);
    } else if ((c >= 'a') && (c <= 'z')) {
        p = b.charCodeAt(n) - 'a'.charCodeAt(0) + 26;
    } else if ((c >= '0') && (c <= '9')) {
        p = b.charCodeAt(n) - '0'.charCodeAt(0) + 52;
    } else if (c == '+') {
        p = 62;
    } else if (c == '/') {
        p = 63;
    } else if (c == '=') {
        p = 0;
    } else {
        alert(`invalid encoding`);
        return -1;
    }
    return p;
}

// fetch byte n from decode of base64 encoded string b
function dcd(b, n)
{
    let n4 = 4 * n;
    if (n4 >= 3 * b.length) {
        alert(`index ${n} exceeds decoded length of base64 string`);
        return -1;
    } else {
        let index = Math.floor(n4 / 3);
        let r = n4 % 3;
        let p = decode(b, index);
        let q = decode(b, index + 1);
        switch(r) {
            case 0:
                return ((p << 2) | ((q & 0x30) >> 4));
                break;
            case 1:
                return (((p & 0xf) << 4) | ((q & 0x3c) >> 2));
                break;
            case 2:
                return (((p & 3) << 6) | q );
                break;
        }
    }
}

function closeAllBut(id)
{
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        let thisDrop = dropdowns[i];
        if ((thisDrop.id != id) && thisDrop.classList.contains("show")) {
            thisDrop.classList.remove("show");
        }
    }
}

function setColours()
{
    clrTile = (front ? clrTileFront : clrTileBack);
    clrPath = (front ? clrPathFront: clrPathBack);
    clrDotPath = (front ? clrDotPathFront : clrDotPathBack);
    clrArrows = (front ? clrArrowsFront : clrArrowsBack);
}

/*
 * The puzzle comprises paths along which, the man may travel.
 * Each (square) cell contains from 0 to 4 path sections emanating from the
 * centre of the cell and moving to an adjacent edge.  The least significant 4
 * bits represent edges thus: 0x01 north, 0x02 east, 0x04 south, 0x08 west.
 * The next 4 bits if set indicate that the adjact cell is joined to this one:
 * 0x10 means this cell is attached to the cell above,
 * 0x20 attached to cell to the right, 0x40 attached to cell below
 * 0x80 attached to cell to the left. If there is no cell in an indicated
 * direction (e.g. above the top row) then the cell is fixed to the ground and
 * cannot be rotated. Cells attached to adjacent grounded cells are also
 * grounded. Cells not grounded may be rotated. Where ungrounded cells are
 * attached to one or more other cells, all these cells move together.
 * The next 4 bits indicate paths on the reverse side of a cell.
 * 
 * |a|a|h|
 * |t|n|a|    |edge|
 * |t|c|s|    |atta|
 * |a|h|o|back|ched|top |
 * |c|o|b|side| on |side|
 * |h|r|j|path|side|path|
 * |e|e|c|    |    |    |
 * |d|d|t|WSEN|WSEN|WSEN|
 *  4 2 1 8421 8421 8421
 */
let TOPTRACK = 1;
let RIGHTTRACK = 2;
let BOTTOMTRACK = 4
let LEFTTRACK = 8;
let TOPEDGE = 0x10;
let RIGHTEDGE = 0x20;
let BOTTOMEDGE = 0x40;
let LEFTEDGE = 0x80;
let BACKTOPTRACK = 0x100
let BACKRIGHTTRACK = 0x200;
let BACKBOTTOMTRACK = 0x400;
let BACKLEFTTRACK = 0x800;
let HASOBJECT = 0x1000;
let ANCHORED = 0x2000;
let ATTACHED = 0x4000;
let EWNONMOVING = 0x7050;    // not changed with E-W rotation
let NSNONMOVING = 0x70A0;    // not changed with N-S rotation

// object types
let EMPTY = 0;
let ROADWORKS = 1;    // obsolete, causes any tracks here to be removed
let ONEWAY = 2;
let TUNNEL = 3;
let TILE = 4;
let POCKET = 5;
let MAN = 6;
let MATCHEDPAIR = 7;

// object properties
let MASKDIR = 3;
let COLOUR_QUAL = 4;
let A_SIDE = 8;

// directions
let DIRUP = 0;
let DIRRIGHT = 1;
let DIRDOWN = 2;
let DIRLEFT = 3;

let REVERSE_DIRECTION = 2;

// print order for objects
let objOrder = [ONEWAY, ROADWORKS, POCKET, TUNNEL, TILE, MAN];

// general purpose finder of pieces in the playPieces array
// objType - type of piece to find
// x and y - required co-ords, negative for don't care
// visible - true = must be on visible side, false = don't care
// dir     - required direction, 0 - 3, negative = don't care
// colour  - 0 or 4, negative = don't care
function findPiece(objType, x, y, visible, dir, colour) {
    let i;
    let obj;
    let desc;
    let type;

    for (i = 0; i < playPieces.length; i++) {
        obj = playPieces[i];
        desc = obj.desc;
        type = (desc >> 4) & 7;
        if (objType != type)
            continue;
        if ((x >= 0) && (x != obj.x))
            continue;
        if ((y >= 0) && (y != obj.y))
            continue;
        if (visible && front && ((desc & A_SIDE) == 0)) 
            continue;
        if (visible && !front && ((desc & A_SIDE) != 0))
            continue;
        if ((dir >= 0) && ((desc & MASKDIR) != dir))
            continue;
        if ((colour >= 0) && ((desc & COLOUR_QUAL) != colour))
            continue;
        return i;    // found a good one
    }

    return -1;    // never found it
}

// general purpose finder of pieces in the playPieces array
// searches from the supplied index
// returns index to found piece - negative = not found
function findFrom(start, objType, x, y, visible, dir, colour) {
    let i;
    let obj;
    let desc;
    let type;

    for (i = start; i < playPieces.length; i++) {
        obj = playPieces[i];
        desc = obj.desc;
        if (objType >= 0) {
            type = (desc >> 4) & 0x7;
            if (type != objType)
                continue;
        }
        if ((x >= 0) && (x != obj.x))
            continue;
        if ((y >= 0) && (y != obj.y))
            continue;
        if (visible && front && ((desc & A_SIDE) == 0))
            continue;
        if (visible && !front && ((desc & A_SIDE) != 0))
            continue;
        if ((dir >= 0) && ((desc & MASKDIR) != dir))
            continue;
        if ((colour >= 0) && ((desc & COLOUR_QUAL) != colour))
            continue;
        return i;    // found a good one
    }

    return -1;    // never found it
}

// Find matching TUNNEL
// Tunnels should be configured as a pair, one on the front and one on the
// back. If two colours are used, green pairs with green, blue with blue.
// thisTunnel is the index in playPieces to the known tunnel, 
// returns index to the matching tunnel (negative represents a configuration
// error)
function findTunnel(thisTunnel)
{
    let desc = playPieces[thisTunnel].desc & ~(A_SIDE | MASKDIR);
    let i;
    for (i = 0; i < playPieces.length; i++) {
        if (i == thisTunnel)
            continue;
        if ((playPieces[i].desc & ~(A_SIDE | MASKDIR)) == desc)
            return i;
    }
    return -1;
}

function reset()
{
    let indx; let x; let y;
    closeAllBut("");
    // read puzzle layout 
    let i;
    let j;
    for (i = 0; i < elements; i++) {
        playArea[i] = dcd(params[lvl].value, table + i);
    }
    // If the reverse side is defined, read its layout
    // Note that i is initially the offset of the reverse side values
    if (backDefined) {
        let even = true;
        let item;
        let p;
        for (j = 0; j < elements; j++) {
            item = playArea[j] & 0xff;
            if (even) {
                p = (dcd(params[lvl].value, table + i) >> 4) & 0x0f;
            } else {
                p = dcd(params[lvl].value, table + i) & 0x0f;
            }
            p <<= 8;
            item |= p;
            playArea[j] = item;
            even = !even;
            if (even) {
                i++;
            }
        }
    }
    // reset each item in playPieces
    for (i = 0; i < playPieces.length; i++) {
        playPieces[i].resetItem();
    }

    // now make multiple passes of the playing area exploring connections
    // so as to discover which pieces are rigidly anchored to an edge or
    // to another anchored piece. Stop the search after a pass has been
    // made, in which no new pieces were identified.
    let keepLooking = true;

    while (keepLooking) {
        keepLooking = false;

        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                indx = x * rows + y;
                j = playArea[indx];
                if (((j & ANCHORED) == 0) && (
                    (((j & BOTTOMEDGE) != 0) &&
                        ((y <= 0) ||
                        (playArea[indx - 1] & ANCHORED) != 0)) ||
                    (((j & LEFTEDGE) != 0) &&
                        ((x <= 0) ||
                        (playArea[indx - rows] & ANCHORED) != 0)) ||
                    (((j & TOPEDGE) != 0) &&
                        ((y + 1 >= rows) ||
                        (playArea[indx + 1] & ANCHORED) != 0)) ||
                    (((j & RIGHTEDGE) != 0) &&
                        ((x + 1 >= cols) ||
                        (playArea[indx + rows] & ANCHORED) != 0))
                  ))
                {
                    j |= ANCHORED;
                    playArea[indx] = j;
                    keepLooking = true;
                }
            }
        }
    }

    puzlComplete = false;
    front = true;
    setColours();
    if (!undoing) {
        history = [0];
        moveCount = 0;
        drawPuzl();
    }
}

function puzl(puzlvl)
{
    let indx; let x; let y;
    closeAllBut("");
    if ((puzlvl >= 0) && (puzlvl < parLen)) {
        lvl = puzlvl;
        puzlId.innerHTML = params[lvl].title;
        puzlValue = params[lvl].value;

        offset = 0;
        let cr;
        remarks = "";
        while ((cr = dcd(puzlValue, offset++)) < 0x80) {
            remarks += String.fromCharCode(cr);
        }
        remarks += String.fromCharCode(cr - 128);
        cr = dcd(puzlValue, offset++);
        table = offset;
        allSame = true;
        backDefined = false;
        if (cr == 0) {
            cr = dcd(puzlValue, offset++);
            table = offset;
            allSame = false;
            backDefined = true;
        }
        cols = (cr >> 4) & 0x0f;
        rows = (cr & 0x0f);
        elements = cols * rows;
        objStrt = table + elements;
        if (backDefined) {
            objStrt += Math.floor((elements + 1) / 2);
        }
        objCount = 0;
        let i = 0;
        while ((dcd(puzlValue, objStrt + i) & 0x80) == 0) {
            objCount++;
            i += 2;
        }
        objCount++;
        //alert(`Counted ${objCount} objects`);
        if (playArea.length != elements) {
            // resize playArea array
            playArea = new Array(elements);
        }
        if (playPieces.length != objCount) {
            playPieces = new Array(objCount);
        }
        // scan the objects several times adding them into playPieces array
        // in 'drawing order'. Pick out the now obsolete ROADWORKS en-route
        // and clear the paths where it would have fallen.
        let j; let k; 
        let m = 0;
        for (j = 0; j < objOrder.length; j++) {
            k = 0;
            for (i = 0; i < playPieces.length; i++) {
                if (((dcd(puzlValue, objStrt + k) >> 4) & 7) == objOrder[j]) {
                    playPieces[m] =
                        new PlayPiece(dcd(puzlValue, objStrt + k) & 0x7f,
                                        dcd(puzlValue, objStrt + k + 1));
                    x = playPieces[m].x;
                    y = playPieces[m].y;
                    indx = x * rows + y;
                    if (objOrder[j] == ROADWORKS) {
                        if ((dcd(puzlValue, objStrt + k) & A_SIDE) == 0) {
                            playArea[indx] &= ~0xf00;
                        } else {
                            playArea[indx] &= ~0xf;
                        }
                        playPieces[m].desc = 0;
                        if ((playArea[indx] & 0xf0f) != 0) {
                            allSame = false;
                        }
                    }
                    playArea[indx] |= HASOBJECT;
                    m++;
                }
                k += 2;
            }
        }
        indexMan = i - 1;    // last object in array is the man

        reset();
        resize();
    }
    return false;
}

function flipSides()
{
    front = !front;

    if (front) {
        clrTile = clrTileFront;
        clrPath = clrPathFront;
        clrArrows = clrArrowsFront;
        clrDotPath = clrDotPathFront;
    } else {
        clrTile = clrTileBack;
        clrPath = clrPathBack;
        clrArrows = clrArrowsBack;
        clrDotPath = clrDotPathBack;
    }
}

function drawDottedLine(x, y, delta_x, delta_y, divs, start)
{
    let inc_x = delta_x / (divs * 2);
    let inc_y = delta_y / (divs * 2);
    let x_co;
    let y_co;
    let i;

    ctx.strokeStyle = clrDotPath;
    for (i = start ? 0 : 1; i < divs * 2; i += 2) {
        x_co = x + (i * delta_x) / (divs * 2);
        y_co = y + (i * delta_y) / (divs * 2);
        ctx.beginPath();
        ctx.moveTo(x_co, y_co);
        ctx.lineTo(x_co + inc_x, y_co + inc_y);
        ctx.stroke();
    }
}

function drawArrows(xc, yc, dir, piece)
{
    let lenX = 0;
    let lenY = 0;
    let u2 = /*Math.floor*/(nw / 2);
    let u3 = /*Math.floor*/(nw * 3 / 8);
    let u4 = /*Math.floor*/(nw / 4);
    let u5 = /*Math.floor*/(nw * 5 / 8);
    let u7 = /*Math.floor*/(nw * 7 / 16);
    let u8 = /*Math.floor*/(nw / 8);
    let u16 = /*Math.floor*/(nw / 16);
    let len_x = u8;
    let len_y = u2+u4;
    if ((dir == DIRLEFT) || (dir == DIRRIGHT)) {
        len_x = u2 + u4;
        len_y = u8;
    }
    let c = playArea[piece.x * rows + piece.y];
    let side = piece.desc & A_SIDE;
    let rev = ((side == 0) && front) || ((side != 0) && !front);
    ctx.strokeStyle = ctx.fillStyle = (rev ? clrDotPath : clrArrows);
    if (((c & TOPTRACK) != 0) && (dir == DIRUP)) {
        ctx.beginPath();
        if (rev) {
            ctx.moveTo(xc + u3, yc + u3);
            ctx.lineTo(xc + u2, yc + u2 + u16);
            ctx.lineTo(xc + u5, yc + u3);
        } else {
            ctx.moveTo(xc + u3, yc + u4);
            ctx.lineTo(xc + u2, yc + u16);
            ctx.lineTo(xc + u5, yc + u4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.stroke();
        if (!rev) {
            ctx.fillRect(xc + u7, yc + u4, len_x, len_y);
        }
    }
    if (((c & BOTTOMTRACK) != 0) && (dir == DIRDOWN)) {
        ctx.beginPath();
        if (rev) {
            ctx.moveTo(xc + u3, yc + u2 + u16);
            ctx.lineTo(xc + u2, yc + u3);
            ctx.lineTo(xc + u5, yc + u2 + u16);
        } else {
            ctx.moveTo(xc + u3, yc + u2 + u4);
            ctx.lineTo(xc + u2, yc + u2 + u7);
            ctx.lineTo(xc + u5, yc + u2 + u4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.stroke();
        if (!rev) {
            ctx.fillRect(xc + u7, yc + u16, len_x, len_y);
        }
    }
    if (((c & LEFTTRACK) != 0) && (dir == DIRLEFT)) {
        ctx.beginPath();
        if (rev) {
            ctx.moveTo(xc + u2 + u16, yc + u3);
            ctx.lineTo(xc + u3, yc + u2);
            ctx.lineTo(xc + u2 + u16, yc + u5);
        } else {
            ctx.moveTo(xc + u4, yc + u3);
            ctx.lineTo(xc + u16, yc + u2);
            ctx.lineTo(xc + u4, yc + u5);
        }
        if (!rev) {
            ctx.closePath();
            ctx.fill();
        }
        ctx.stroke();
        if (!rev) {
            ctx.fillRect(xc + u4, yc + u7, len_x, len_y);
        }
    }
    if (((c & RIGHTTRACK) != 0) && (dir == DIRRIGHT)) {
        ctx.beginPath();
        if (rev) {
            ctx.moveTo(xc + u3, yc + u3);
            ctx.lineTo(xc + u2 + u16, yc + u2);
            ctx.lineTo(xc + u3, yc + u5);
        } else {
            ctx.moveTo(xc + u2 + u4, yc + u3);
            ctx.lineTo(xc + u2 + u7, yc + u2);
            ctx.lineTo(xc + u2 + u4, yc + u5);
        }
        if (!rev) {
            ctx.closePath();
            ctx.fill();
        }
        ctx.stroke();
        if (!rev) {
            ctx.fillRect(xc + u16, yc + u7, len_x, len_y);
        }
    }
}

function drawTile(xc, yc, clr)
{
    let u2 = nw / 2;
    let u3 = nw / 3;
    let u23 = nw - u3;
    ctx.fillStyle = (clr == 0 ? clrTopAL : clrTopBL);
    ctx.strokeStyle = clrEdge; //(clr == 0 ? clrTopAL : clrTopBL);
    ctx.beginPath();
    ctx.moveTo(xc + u2, yc + u23);
    ctx.lineTo(xc + u3, yc + u3);
    ctx.lineTo(xc + u23, yc + u3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawPocket(xc, yc, clr)
{
    let u2 = nw / 2;
    let u3 = nw / 3;
    let u23 = nw - u3;
    ctx.fillStyle = (clr == 0 ? clrTopAL : clrTopBL);
    ctx.strokeStyle = clrEdge;
    ctx.fillRect(xc + nw/4, yc + nh/4, u2, u2);
    ctx.strokeRect(xc + nw/4, yc + nh/4, u2, u2);
    ctx.fillStyle = 'white';  // clrTile;
    ctx.beginPath();
    ctx.moveTo(xc + u2, yc + u23);
    ctx.lineTo(xc + u3, yc + u3);
    ctx.lineTo(xc + u23, yc + u3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawMatchedPair(xc, yc, clr)
{
    let u2 = nw / 2;
    let u3 = nw / 3;
    let u23 = nw - u3;
    ctx.fillStyle = (clr == 0 ? clrTopAL : clrTopBL);
    ctx.strokeStyle = clrEdge;
    ctx.fillRect(xc + nw/4, yc + nh/4, u2, u2);
    ctx.strokeRect(xc + nw/4, yc + nh/4, u2, u2);
    ctx.beginPath();
    ctx.moveTo(xc + u2, yc + u23);
    ctx.lineTo(xc + u3, yc + u3);
    ctx.lineTo(xc + u23, yc + u3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawTunnel(xc, yc, dir, clr)
{
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;

    if (!front) {
        yc += 11 * nh / 16;
    }

    ctx.fillStyle = (clr == 0 ? clrTunnelA : clrTunnelB);
    ctx.strokeStyle = (clr == 0 ? clrTunnelA : clrTunnelB);
    if (dir == DIRUP) {
        y1 = yc + (nh / 16) + 1;
        y2 = yc + ((nh * 4) / 16);
    } else if (dir == DIRDOWN) {
        y1 = yc + ((nh * 12) / 16);
        y2 = yc + ((nh * 15) / 16);
    }
    if ((dir == DIRUP) || (dir == DIRDOWN)) {
        x1 = xc + (nw / 16);
        x2 = xc + ((nw * 15) / 16);
        ctx.fillRect(x1, y1, x2 - x1, (nh / 16));
        ctx.rect(x1, y1, x2 - x1, (nh / 16));
        ctx.fillRect(x1, y1, (nw / 16), y2 - y1);
        ctx.rect(x1, y1, (nw / 16), y2 - y1);
        ctx.fillRect(x1, y2 - (nh / 16), x2 - x1, (nh / 16));
        ctx.rect(x1, y2 - (nh / 16), x2 - x1, (nh / 16));
        ctx.fillRect(x2 - (nw / 16), y1, (nw / 16), y2 - y1);
        ctx.rect(x2 - (nw / 16), y1, (nw / 16), y2 - y1);
    } else if (dir == DIRLEFT) {
        x1 = xc + (nw / 16);
        x2 = xc + ((nw * 8) / 32);
    } else if (dir == DIRRIGHT) {
        x1 = xc + ((nw * 24) / 32);
        x2 = xc + ((nw * 30) / 32);
    }
    if ((dir == DIRLEFT) || (dir == DIRRIGHT)) {
        y1 = yc + (nh / 16);
        y2 = yc + ((nh * 15) / 16);
        ctx.fillRect(x1, y1, (nw / 16), y2 - y1);
        ctx.rect(x1, y1, (nw / 16), y2 - y1);
        ctx.fillRect(x1, y1, x2 - x1 - 1, (nh / 16));
        ctx.rect(x1, y1, x2 - x1 - 1, (nh / 16));
        ctx.fillRect(x2 - (nw / 16) - 1, y1, (nw / 16), y2 - y1);
        ctx.rect(x2 - (nw / 16) - 1, y1, (nw / 16), y2 - y1);
        ctx.fillRect(x1, y2 - (nh / 16), x2 - x1 - 1, (nh / 16));
        ctx.rect(x1, y2 - (nh / 16), x2 - x1 - 1, (nh / 16));
    }
}

function drawMan(xc, yc, dir)
{
    ctx.fillStyle = clrMan;
    ctx.beginPath();
    ctx.arc(xc + nw/2, yc + nh/2, (nw * 23) / 128, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = clrManPointer;
    if (((dir == DIRUP) && front) || ((dir == DIRDOWN) && !front)) {
        ctx.beginPath();
        ctx.moveTo(xc + nw * 3 / 8, yc + nh * 3 / 8);
        ctx.lineTo(xc + nw / 2, yc + nh / 4);
        ctx.lineTo(xc + nw * 5 / 8, yc + nh * 3 / 8);
        ctx.closePath();
        ctx.fill();
    } else if (dir == DIRRIGHT) {
        ctx.beginPath();
        ctx.moveTo(xc + nw * 5 / 8, yc + nh * 3 / 8);
        ctx.lineTo(xc + nw * 3 / 4, yc + nh / 2);
        ctx.lineTo(xc + nw * 5 / 8, yc + nh * 5 / 8);
        ctx.closePath();
        ctx.fill();
    } else if (((dir == DIRDOWN) && front) || ((dir == DIRUP) && !front)) {
        ctx.beginPath();
        ctx.moveTo(xc + nw * 3 / 8, yc + nh * 5 / 8);
        ctx.lineTo(xc + nw / 2, yc + nh * 3 / 4);
        ctx.lineTo(xc + nw * 5 / 8, yc + nh * 5 / 8);
        ctx.closePath();
        ctx.fill();
    } else if (dir == DIRLEFT) {
        ctx.beginPath();
        ctx.moveTo(xc + nw * 3 / 8, yc + nh * 3 / 8);
        ctx.lineTo(xc + nw / 4, yc + nh / 2);
        ctx.lineTo(xc + nw * 3 / 8, yc + nh * 5 / 8);
        ctx.closePath();
        ctx.fill();
    }
}

function drawPuzl()
{
    ctx.fillStyle = (puzlComplete ? 'red' : clrBorder);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    nw = Math.round(canvas.width / (cols + 4));
    nw &= ~3;
    nh = Math.round(canvas.height / (rows + 4));
    nh &= ~3;
    if (nw > nh) {
        nw = nh;
    } else {
        nh = nw;
    }
    lm = (canvas.width - (cols + 4) * nw) / 2 + 2 * nw;
    tm = (canvas.height - (rows + 4) * nh) / 2 + nh;
    let wayUpHeight = (tm / 3);
    ctx.font = `${wayUpHeight}px Arial,TimesNewRoman,Courier`;
    let nh2 = nh / 2;
    let nw2 = nw / 2;
    let nh4 = nh / 4;
    let nw4 = nw / 4;
    ctx.fillStyle = clrTile;
    ctx.fillRect(lm - nw, tm, (cols + 2) * nw, (rows + 2) * nh);
    let wayUp = front ? " Top side " : " Under side ";
    let mt = ctx.measureText(wayUp);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(lm - nw, tm / 4, mt.width, tm/2);
    ctx.fillStyle = "black";
    ctx.fillText(wayUp, lm - nw, 7 * tm / 12 + 2);


    // indicate tile separations and paths
    let cell;
    let mask;
    let x;
    let y;
    let xc;    // x-coordinate
    let yc;    // y-coordinate
    let i = 0;
    let paths;
    let dots;
    for (x = 0; x < cols; x++) {
        for (y = (front ? 0 : rows - 1);
                (front ? y < rows : y >= 0);
                (front ? y++ : y--)) {
            cell = playArea[i++];
            paths = (front ? cell : cell >> 8) & 0xf;
            dots = (front ? cell >> 8 : cell) & 0xf;
            xc = lm + x * nw + nw2;
            yc = tm + (rows - y) * nh + nh2;
            if (paths != 0) {
                ctx.fillStyle = clrPath;
                ctx.beginPath();
                ctx.arc(xc, yc, nh4 - 1, 0, 2 * Math.PI);
                ctx.fill();
                for (mask = 1; mask < 16; mask <<= 1) {
                    switch (paths & mask) {
                    // lines are extended by 1 pixel in direction of travel
                    // this is to compensate for rounding errors and ensures
                    // that adjacent line sections meet.
                    case 1:
                        // Up
                        ctx.fillRect(lm + nw4 + x * nw,
                                    tm + (front ? 0 : nh2) + (rows - y) * nh,
                                    nw2, nh2 + 1);
                        break;
                    case 2:
                        // Right
                        ctx.fillRect(lm + nw2 + x * nw,
                                    tm + nh4 + (rows - y) * nh, nw2 + 1, nh2);
                        break;
                    case 4:
                        // Down
                        ctx.fillRect(lm + nw4 + x * nw,
                                    tm + (front ? nh2 : 0) + (rows - y) * nh,
                                    nw2, nh2 + 1);
                        break;
                    case 8:
                        // Left
                        ctx.fillRect(lm + x * nw,
                                    tm + nh4 + (rows - y) * nh, nw2 + 1, nh2);
                        break;
                    }
                }
            }
            if (!allSame && (dots != 0)) {
                ctx.strokeStyle = clrDotPath;
                if ((dots & 1) != 0) {
                    drawDottedLine(xc, yc - (front?nh2:0), 0, nh2, 6, true);
                }
                if ((dots & 2) != 0) {
                    drawDottedLine(xc, yc, nw2, 0, 6, false);
                }
                if ((dots & 4) != 0) {
                    drawDottedLine(xc, yc - (front ? 0 : nh2), 0, nh2, 6,
                                    false);
                }
                if ((dots & 8) != 0) {
                    drawDottedLine(xc - nw2, yc, nw2, 0, 6, true);
                }
            }
            ctx.strokeStyle = clrEdge;
            ctx.lineWidth = 2;
            ctx.beginPath();
            if ((cell & 0x10) == 0) {
                // top edge
                ctx.moveTo(lm + x * nw - 1,
                            tm + (rows - y + (front ? 0 : 1)) * nh);
                ctx.lineTo(lm + (x + 1) * nw + 1,
                            tm + (rows - y + (front ? 0 : 1)) * nh);
            }
            if ((cell & 0x20) == 0) {
                // right edge
                ctx.moveTo(lm + (x + 1) * nw, tm + (rows - y) * nh - 1);
                ctx.lineTo(lm + (x + 1) * nw, tm + (rows - y + 1) * nh + 1);
            }
            if ((cell & 0x40) == 0) {
                // bottom edge
                ctx.moveTo(lm + x * nw - 1,
                            tm + (rows - y + (front ? 1 : 0)) * nh);
                ctx.lineTo(lm + (x + 1) * nw + 1,
                            tm + (rows - y + (front ? 1 : 0)) * nh);
            }
            if ((cell & 0x80) == 0) {
                // left edge
                ctx.moveTo(lm + x * nw, tm + (rows - y) * nh - 1);
                ctx.lineTo(lm + x * nw, tm + (rows - y + 1) * nh + 1);
            }
            ctx.stroke();
            if (cell == 0) {
                // detached empty square, fill it in
                ctx.fillStyle = 'black';
                ctx.fillRect(lm + x * nw,
                             tm + (rows - y + (front ? 0 : 1)) * nh, nw, nh);
            }
        }
    }

    // now go through the list of objects and draw them
    let j;
    let desc;
    let objType;
    let obj2;
    let type2;
    // parse the list of objects 3 times
    // first for ONEWAY objects on this side
    // second for ONEWAY objects on the other side
    // third for all other type of objects on this side
    i = -1;
    while ((i = findFrom(i + 1, ONEWAY, -1, -1, true, -1, -1)) >= 0) {
        desc = playPieces[i].desc;
        x = playPieces[i].x;
        y = playPieces[i].y;
        xc = lm + x * nw;
        yc = tm + (front ? (rows - y) : y + 1) * nh;
        drawArrows(xc, yc, desc & MASKDIR, playPieces[i]);
    }
    i = -1;
    while ((i = findFrom(i + 1, ONEWAY, -1, -1, false, -1, -1)) >= 0) {
        if ((((playPieces[i].desc & A_SIDE) == 0) && front) ||
            (((playPieces[i].desc & A_SIDE) != 0) && !front)) {
            desc = playPieces[i].desc;
            x = playPieces[i].x;
            y = playPieces[i].y;
            xc = lm + x * nw;
            yc = tm + (front ? (rows - y) : y + 1) * nh;
            drawArrows(xc, yc, desc & MASKDIR, playPieces[i]);
        }
    }
    for (i = 0; i < playPieces.length; i++) {
        // skip it if it belongs to the other side
        desc = playPieces[i].desc;
        objType = (desc >> 4) & 0x07;
        if ((((desc & A_SIDE) != 0) && front) ||
            (((desc & A_SIDE) == 0) && !front) ) {
            x = playPieces[i].x;
            y = playPieces[i].y;
            xc = lm + x * nw;
            yc = tm + (front ? (rows - y) : y + 1) * nh;
            switch(objType) {
            case TUNNEL:
                drawTunnel(xc, yc, desc & MASKDIR, desc & COLOUR_QUAL);
                break;
            case TILE:
                // are we alone now?
                let obj2;
                let j;
                for (j = 0; j < i; j++) {
                    obj2 = playPieces[j];
                    if (obj2.x != x) continue;
                    if (obj2.y != y) continue;
                    if (((obj2.desc & A_SIDE) != 0) && !front) continue;
                    if (((obj2.desc & A_SIDE) == 0) && front) continue;
                    let type2 = (obj2.desc >> 4) & 7;
                    if (type2 == TILE) {
                        // we are not alone. Offset this rendering a little
                        xc += (nw * 3) / 32;
                        yc -= (nw * 3) / 32;
                        break;
                    }
                }
                drawTile(xc, yc, desc & COLOUR_QUAL);
                break;
            case POCKET:
                drawPocket(xc, yc, desc & COLOUR_QUAL);
                break;
            case MAN:
                drawMan(xc, yc, desc & MASKDIR);
                break;
            case MATCHEDPAIR:
                drawMatchedPair(xc, yc, desc & COLOUR_QUAL);
                break;
            }
        }
    }

    let rmksHeight = nh * 2/3;
    ctx.font = `${rmksHeight}px Arial,TimesNewRoman,Courier`;
    ctx.fillStyle = clrRemarks;
    mt = ctx.measureText(remarks);
    // centre the remarks string
    if (mt.width > cols * nw) {
        // scale font down to fit width
        rmksHeight *= (cols * nw) / mt.width;
        ctx.font = `${rmksHeight}px Arial,TimesNewRoman,Courier`;
        mt = ctx.measureText(remarks);
    }
    ctx.fillText(remarks, (canvas.width - mt.width) / 2,
                tm + (2.6 + rows) * nh);

}

function checkForWin()
{
    if (findPiece(POCKET, -1, -1, false, -1, -1) < 0) {
        puzlComplete = true;
        drawPuzl();
    }
}

function setRotateDetails(indx)
{
    let keepGoing = true;
    let apply = false;
    rotx1 = Math.floor(indx / rows);
    rotx2 = rotx1;
    roty1 = indx % rows;
    roty2 = roty1;
    let c = 0;
    let d = 0;
    let i = 0;
    let x = 0;
    let y = 0;
    for (i = 0; i < playArea.length; i++) {
        playArea[i] &= ~ATTACHED;
    }
    playArea[indx] |= ATTACHED;    // mark item just stepped off
    while (keepGoing) {
        keepGoing = false;
        i = 0;
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                c = playArea[i];
                if ((c & ATTACHED) == 0) {
                    apply = false;
                    if (((c & TOPEDGE) != 0) && ((y + 1) < rows)) {
                        d = playArea[i + 1];    // [x][[y+1]
                        if ((d & ATTACHED) != 0)
                            apply = true;
                    }
                    if (((c & RIGHTEDGE) != 0) && ((x + 1) < cols)) {
                        d = playArea[i + rows];    // [x+1][y]
                        if ((d & ATTACHED) != 0)
                            apply = true;
                    }
                    if (((c & BOTTOMEDGE) != 0) && (y > 0)) {
                        d = playArea[i - 1];    // [x][y-1]
                        if ((d & ATTACHED) != 0)
                            apply = true;
                    }
                    if (((c & LEFTEDGE) != 0) && (x > 0)) {
                        d = playArea[i - rows];    // [x-1][y]
                        if ((d & ATTACHED) != 0)
                            apply = true;
                    }

                    if (apply) {
                        c |= ATTACHED;
                        playArea[i] = c;
                        if (x < rotx1) rotx1 = x;
                        if (x > rotx2) rotx2 = x;
                        if (y < roty1) roty1 = y;
                        if (y > roty2) roty2 = y;
                        keepGoing = true;
                    }
                }
                i++;
            }
        }
    }
}

function turnOver(dir)
{
    let x, y, lim, c, d, indx, indx2;
    let obj;

    // Adjust objects on compound piece being turned.
    // Do this first because once the piece itself is turned the object
    // may be left stranded on a black hole which doesn't carry the
    // ATTACHED property
    for (lim = 0; lim < playPieces.length; lim++) {
        obj = playPieces[lim];
        x = obj.x;
        y = obj.y;
        indx = x * rows + y;
        c = playArea[indx];
        if ((c & ATTACHED) != 0) {
            d = obj.desc;
            let type = ((d >> 4) & 7);
            let objDir = (d & MASKDIR);
            d ^= A_SIDE;
            if ((dir == DIRLEFT) || (dir == DIRRIGHT)) {
                x = rotx1 + rotx2 - x;
                obj.x = x;
                if ((type = ONEWAY) || (type == TUNNEL)) {
                    if ((objDir == DIRLEFT) || (objDir == DIRRIGHT)) {
                        d ^= REVERSE_DIRECTION;
                    }
                }
            } else {
                y = roty1 + roty2 - y;
                obj.y = y;
                if ((type == ONEWAY) || (type == TUNNEL)) {
                    if ((objDir == DIRUP) || (objDir == DIRDOWN)) {
                        d ^= REVERSE_DIRECTION;
                    }
                }
            }
            obj.desc = d;
        }
    }
    if ((dir == DIRLEFT) || (dir == DIRRIGHT)) {
        // left and right exchange
        lim = rotx1 + Math.floor((rotx2 - rotx1 + 1) / 2);
        for (x = rotx1; x < lim; x++) {
            // swap column rotx1 with rotx2, rotx1+1 with rotx2-1, etc.
            for (y = roty1; y <= roty2; y++) {
                indx = x * rows + y;
                indx2 = (rotx1 + rotx2 - x) * rows + y;
                c = playArea[indx];
                d = playArea[indx2];
                if (((c & ATTACHED) != 0) && ((d & ATTACHED) != 0)) {
                    playArea[indx] = d;
                    playArea[indx2] = c;
                }
            }
        }
    } else {
        // top and bottom exchange
        lim = roty1 + Math.floor((roty2 - roty1 + 1) / 2);
        for (x = rotx1; x <= rotx2; x++) {
            for (y = roty1; y < lim; y++) {
                indx = x * rows + y;
                indx2 = x * rows + roty1 + roty2 - y;
                c = playArea[indx];
                d = playArea[indx2];
                if (((c & ATTACHED) != 0) && ((d & ATTACHED) != 0)) {
                    playArea[indx] = d;
                    playArea[indx2] = c;
                }
            }
        }
    }

    // pieces swapped, now reflect their directions
    // and swap front and back
    if ((dir == DIRLEFT) || (dir == DIRRIGHT)) {
        for (x = rotx1; x <= rotx2; x++) {
            for (y = roty1; y <= roty2; y++) {
                indx = x * rows + y;
                c = playArea[indx];
                if ((c & ATTACHED) == 0)
                    continue;
                d = c;
                c &= EWNONMOVING;    // clear bits affected by EW rotation
                if ((d & BACKLEFTTRACK) != 0)
                    c |= RIGHTTRACK;
                if ((d & BACKRIGHTTRACK) != 0)
                    c |= LEFTTRACK;
                if ((d & LEFTTRACK) != 0)
                    c |= BACKRIGHTTRACK;
                if ((d & RIGHTTRACK) != 0)
                    c |= BACKLEFTTRACK;
                if ((d & LEFTEDGE) != 0)
                    c |= RIGHTEDGE;
                if ((d & RIGHTEDGE) != 0)
                    c |= LEFTEDGE;
                // now move the bottom and top bits from front to back
                if ((d & BACKTOPTRACK) != 0)
                    c |= TOPTRACK;
                if ((d & BACKBOTTOMTRACK) != 0)
                    c |= BOTTOMTRACK;
                if ((d & TOPTRACK) != 0)
                    c |= BACKTOPTRACK;
                if ((d & BOTTOMTRACK) != 0)
                    c |= BACKBOTTOMTRACK;
                playArea[indx] = c;
            }
        }
    } else {
        for (x = rotx1; x <= rotx2; x++) {
            for (y = roty1; y <= roty2; y++) {
                indx = x * rows + y;
                c = playArea[indx];
                if ((c & ATTACHED) == 0)
                    continue;
                d = c;
                c &= NSNONMOVING;    // clear bits affected by NS rotation
                if ((d & BACKTOPTRACK) != 0)
                    c |= BOTTOMTRACK;
                if ((d & BACKBOTTOMTRACK) != 0)
                    c |= TOPTRACK;
                if ((d & TOPTRACK) != 0)
                    c |= BACKBOTTOMTRACK;
                if ((d & BOTTOMTRACK) != 0)
                    c |= BACKTOPTRACK;
                if ((d & TOPEDGE) != 0)
                    c |= BOTTOMEDGE;
                if ((d & BOTTOMEDGE) != 0)
                    c |= TOPEDGE;
                // now move the left and right bits from front to back
                if ((d & BACKLEFTTRACK) != 0)
                    c |= LEFTTRACK;
                if ((d & BACKRIGHTTRACK) != 0)
                    c |= RIGHTTRACK;
                if ((d & LEFTTRACK) != 0)
                    c |= BACKLEFTTRACK;
                if ((d & RIGHTTRACK) != 0)
                    c |= BACKRIGHTTRACK;
                playArea[indx] = c;
            }
        }
    }
}

// Supposedly, numbers are held with a 52-bit mantissa, so at 2 bits per move,
// it should be possible to hols 26 moves per number. However, it appears to
// fail if more than 32 bits are stored in each array item. So this routine
// packs 16 moves per array entry.
function recordMove(dir)
{
    if (!undoing) {
        let index = Math.floor(moveCount / 15);
        let offset = 2 * (moveCount % 15);
        if (offset == 0) {
            history[index] = 0;   // initialise next history element
        }
        history[index] |= ((dir & 3) << offset);
        moveCount++;
    }
}

function undo()
{
    let offset;
    let index;
    let moves = 1;
    if (moveCount == 0)
        return;
    undoing = true;
    reset();
    for (index = 0; moves < moveCount; index++) {
        for (offset = 0; (moves < moveCount) && (offset < 30);
                moves++, offset += 2) {
            walk((history[index] >> offset) & 3);
        }
    }
    moveCount--;
    // clean up final entry
    index = Math.floor(moveCount / 15);
    offset = 2 * (moveCount % 15);
    history[index] &= ~(3 << offset);
    undoing = false;
    drawPuzl();
}

function walk(dir)
{
    let moved = false;
    let done = false;
    let man = playPieces[indexMan];
    let piece;
    let desc = man.desc & ~MASKDIR;
    desc |= dir;
    man.desc = desc;    // turn man to face requested direction
    let x = man.x;
    let y = man.y;
    let indx = x * rows + y;
    let c = playArea[indx];

    // see if this move would take us through a tunnel
    let i = findPiece(TUNNEL, x, y, true, dir, -1);
    if (i > 0) {
        // pass through the tunnel
        i = findTunnel(i);
        recordMove(dir);    // record direction of entry
        if (front && ((playPieces[i].desc & A_SIDE) == 0) ||
            (!front && (playPieces[i].desc & A_SIDE) != 0)) {
            // leave tunnel in direction opposite to its description
            dir = (playPieces[i].desc & MASKDIR) ^ REVERSE_DIRECTION;
            flipSides();
        }
        x = playPieces[i].x;
        y = playPieces[i].y;
        man.x = x;
        man.y = y;
        man.desc &= ~(A_SIDE | MASKDIR);
        if (front)
            man.desc |= A_SIDE;
        man.desc |= dir;
        moved = true;
        done = true;
    }

    // is there a path in this direction?
    if (!done) {
        if (!front) {
            c >>= 8;    // move reverse side paths into view
        }
        switch (dir) {
        case DIRUP:
            if ((c & TOPTRACK) == 0)
                done = true;    // no exit this way
            break;
        case DIRRIGHT:
            if ((c & RIGHTTRACK) == 0)
                done = true;
            break;
        case DIRDOWN:
            if ((c & BOTTOMTRACK) == 0)
                done = true;
            break;
        case DIRLEFT:
            if ((c && LEFTTRACK) == 0)
                done = true;
            break;
        }
    }

    // is there a one-way arrow here?
    if (!done) {
        i = findPiece(ONEWAY, x, y, backDefined, -1, -1);
        if (i >= 0) {
            piece = playPieces[i];
            if ((piece.desc & MASKDIR) != dir) {
                done = true;    // cannot leave against direction of arrow
            }
        }
    }

    // is there a path leading onto destination square?
    // from this point on, x and y will refer to the destination
    if (!done) {
        switch (dir) {
        case DIRUP:
            y++;
            break;
        case DIRRIGHT:
            x++;
            break;
        case DIRDOWN:
            y--;
            break;
        case DIRLEFT:
            x--;
            break;
        }
    }
    if ((x < 0) || (y < 0) || (x >= cols) || (y >= rows)) {
        done = true;    // walks off board
    } else {
        indx = x * rows + y;
        c = playArea[indx];
        if (!front) {
            c >>= 8;    // move reverse-side tracks down
        }
        switch (dir) {
        case DIRUP:
            if ((c & BOTTOMTRACK) == 0) done = true;    // no entry this way
            break;
        case DIRRIGHT:
            if ((c & LEFTTRACK) == 0) done = true;
            break;
        case DIRDOWN:
            if ((c & TOPTRACK) == 0) done = true;
            break;
        case DIRLEFT:
            if ((c & RIGHTTRACK) == 0) done = true;
            break;
        }
    }

    // is there a one-way arrow where we're going?
    if (!done) {
        i = findPiece(ONEWAY, x, y, backDefined,
                        (dir ^ REVERSE_DIRECTION), -1);
        if (i >= 0) {
            done = true;    // cannot enter against the direction of arrow
        }
    }

    // are there any obstacles where we're going?
    if (!done) {
        if (findPiece(POCKET, x, y, true, -1, -1) >= 0) {
            done = true;    // man can't step into pocket
        }
    }
    if (!done) {
        if (findPiece(MATCHEDPAIR, x, y, true, -1, -1) >= 0) {
            done = true;    // can't dislodge a tile from its pocket
        }
    }
    if (!done) {
        // all checks passed, make the move
        indx = man.x * rows + man.y;    // index to current position
        man.x = x;    // update man's position
        man.y = y;    // ..
        recordMove(dir);

        // have we just stepped off a floating piece?
        c = playArea[indx];
        if (((c & ANCHORED) == 0) && (
            ((dir == DIRUP) && ((c & TOPEDGE) == 0)) ||
            ((dir == DIRRIGHT) && ((c & RIGHTEDGE) == 0)) ||
            ((dir == DIRDOWN) && ((c & BOTTOMEDGE) == 0)) ||
            ((dir == DIRLEFT) && ((c & LEFTEDGE) == 0)))) {
            // Yes, so turn over the vacated piece (and any other piece
            // to which it is attached. First mark all piedces to be turned,
            // noting coordinates as we go.
            setRotateDetails(indx);
            turnOver(dir);
        }

        moved = true;
    }

    if (moved) {
        // see if we've landed by any tiles
        let face = (front ? A_SIDE : 0);
        for (i = 0; i < playPieces.length; i++) {
            piece = playPieces[i];
            if ((piece.x != x) || (piece.y != y) ||
                (((piece.desc >> 4) & 7) != TILE) ||
                ((piece.desc & A_SIDE) != face)) {
                continue;
            }
            // move the tile
            // first check if it's leaving via a tunnel
            let j = findPiece(TUNNEL, x, y, true, dir, -1);
            if (j >= 0) {
                // yes, tile leaves through a tunnel
                j = findTunnel(j);    // find other end
                let tunnel = playPieces[j];
                piece.x = tunnel.x;
                piece.y = tunnel.y;
                piece.desc &= ~A_SIDE;
                piece.desc |= (tunnel.desc & A_SIDE);
            } else {
                // no tunnel
                switch (dir) {
                case DIRUP:
                    piece.y++;
                    break;
                case DIRRIGHT:
                    piece.x++;
                    break;
                case DIRDOWN:
                    piece.y--;
                    break;
                case DIRLEFT:
                    piece.x--;
                    break;
                }
            }
            // did tile land in a matching pocket?
            j = findPiece(POCKET, piece.x, piece.y, true, -1,
                            (piece.desc & COLOUR_QUAL));
            if (j >= 0) {
                let piece2 = playPieces[j];
                // Bingo! Evaporate the tile and convert the pocket
                piece.desc = EMPTY;
                piece2.desc &= 0xf;
                piece2.desc |= (MATCHEDPAIR << 4);
                checkForWin();
            }
        }
    }

    drawPuzl();
}

function nextLevel()
{
    closeAllBut("");
    if (lvl < (parLen - 1)) {
        lvl++;
        puzl(lvl);
    }
}

function level()
{
    closeAllBut("menuDrop");
    document.getElementById("menuDrop").classList.toggle("show");
}

function about()
{
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
}

function reverse()
{
    closeAllBut("");
    front = !front;
    setColours();
    drawPuzl();
}

function mouseDown(event)
{
    closeAllBut("");
    if (puzlComplete) {
        return false;    // don't accept more moves once puzzle solved
    }
    offX = event.offsetX;
    offY = event.offsetY;
    // offsets are relative to top left corner of canvas
    // compute coordinates in terms of the puzzle
    let x = Math.floor((offX - lm) / nw);
    if ((x < 0) || (x >= cols)) {
        // ignore click outside horizontal dimensions
        return false;
    }
    let y = Math.floor((offY - tm) / nh - 1);
    if (front) {
        y = rows - y - 1;
    }
    if ((y < -1) || (y > rows)) {
        // ignore click outside vertical dimensions
        return false;
    }
    
    let man = playPieces[indexMan];
    let face = (front ? A_SIDE : 0);
    if ((man.desc & A_SIDE) != face) {
        // man not on selected side, ignore click
        return false;
    }

    if ((man.x == x) && (man.y == y)) {
        // no move, click is at location of man
        return false;
    }
    if (man.x == x) {
        if (y > man.y) {
            walk(DIRUP);
        } else {
            walk(DIRDOWN);
        }
    } else if (man.y == y) {
        if (x > man.x) {
            walk(DIRRIGHT);
        } else {
            walk(DIRLEFT);
        }
    }
    return (false);
}

function mouseUp(event)
{
}

function enableKeys()
{
    if (keysEnabled) return;
    document.addEventListener('keydown', function(ev) {
        switch(ev.key) {
            case 'R':
            case 'r':
            case ' ':
                reset(); break;
            case 'F':
            case 'f':
            case 'PageDown':
            case 'PageUp':
                reverse(); break;
            case 'Z':
            case 'z':
            case 'U':
            case 'u':
                undo(); break;
            case 'ArrowUp':
                walk(front ? DIRUP : DIRDOWN); break;
            case 'ArrowRight':
                walk(DIRRIGHT); break;
            case 'ArrowDown':
                walk(front ? DIRDOWN : DIRUP); break;
            case 'ArrowLeft':
                walk(DIRLEFT); break;
            default: return;
        }
    } );
    keysEnabled = true;
}

function resize()
{
    canvas.width = puzlId.scrollWidth;   // initial value
    let margin = canvas.offsetLeft;
    let h = window.innerHeight - margin - canvas.offsetTop;
    canvas.height = h;
    drawPuzl();
}

enableKeys();
puzl(0);

