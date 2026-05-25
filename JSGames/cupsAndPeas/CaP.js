// vi:set ts=50 sw=4 ai ml:
"use strict";
const canvas = document.getElementById('cups');
const puzlId = document.getElementById('puzzleId');
canvas.width = 250;   // initial value
canvas.height = 500;  // initial value
let ctx = canvas.getContext('2d');
let bkgrnd = "#e0e0e0";
ctx.fillStyle = bkgrnd;
ctx.fillRect(0, 0, canvas.width, canvas.height);
// table indexed by (old * 4 + new)
const rotTbl = [ 0, 3, 7, 1, 1, 0, 3, 5, 7, 1, 0, 3, 3, 5, 1, 0 ];
const DBL = 0x40000;
const CLK = 0x20000;
const ROT = 0x10000;

let titles = ["Two of each", "Two plus two, no walls", "Three plus three",
    "Introducing spare cups", "3 x 3 maze", "Four + four", "The spiral",
    "Reminiscent of The Titanic", "Another 5 x 5", "Christmas Tree",
    "The lift", "The staircase", "Three rooms", "4 x 4 no walls",
    "Table for twelve", "Crossroads", "Oil and water", "The big L",
    "6 x 6 maze", "Upstairs downstairs", "Leaky bucket", "The pyramid",
    "Pyramid V2", "The hot tap", "Robocup", "Switch back", "Inner coil",
    "Catherine wheel", "Over and Down - by Cam"];
let plans = ["CAEJCgAAAAAAM6gCAIQAiKQAAA==", "CAEJCgAAAAAAMwAAhAAkKAAAiA==",
    "CAEJCgAAAAAAMwAkhCgAJIgoAA==", "CAEJCgAAAAAAMwAkiAQABACEKA==",
    "CAEJCgAAAAAAM0oBRCmFAIgAJA==", "CAEJCgAAAAAARIkAJ4SGAAAAAAGKKSoAACQ=",
    "CAEJCgAAAAAARCgBAYgChCYAAieGAIgABCg=",
    "CAEJCgAAAAAAVSgBAAElKgEAASUoAQQBJSoBAAElKAAAACQ=",
    "CAEJCgAAAAAAVQEAhQABAAGKAgAmKAQrJAEDiAEAAACEAgA=",
    "CAEJCgAAAAAAeABISEhJSYiIAAABA0QmKCgAA4REhEYD" +
        "BAJFRCREJEUEAAKFRYRGAgQAAAACRScoKABISEhISIiI",
    "CAEJCgAAAAAARAABAQEohIgkKYWJJAAAAAA=",
    "CAEJCgAAAAAARAAAAACEJEeIhCcoiIZIKIg=",
    "CAEJCgAAAAAARIgCACSJAQAkKAAAhCgCAIQ=",
    "CAEJCgAAAAAARACIACSIACQAACgAhCgAhAA=",
    "CAEJCgAAAAAARAQEBIQEiIiEBIiIhAQEBIQ=",
    "CAEJCgAAAAAAVSgCAAEkigMCAYUpAQQBJIgDAgKEKAACACQ=",
    "CAEJCgAAAAAAVQAAASkoAAOEJigEAYQmAAAChSeIAAAAiIg=",
    "CAEJCgAAAAAAVQABAQGEAImJioQCAQKKhAADAouEAAAAAIQ=",
    "CAEJCgAAAAAAZigoK4mIiAIBAAADAAEBAgEAAQIAAwABAAABAAIAASQkJoSEhA==",
    "CAEJCgAAAAAAZigAh4gAJQAEAQAEASkAh4kAJSgAh4gAJQAEAQAEASgAhogAJA==",
    "CAEJCgAAAAAARAAEKYkCAYQkAgAlhQAEiCg=",
    "CAEJCgAAAAAAVYgpiQGEKgAAhiSIAIQmJCoBAYckiCiIAIQ=",
    "CAEJCgAAAAAAVSiIiAEkKAABJIQoACWEhCgAACWEKIiIACQ=",
    "CAEJCgAAAAAAVSgpAIWEiogDJoWKiAEkJYqJAieEKCgAhIQ=",
    "CAEJCgAAAAAAVogAAQEEhSgDAAEDJCoBAAEBJCgCAQECJYgAAAAEhA==",
    "CAEJCgAAAAAAZogBAQEAJIoAAQEDJIkAAQEBJSgAAQEBhCoBAQEChCgAAAAAhA==",
    "CAEJCgAAAAAAZoiJAQEEhYoAAQIChIoBhgEAhIoAhwAAhIoBAQMChYiIAAAEhA==",
    "CAEJCgAAAAAAZikpKYaGhCkpAgKGhCgBAAADhIoAAAABJYqKAgElJYqKiCQkJA==",
    "CAEKCQgAAAAAmcikAAAKCALNbGhkAAAKCAACrajEAAEKCAAAAAEBAwwAAAAAAAgI" +
        "CAEAAAgICAAAAgwAAAAAAAEAAAACAAAAAa4BAAACAAADzGzOAAACAAKsbA=="];
let colours = [
    "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
// directions
let N = 0;
let E = 1;
let S = 2;
let W = 3;
let rotating = false;
let moving = false;
let timerRunning = false;
let animId = null;
let delayId = null;
let animStep = 0;
let win = false;
let curDir;
let puzNo = 1;
let moves = 0;
let cols = 1;
let rows = 1;
let scale = 1;
let tileUnit = 28;
let elements = 1;
let playArea = new Array(1);
let table = 0;   // offset of first puzzle column in decoded base64 definition
let newsDim = 30;    // narrow dimension of NEWS buttons
let border = newsDim;
let tileW = 1;
let playWidth = 1;
let playHeight = 1;
let NorthBtn = null;
let EastBtn = null;
let SouthBtn = null;
let WestBtn = null;
let btn = null;
let btnGroup = null;
let btnPressed = null;
let offX = -1;
let offY = -1;
let lnthk = 6;
let downSeen = false;
let winShown = false;
let gridXY = 0;

class HLButton {
    constructor(bLabel) {
        this.bx = 1;
        this.by = 1;
        this.bw = 1;
        this.bh = 1;
        this.bLabel = bLabel;
        this.bPressed = false;
        this.bSelected = false;
        this.next = null;        // next button in group
    }

    setLoc(bx, by, bw, bh) {
        this.bx = bx;
        this.by = by;
        this.bw = bw;
        this.bh = bh;
    }

    isPressed() {
        return (this.bPressed);
    }

    isSelected() {
        return (this.bPressed);
    }

    draw() {
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(this.bx, this.by, this.bw, this.bh);
        ctx.fillStyle = (this.isPressed() ? "#ffffff" : "#808080");
        ctx.fillRect(this.bx, this.by + this.bh - 2, this.bw, 2);
        ctx.fillRect(this.bx + this.bw - 2, this.by, 2, this.bh);
        ctx.fillStyle = "#ffffff";
        ctx.fillStyle = (this.isPressed() ? "#808080" : "#ffffff");
        ctx.fillRect(this.bx, this.by, this.bw, 1);
        ctx.fillRect(this.bx, this.by + 1, this.bw - 1, 1);
        ctx.fillRect(this.bx, this.by, 1, this.bh);
        ctx.fillRect(this.bx + 1, this.by, 1, this.bh - 1);
        ctx.fillStyle = "#000000";
        let sz = newsDim * 0.75;
        ctx.font = `${sz}px Arial,TimesNewRoman,Courier`;
        let tm = ctx.measureText(this.bLabel);
        let xx = this.bx + (this.bw - tm.actualBoundingBoxRight) / 2;
        let yy = this.by + (this.bh + tm.actualBoundingBoxAscent) / 2;
        ctx.fillText(this.bLabel, xx, yy);
    }
}

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

// decode base64 character n of array b to 6-bit value 
function decode(b, n) {
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
function dcd(b, n) {
    let n4 = 4 * n;
    if (n4 >= 3 * b.length) {
        alert("index ${n} exceeds decoded length of base64 string");
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

function closeAllBut(id) {
    //let id2 = "msgDrop";
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        let thisDrop = dropdowns[i];
        if ((thisDrop.id != id) && thisDrop.classList.contains("show")) {
            thisDrop.classList.remove("show");
        }
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropDown = dropdowns[i];
            // if ((openDropDown.id != "msgDrop") &&
            if (openDropDown.classList.contains('show')) {
                openDropDown.classList.remove('show');
            }
        }
    }
}

function actions() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
}

function menu() {
    closeAllBut("menuDrop");
    document.getElementById("menuDrop").classList.toggle("show");
}

function help() {
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
}

function showAbout() {
    closeAllBut("msgDrop");
    let el = document.getElementById("msgDrop");
    let list = el.classList;
    list.toggle("show");
    winShown = true;
}

function dismiss() {
    document.getElementById("msgDrop").classList.remove("show");
}

let delayCount = 0;
function resizeDelay() {
    if ((window.innerWidth > screen.width) ||
        (window.innerHeight > screen.height)) {
        canvas.width = 250;
        canvas.height = 250;
        window.innerWidth = screen.width - 10;
        window.innerHeight = screen.height - 10;
        ++delayCount; 
    }
    resize();
}

function resize() {
    if ((window.innerWidth > screen.width) ||
        (window.innerHeight > screen.height)) {
        if (!timerRunning) {
            delayId = window.setInterval(resizeDelay, 200);
            timerRunning = true;
            canvas.width = 250;
            canvas.height = 250;
            return;
        } else {
            if (delayCount < 3) {
                return;
            }
        }
    }
    if (timerRunning) {
        window.clearInterval(delayId);
        timerRunning = false;
        delayCount = 0;
    }
    let i = 0;
    let margin = canvas.offsetLeft;
    let w = window.innerWidth - 2 * margin;
    let h = window.innerHeight - canvas.offsetTop - margin;
    //alert(`screen: ${screen.width}, ${screen.height}, w = ${w}, h = ${h}`);
    canvas.width = w;
    canvas.height = h;
    let brdrW = border = Math.floor(w / 16);
    let brdrH = Math.floor(h / 16);
    tileW = Math.floor((w - 4 * brdrW) / cols);
    tileW = 28 * Math.floor(tileW / 28);  // round down to multiple of 28
    let tileH = Math.floor((h - 4 * brdrH) / rows);
    tileH = 28 * Math.floor(tileH / 28);
    if (tileW > tileH) {
        tileW = tileH;
        border = brdrH;
    }
    newsDim = border;
    // try to match menus to newsDim 
    let dropbtns = document.getElementsByClassName("dropbtn");
    let sz = newsDim * 0.75;
    for (i = 0; i < dropbtns.length; i++) {
        dropbtns[i].style.fontSize = `${sz}px`;
    }
    let dropContent = document.getElementsByClassName("dropdown-content");
    for (i = 0; i < dropContent.length; i++) {
        dropContent[i].style.fontSize = `${sz}px`;
    }
    puzlId.style.fontSize = `${sz}px`;
    document.getElementById("msgDrop").style.fontSize = `${sz}px`;
    // These new font sizes will upset the required canvas size, so start again
    w = window.innerWidth - 2 * margin;
    h = window.innerHeight - canvas.offsetTop - margin;
    //alert(`screen: ${screen.width}, ${screen.height}, w = ${w}, h = ${h}`);
    canvas.width = w;
    canvas.height = h;
    brdrW = border = Math.floor(w / 16);
    brdrH = Math.floor(h / 16);
    tileW = Math.floor((w - 4 * brdrW) / cols);
    tileW = 28 * Math.floor(tileW / 28);  // round down to multiple of 28
    tileH = Math.floor((h - 4 * brdrH) / rows);
    tileH = 28 * Math.floor(tileH / 28);
    if (tileW > tileH) {
        tileW = tileH;
        border = brdrH;
    }
    newsDim = border;
    scale = tileW / 28;
    // recalculate border
    lnthk = tileW / 14;
    border = Math.floor((w - 2 * newsDim - 2 - lnthk - tileW * cols) / 2);
    let brdr2 =
        Math.floor((h - margin - 2 * newsDim - 2 - lnthk - tileW * rows) / 2);
    if (border > brdr2) {
        border = brdr2;
    }
    // relocate the NEWS buttons
    NorthBtn.setLoc(1, 1, 2 * (newsDim + border) + lnthk + tileW * cols,
                    newsDim);
    WestBtn.setLoc(1, 1 + newsDim, newsDim, 2 * border + lnthk + tileW * rows);
    EastBtn.setLoc(1 + newsDim + 2 * border + lnthk + tileW * cols, 1 + newsDim,
                    newsDim, 2 * border + lnthk + tileW * rows);
    SouthBtn.setLoc(1, 1 + newsDim + 2 * border + lnthk + tileW * rows,
                    2 * (newsDim + border) + lnthk + tileW * cols, newsDim);
    gridXY = 1 + newsDim + border + lnthk;
    drawPuzl();
}

/*
 * after remapping the definition fields, each tile is represented thus:
 *         |1|1|1| 2 |1|  3  | 2 |  3  |1|1|1|1|1|   field widths in bits
 *          --- - --- - ----- --- ----- - - - - -
 *         |4|2|1|8|4|2|1|8|4|2|1|8|4|2|1|8|4|2|1|   MVP = moving pea
 *          --- - --- - ----- --- ----- - - - - -    BW  = bottom wall
 *         |D|C|R|Mov|M| Pea |Cup| Cup |-|P|C|B|R|   RW  = right wall
 *         |B|L|O|Dir|V| Clr |Dir| Clr | |e|u|W|W|   ROT = rotating cup
 *         |L|K|T|   |P|     |   |     | |a|p| | |   
 *          --- - --- - ----- --- ----- - - - - -    DBL = double speed
 */
function reset() {
    let tile;
    let clr;
    win = false;
    moves = 0;
    if (cols > 1) {
        // The values placed at each element of playArea are initialised
        // using the decoded base64 elements of the puzzle definition. 
        // Note, that the definiton specifies the least significant byte
        // of each element of playArea. Higher order bytes are initialised
        // to zero, however, higher order bits are used to hold dynamically
        // changing attributes, in particular the direction faced by a cup.
        for (let i = 0; i < elements; i++) {
            tile = dcd(plans[puzNo - 1], table + i);
            // relocate colour of pea to allow peas to enter cups
            if ((tile & 8) != 0) {
                // this is a pea, move its colour field
                clr = (tile & 0xe0);   // extract colour field
                tile &= ~0xe0;         // clear lower colour field
                tile |= (clr << 5);    // move colour to pea colour field
            }
            playArea[i] = tile;
        }
    }
    drawPuzl();
}

function save() {
    alert("save");
}

function done() {
    if (window.opener == null) {
        alert(`not a free-standing window`);
    } else {
        window.close();
    }
}

function drawPuzl() {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let btn = btnGroup;
    while (btn != null) {
        btn.draw();
        btn = btn.next;
    }
    if (win) {
        // colour border red
        ctx.fillStyle = "red";
        ctx.fillRect(1 + newsDim, 1 + newsDim,
                        2 * border + tileW * cols + lnthk, border);
        ctx.fillRect(1 + newsDim, 1 + newsDim + border,
                        border, tileW * rows + lnthk);
        ctx.fillRect(1 + newsDim + border + tileW * cols + lnthk,
                    1 + newsDim + border, border, tileW * cols + lnthk);
        ctx.fillRect(1 + newsDim, 1 + newsDim + border + tileW * rows + lnthk,
                    2 * border + tileW * cols + lnthk, border);
    }
    // show number of moves
    ctx.fillStyle = "black";
    let tm = ctx.measureText(`${moves}`);
    let xx = 1 + newsDim + lnthk + 2 * border + tileW * cols -
                tm.actualBoundingBoxRight - 8;
    let yy = 1 + newsDim + 2 * border + tileW * rows + lnthk -
                tm.actualBoundingBoxAscent;
    ctx.fillText(`${moves}`, xx, yy);

    // draw frame round matrix
    ctx.fillRect(gridXY - lnthk, gridXY - lnthk,
                tileW * cols + lnthk, lnthk);
    ctx.fillRect(gridXY - lnthk, gridXY,
                lnthk, tileW * rows);
    ctx.fillRect(gridXY, gridXY + tileW * rows - lnthk,
                tileW * cols, lnthk);
    ctx.fillRect(gridXY + tileW * cols - lnthk, gridXY,
                lnthk, tileW * rows);
    // draw all the tiles
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            ctx.fillStyle = "black";
            let tile = playArea[x * rows + y];
            if ((tile & 1) != 0) {
                // right-hand wall
                ctx.fillRect(gridXY + (x + 1) * tileW - lnthk,
                    gridXY + y * tileW, lnthk, tileW);
            }
            if ((tile & 2) != 0) {
                // bottom wall
                ctx.fillRect(gridXY + x * tileW - lnthk, 
                    gridXY + (y + 1) * tileW - lnthk, tileW + lnthk, lnthk);
            }
            let clr = ((tile & 0xe0) >> 5);
            let cupX = gridXY + x * tileW + (tileW - lnthk) / 2;
            let cupY = gridXY + y * tileW + (tileW - lnthk) / 2;
            if ((tile & 4) != 0) {
                // cup
                let angle;
                let rot = false;
                ctx.fillStyle = colours[clr];
                ctx.beginPath();
                ctx.arc(cupX, cupY, 11 * scale, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.fillStyle = bkgrnd;
                ctx.beginPath();
                ctx.arc(cupX, cupY, 5 * scale, 0, 2 * Math.PI, false);
                ctx.fill();
                let dir = (tile >> 8) & 3;
                if ((tile & ROT) != 0) {
                    rot = true;
                    angle = ((28 - animStep) * Math.PI) / 56;
                    if ((tile & DBL) != 0) {
                        angle *= 2;
                    }
                    if ((tile & CLK) == 0) {
                        angle = 0 - angle;
                    }
                }
                switch(dir) {
                    case N:
                        if (!rot) {
                            ctx.fillRect(cupX - 5 * scale, cupY - 11 * scale,
                                        10 * scale, 11 * scale);
                        }
                        break;
                    case E:
                        if (rot) {
                            angle += (Math.PI / 2);
                        } else {
                            ctx.fillRect(cupX, cupY - 5 * scale,
                                        11 * scale, 10 * scale);
                        }
                        break;
                    case S:
                        if (rot) {
                            angle += Math.PI;
                        } else {
                            ctx.fillRect(cupX - 5 * scale, cupY,
                                        10 * scale, 11 * scale);
                        }
                        break;
                    case W:
                        if (rot) {
                            angle -= (Math.PI / 2);
                        } else {
                            ctx.fillRect(cupX - 11 * scale, cupY - 5 * scale,
                                        11 * scale, 10 * scale);
                        }
                        break;
                }
                if (rot) {
                    let sinAngle = Math.sin(angle);
                    let cosAngle = Math.cos(angle);
                    let x1 = - 5 * scale * cosAngle;
                    let y1 = - 5 * scale * sinAngle;
                    let x2 = x1 + 11 * scale * sinAngle;
                    let y2 = y1 - 11 * scale * cosAngle;
                    let x3 = x2 + 10 * scale * cosAngle;
                    let y3 = y2 + 10 * scale * sinAngle;
                    let x4 = -x1;
                    let y4 = -y1;

                    ctx.beginPath();
                    ctx.moveTo(cupX + x1, cupY + y1);
                    ctx.lineTo(cupX + x2, cupY + y2);
                    ctx.lineTo(cupX + x3, cupY + y3);
                    ctx.lineTo(cupX + x4, cupY + y4);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            if ((tile & 8) != 0) {
                // pea
                clr = (tile >> 10) & 7;
                ctx.fillStyle = colours[clr];
                if ((tile & 0x2000) != 0) {
                    // this pea is moving
                    let peaDir = (tile >> 14) & 3;
                    switch(peaDir) {
                    case N:
                        // the co-ord represent the destination,
                        // so show the pea further south
                        cupY += animStep * scale;
                        break;
                    case E:
                        cupX -= animStep * scale;
                        break;
                    case S:
                        cupY -= animStep * scale;
                        break;
                    case W:
                        cupX += animStep * scale;
                        break;
                    }
                }
                ctx.beginPath();
                ctx.arc(cupX, cupY, 5 * scale, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
    }
}

function puzl(puz) {
    puzNo = puz;
    puzlId.innerHTML = titles[puzNo - 1];

    let cr;
    let b0 = dcd(plans[puzNo - 1], 0);
    if (b0 < 16) {
        // zero cols means cols/rows comes later (b0 later)
        table = 2 + b0;
        cr = dcd(plans[puzNo - 1], 1 + b0);
    } else {
        table = 1;
        cr = b0;
    }
    cols = (cr >> 4) & 0xf;
    rows = (cr & 0xf);
    elements = cols * rows;
    if (playArea.length != elements) {
        // resize playArea array
        playArea = new Array(elements);
    }
    reset();
    resize();
}

function about() {
    showAbout();
}

function instructions() {
    alert("instructions");
}

function chkWin() {
    for (let i = 0; i < rows * cols; i++) {
        let tile = playArea[i];
        if ((tile & 4) != 0) {
            let clr = ((tile & 0xE0) >> 5);
            if (clr != 0) {
                // found a coloured (not black) cup
                if ((tile & 8) == 0) {
                    // no pea
                    return false;
                }
                if (clr != ((tile & 0x1C00) >> 10)) {
                    // cup and pea not same colour
                    return false;
                }
            }
        }
    }
    return true;
}

// Called to move free peas one tile. Assumes cups have been oriented by tilt()
// If any movement was made, moving is set true and animation is begun.
// At the end of the animation, move will be called again if moving is set.
function move(dir) {
    // when looking for peas that can move, it is necessary to start at the
    // correct row or column and then work away from it. so, if the direction
    // is South, start at the lowest but one row and work up.
    let i;
    let j;
    let x;
    let y;
    let tile;
    let tile2;
    let peaClr;
    moving = false;
    curDir = dir;

    switch (dir) {
    case N:
        // row 0 is the end of the movement so start with row 1
        for (y = 1; y < rows; y++) {
            for (x = 0; x < cols; x++) {
                i = x * rows + y;
                tile = playArea[i];
                if ((tile & 8) != 0) {
                    // Found a pea. Is there a space above it?
                    j = x * rows + y - 1;
                    tile2 = playArea[j];
                    if  ( ( ((tile & 4) == 0) ||
                           (((tile & 4) != 0) && (((tile >> 8) & 3) == N))
                          ) &&
                          ((tile2 & 0xA) == 0) &&
                          (  ((tile2 & 4) == 0) ||
                            (((tile2 & 4) != 0) && (((tile2 >> 8) & 3) == S))
                          )
                        ) {
                        // no obstruction, move pea from tile to tile2
                        peaClr = tile & 0x1C08;
                        tile  &= ~0xFC08;
                        tile2 &= ~0xFC08;
                        tile2 |= peaClr | (dir << 14) | (1 << 13);
                        playArea[i] = tile;
                        playArea[j] = tile2;
                        moving = true;
                    }
                }
            }
        }
        break;
    case E:
        // col (cols - 1) is the end of movement so start with (cols - 2)
        for (x = cols - 2; x >= 0; x--) {
            for (y = 0; y < rows; y++) {
                i = x * rows + y;
                tile = playArea[i];
                if ((tile & 8) != 0) {
                    // Found a pea. Is there a space right of it?
                    j = (x + 1) * rows + y;
                    tile2 = playArea[j];
                    if  (((tile & 1) == 0) &&
                           ( ((tile & 4) == 0) ||
                             (((tile & 4) != 0) && (((tile >> 8) & 3) == E))
                           ) &&
                         ((tile2 & 0x8) == 0) &&
                           ( ((tile2 & 4) == 0) ||
                             (((tile2 & 4) != 0) && (((tile2 >> 8) & 3) == W))
                           )
                        ) {
                        // no obstruction, move pea from tile to tile2
                        peaClr = tile & 0x1C08;
                        tile  &= ~0xFC08;
                        tile2 &= ~0xFC08;
                        tile2 |= peaClr | (dir << 14) | (1 << 13);
                        playArea[i] = tile;
                        playArea[j] = tile2;
                        moving = true;
                    }
                }
            }
        }
        break;
    case S:
        // row (rows - 1) is the end of movement so start with (rows - 2)
        for (y = rows - 2; y >= 0; y--) {
            for (x = 0; x < cols; x++) {
                i = x * rows + y;
                tile = playArea[i];
                if ((tile & 8) != 0) {
                    // found a pea. Is there a space below it>
                    j = x * rows + y + 1;
                    tile2 = playArea[j];
                    if  (((tile & 2) == 0) &&
                           ( ((tile & 4) == 0) ||
                             (((tile & 4) != 0) && (((tile >> 8) & 3) == S))
                           ) &&
                         ((tile2 & 8) == 0) && 
                           (  ((tile2 & 4) == 0) ||
                             (((tile2 & 4) != 0) && (((tile2 >> 8) & 3) == N))
                           )
                        ) {
                        // no obstruction, move pea from tile to tile2
                        peaClr = tile & 0x1C08;
                        tile  &= ~0xFC08;
                        tile2 &= ~0xFC08;
                        tile2 |= peaClr | (dir << 14) | (1 << 13);
                        playArea[i] = tile;
                        playArea[j] = tile2;
                        moving = true;
                    }
                }
            }
        }
        break;
    case W:
        // col 0 is the end of movement so start with col 1
        for (x = 1; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                i = x * rows + y;
                tile = playArea[i];
                if ((tile & 8) != 0) {
                    // found a pea. Is there a space to its left?
                    j = (x - 1) * rows + y;
                    tile2 = playArea[j];
                    if  ( ( ((tile & 4) == 0) ||
                           (((tile & 4) != 0) && (((tile >> 8) & 3) == W))
                          ) &&
                          ((tile2 & 9) == 0) &&
                           (  ((tile2 & 4) == 0) ||
                             (((tile2 & 4) != 0) && (((tile2 >> 8) & 3) == E))
                           )
                        ) {
                        // no obstruction, move pea from tile to tile2
                        peaClr = tile & 0x1C08;
                        tile  &= ~0xFC08;
                        tile2 &= ~0xFC08;
                        tile2 |= peaClr | (dir << 14) | (1 << 13);
                        playArea[i] = tile;
                        playArea[j] = tile2;
                        moving = true;
                    }
                }
            }
        }
        break;
    }
    if (moving) {
        animStep = 26;
        if (!timerRunning) {
            animId = window.setInterval(animNext, 20);
            timerRunning = true;
        }
    }
    drawPuzl();
}

function animNext() {
    animStep -= 2;
    drawPuzl();
    if (animStep <= 0) {
        animComplete();
    }
}

function animComplete() {
    if (rotating) {
        for (let i = 0; i < cols * rows; i++) {
            let tile = playArea[i];
            if ((tile & 4) != 0) {    // is there a cup in this tile?
                tile &= ~0x300;    // clear direction field
                if ((tile & 8) != 0) {
                    // cup contains a pea
                    tile |= (curDir << 8);    // turn cup to face new dir
                } else {
                    tile |= ((curDir ^ 2) << 8);    // turn away
                }
                // clear rotation flags
                tile &= ~0x70000;
                playArea[i] = tile;
            }
        }
        rotating = false;
        // start moving peas
        move(curDir);
    } else {
        // clear the moving flag on all peas
        for (let i = 0; i < rows * cols; i++) {
            if ((playArea[i] & 8) != 0) {
                playArea[i] &= ~0xE000;
            }
        }

        if (moving) {
            move(curDir);
        }

        if (!moving && timerRunning) {
            window.clearInterval(animId);
            timerRunning = false;
            win = chkWin();
            drawPuzl();
        }
    }
}

function tilt(dir) {
    moves++;
    curDir = dir;
    rotating = false;
    for (let i = 0; i < cols * rows; i++) {
        let tile = playArea[i];
        if ((tile & 4) != 0) {    // is there a cup in this tile?
            let oldDir = ((tile & 0x300) >> 8);
            let newDir = ((tile & 8) == 0 ? dir ^ 2 : dir);
            tile &= ~0x70000;    // clear rotation settings
            tile |= ((rotTbl[4 * oldDir + newDir]) << 16);  // set up rotation
            playArea[i] = tile;
            if ((tile & ROT) != 0) {
                rotating = true;
            } else {
                tile &= ~0x300;    // clear direction field
                if ((tile & 8) != 0) {
                    // cup contains a pea
                    tile |= (dir << 8);    // turn cup to face new direction
                } else {
                    tile |= ((dir ^ 2) << 8);    // turn away
                }
                playArea[i] = tile;
            }
        }
    }
    if (rotating) {
        animStep = 26;
        if (!timerRunning)  {
            animId = window.setInterval(animNext, 20);
            timerRunning = true;
        }
    }
    if (!rotating) {
        move(dir);
    }
}

function mouseDown(event) {
    offX = event.offsetX;
    offY = event.offsetY;
    btnPressed = findBtn(offX, offY);
    if (btnPressed != null) {
        downSeen = true;
        for (btn = btnGroup; btn != null; btn = btn.next) {
            btn.bSelected = btnPressed.bPressed = true;
            btnPressed.draw();
        }
    }
}

function mouseUp(event) {
    if (downSeen) {
        downSeen = false;
        btn = findBtn(event.offsetX, event.offsetY);
        if (btn == btnPressed) {
            btn.bPressed = false;
            btn.draw();
            if (!moving) {
                switch(btn.bLabel) {
                case "N":
                    tilt(N);
                    break;
                case "E":
                    tilt(E);
                    break;
                case "S":
                    tilt(S);
                    break;
                case "W":
                    tilt(W);
                    break;
                }
            }
        }
    }
}

btnGroup  = NorthBtn = new HLButton("N");
NorthBtn.next = WestBtn  = new HLButton("W");
WestBtn.next  = EastBtn  = new HLButton("E");
EastBtn.next  = SouthBtn = new HLButton("S");
puzl(puzNo);
