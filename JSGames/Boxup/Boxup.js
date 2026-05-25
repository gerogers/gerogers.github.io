// vi:se ts=50 sw=4 ai ml:

"use strict";

let titles = ["3x3 No. 1", "3x3 No. 2", "3x3 No. 3", "3x3 No. 4",
    "3x2 Test case", "3x3 BH255", "3x3 BH2545", "3x3 BH2524?", "3x3 BH2524?D",
    "4x4 No. 1", "4x4 No. 2", "4x4 No. 3", "4x4 No. 4", "5x5 No. 1",
    "5x5 No. 2", "5x5 No. 3", "5x5 No. 4"];
let plans = ["33000C`^000", "33000R`O000", "33`0]0R0C00", "330Y0G`Z0Q0",
    "320K^c]0YA`", "33bU0000C00V`", "330VbIC0000U`", "330IbA00C0]V`",
    "33IM0c00CV0YA`", "4400`Z0aG00Ma0Q000", "440Y0`0OA]ZAE000Q0",
    "4400`0VA0]U0A]UC0]", "440]Z0Y`MAGAQ]0QA0", "55K0U0a0a000000a000aV0`a00]",
    "5500000UAa0aRO000`aYaQ00000", "550000KUAQA00aaa`0IYI^A0000",
    "55000I00aA0CU00a00]a0YU00R`"];
const canvas = document.getElementById('boxup');
const ctx = canvas.getContext('2d');
let puzNo = 0;
let moves = 0;
let gameOver = false;
let winShown = false;
let GVwidth = 0;
let GVheight = 0;
let GVcols = 1;
let GVrows = 1;
let gridX = -1;
let gridY = -1;
let playArea = null;
let inMotionChain = null;
let animStep = 0;
let animId = -1;
let winId = -1;
let timer2Running = false;
let mover = null;
let GVanimate = null;
let playWidth = 1;
let playHeight = 1;
let xOff = 1;
let yOff = 1;
let sOriginX = 0;
let sOriginY = 0;
let prevX = -1;
let prevY = -1;
let abs_dx = 0;
let abs_dy = 0;
let mX = 0;
let mY = 0;
let scale = 1;
let curDir = -1;    // direction of travel (if any)
let Xinc = 0;
let Yinc = 0;
// Ushape variables
let NORTH = 0;
let EAST  = 1;
let SOUTH = 2;
let WEST  = 3;
let HOME  = 4;
let uBLACK = 0;
let uBLUE  = 1;
let uRED   = 2;
let uSMALL = 0;
let uLARGE = 1;
let uFIXED = 2;
let uMOVER = 3;
let UNIT_SIZE = 19;
let sRows = 1;
let sCols = 1;

class Ushape {
    constructor(type, facing, colour, x, y) {
        this.mType = type;
        this.mFacing = facing;
        this.mColour = colour;
        this.mX = x;
        this.mY = y;
        this.mXdisp = 0;
        this.mYdisp = 0;
        this.mChain = null;
    }

    getType() {
        return this.mType;
    }

    getX() {
        return this.mX;
    }

    getY() {
        return this.mY;
    }

    getIndex() {
        return this.mY * sCols + this.mX;
    }

    getOpenSide() {
        return this.mFacing;
    }

    getColour() {
        let clr = "white";
        switch(this.mColour) {
        case uBLACK:
            clr = "black";
            break;
        case uBLUE:
            clr = "blue";
            break;
        case uRED:
            clr = "red";
            break;
        }
        return clr;
    }

    getNext() {
        return this.mChain;
    }

    draw(ctx) {
        let off;
        let width;
        let len;

        switch (this.mType) {
        case uSMALL:
        case uLARGE:
        {
            ctx.fillStyle = this.getColour();
            if (this.mType == uLARGE) {
                off = 2;
                width = 3 * scale;
                len = UNIT_SIZE * scale;
            } else {
                off = 3.5 * scale + 1;
                width = 3 * scale;
                len = 12 * scale;
            }

            if (this.mFacing != NORTH) {
                ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                    this.mXdisp * scale + sOriginX + off),
                    Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                    this.mYdisp * scale + sOriginY + off),
                    Math.floor(len), Math.floor(width));
            }
            if (this.mFacing != WEST) {
                ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                    this.mXdisp * scale + sOriginX + off),
                    Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                    this.mYdisp * scale + sOriginY + off),
                    Math.floor(width), Math.floor(len));
            }
            if (this.mFacing != SOUTH) {
                ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                    this.mXdisp * scale + sOriginX + off),
                    Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                    this.mYdisp * scale + sOriginY + off + (len - width)),
                    Math.floor(len), Math.floor(width));
            }
            if (this.mFacing != EAST) {
                ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                    this.mXdisp * scale + sOriginX + off + (len - width)),
                    Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                    this.mYdisp * scale + sOriginY + off),
                    Math.floor(width), Math.floor(len));
            }
            break;
        }
        case uFIXED:
        {
            ctx.fillStyle = this.getColour();
            off = 2;
            len = UNIT_SIZE * scale;
            ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                sOriginX + off),
                Math.floor(this.mY * (5 + UNIT_SIZE * scale) + sOriginY + off),
                Math.floor(len), Math.floor(len));
            break;
        }

        case uMOVER:
        {
            ctx.fillStyle = "#e0e0e0";
            off = Math.floor(3.5 * scale + 1);
            len = 12 * scale;

            ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                this.mXdisp * scale + sOriginX + off),
                Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                this.mYdisp * scale + sOriginY + off),
                Math.floor(len), Math.floor(len));
            ctx.fillStyle = this.getColour();
            off = Math.floor(6.5 * scale + 3);
            len = 6 * scale - 4;
            ctx.fillRect(Math.floor(this.mX * (5 + UNIT_SIZE * scale) +
                this.mXdisp * scale + sOriginX + off),
                Math.floor(this.mY * (5 + UNIT_SIZE * scale) +
                this.mYdisp * scale + sOriginY + off),
                Math.floor(len), Math.floor(len));
            break;
        }
        }
    }

    addToChain(piece) {
        let nxt;

        for (nxt = this; nxt.mChain != null; nxt = nxt.mChain) {
            ;
        }

        nxt.mChain = piece;
    }

    unChain(piece) {
        let nxt;

        for (nxt = this; nxt.mChain != null; nxt = nxt.mChain) {
            if (nxt.mChain == piece) {
                // unchain named piece (and any following piece)
                nxt.mChain = null;
                break;
            }
        }
    }

    setDisp(offset, direction) {
        switch (direction) {
        case NORTH:
            this.mYdisp = -offset;
            break;
        case EAST:
            this.mXdisp = offset;
            break;
        case SOUTH:
            this.mYdisp = offset;
            break;
        case WEST:
            this.mXdisp = -offset;
            break;
        }
    }

    getDisp(direction) {
        let offset = 0;

        switch(direction) {
        case NORTH:
            offset = -this.mYdisp;
            break;
        case EAST:
            offset = this.mXdisp;
            break;
        case SOUTH:
            offset = this.mYdisp;
            break;
        case WEST:
            offset = -this.mYdisp;
            break;
        }

        return offset;
    }

    moveShape(direction) {
        switch (direction) {
        case NORTH:
            this.mY--;
            break;
        case EAST:
            this.mX++;
            break;
        case SOUTH:
            this.mY++;
            break;
        case WEST:
            this.mX--;
            break;
        }

        this.mXdisp = 0;
        this.mYdisp = 0;
    }
}

// set up first puzzle
reset();

function showMoves() {
    document.getElementById("movesId").innerHTML = `Moves ${moves}`;
}

function showTitle() {
    document.getElementById("puzzleId").innerHTML = titles[puzNo];
}

function showCongrats() {
    document.getElementById("messageDrop").classList.toggle("show");
    //alert("Congratulations");
    //window.clearInterval(winId);
    //timer2Running = false;
    winShown = true;
}

function OKbtn() {
    document.getElementById("messageDrop").classList.remove("show");
    next();
}

function closeAllBut(id) {
    let id2 = "messageDrop";
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        let thisDrop = dropdowns[i];
        if ((thisDrop.id != id) && (thisDrop.id != id2) &&
            (thisDrop.classList.contains("show"))) {
            thisDrop.classList.remove("show");
        }
    }
}

function actions() {
    closeAllBut("actionsDrop");
    document.getElementById("actionsDrop").classList.toggle("show");
}

function reset() {
    setupGame(null);
}

function next() {
    if (puzNo < titles.length - 1) {
        puzNo++;
    }
    document.getElementById("puzzleId").innerHTML = titles[puzNo];
    reset();
}

function prev() {
    if (puzNo > 0) {
        puzNo--;
    }
    document.getElementById("puzzleId").innerHTML = titles[puzNo];
    reset();
}

function help() {
    closeAllBut("helpDrop");
    document.getElementById("helpDrop").classList.toggle("show");
}

function about() {
    alert("Boxup Puzzles: version 1.2\nLast updated: Oct 2020\n" +
    "Credits: game was devised by Andrea Gilbert \u00A9 2002-2003\n" +
    "Java implementation: Graham Rogers, \u00A9 2013\n" +
    "This Javascript version: Graham Rogers, \u00A9 2020");
}

function instructions() {
    alert("Aim: to move the small red U-shape into the large blue U-shape.\n" +
    "You can move the black square (with grey halo) by clicking in the " +
    "required destination square. This must be in the same row or column as " +
    "its current position.\n" +
    "To move any of the U-shapes, place the small black square inside the " +
    "piece to be moved and use it to push the U-shape.\n" +
    "Move through the puzzles using Actions/Next or Actions/Prev\n" +
    "Restart current puzzle using Actions/Reset\n" +
    "Each square crossed by the black square increments the Moves count");

}

function congrats() {
    closeAllBut("messageDrop");
    let el = document.getElementById("messageDrop");
    let list = el.classList;
    list.toggle("show");
}

function ignore() {
    return;
}

function mouseClick(event) {
    let x = event.offsetX;
    let y = event.offsetY;
    let c = Math.floor((x - sOriginX) / (5 + UNIT_SIZE * scale));
    let r = Math.floor((y - sOriginY) / (5 + UNIT_SIZE * scale));
    if (r < 0 || r >= GVrows || c < 0 || c > GVcols || gameOver) {
        return;    // off grid or game over
    }

    gridX = c;
    gridY = r;

    let xNow = mover.getX();
    let yNow = mover.getY();
    if (xNow != gridX) {
        if (yNow != gridY) {
            return;    // this is a diagonal move, ignore
        }
        Yinc = 0;
        Xinc = ((xNow > gridX) ? -1 : 1);    // move in X direction
    } else if (yNow != gridY) {
        Xinc = 0;
        Yinc = ((yNow > gridY) ? -1 : 1);    // move in Y direction
    } else {
        return;    // mouse click in current location, ignore
    }

    if (moveRequest(Xinc, Yinc, false)) {
        // initiate animation
        animStep = 1;
        animId = window.setInterval(animNext, 5);
    }
}

function animNext() {
    if (gameOver) {
        return;
    }
    if (++animStep > UNIT_SIZE) {
        window.clearInterval(animId);
        animComplete();
    } else {
        // redraw until we've arrived
        moveRequest(Xinc * animStep, Yinc * animStep, false);
        paintPuzzle();
    }
}

function animComplete() {
    animStep = 0;
    let xNow = mover.getX();
    let yNow = mover.getY();
    moveRequest(0, 0, true);

    if ((xNow == gridX) && (yNow == gridY)) {
        // move complete
        return;
    }

    if (xNow != gridX) {
        if (yNow != gridY) {
            // this is a diagonal move, ignore
            return;
        }
        // move in X direction
        Yinc = 0;
        Xinc = ((xNow > gridX) ? -1 : 1);
    } else if (yNow != gridY) {
        // move in Y direction
        Xinc = 0;
        Yinc = ((yNow > gridY) ? -1 : 1);
    }

    if (moveRequest(Xinc, Yinc, false)) {
        // restart animation heading towards target square
        animStep = 1;
        animId = window.setInterval(animNext, 5);
    }
}

function moveRequest(dx, dy, force) {
    let delta = 0;
    let direction = HOME;
    let moverX = mover.getX();
    let moverY = mover.getY();
    let index = GVcols * moverY + moverX;
    let mAbs_dx = ((dx < 0) ? -dx : dx);
    let mAbs_dy = ((dy < 0) ? -dy : dy);
    if (mAbs_dx > mAbs_dy) {
        // use dx
        if (dx < 0) {
            if (moverX == 0) {
                return false;
            } else {
                direction = WEST;
                delta = -dx;
            }
        } else if (dx > 0) {
            if (moverX == GVcols - 1) {
                return false;
            } else {
                direction = EAST;
                delta = dx;
            }
        }
    }

    if (mAbs_dy > mAbs_dx) {
        // use dy
        if (dy < 0) {
            if (moverY == 0) {
                return false;
            } else {
                direction = NORTH;
                delta = -dy;
            }
        } else if (dy > 0) {
            if (moverY == GVrows - 1) {
                return false;
            } else {
                direction = SOUTH;
                delta = dy;
            }
        }
    }

    // check if a movement has already begun in this direction
    if (inMotionChain == null) {
        // New movement. Assess if the suggested move can be made and by
        // how many pieces
        curDir = direction;
        let baseShape = playArea[index];
        let largeU = null;
        let smallU = null;
        let largeExitOK = true;
        let smallExitOK = true;

        if (baseShape == null) {
            // if not in motion, at least mover must be at the indexed
            // position, so this is unexpected
            return false;
        }

        // There are 4 possibilites: UUm, Um, um, m
        switch (baseShape.getType()) {
        case uLARGE:
            largeU = baseShape;
            // largeU may have a nested small u
            smallU = baseShape.getNext();
            if (smallU == null) {
                // neither small piece nor mover here, a logical error
                return false;
            }
            if (smallU.getType() != uSMALL) {
                // it has to be the mover
                smallU = null;
                smallExitOK = false;
            }
            break;
        case uSMALL:
            smallU = baseShape;
            largeExitOK = false;
            break;
        case uMOVER:
            // There is only the mover here.
            largeExitOK = false;
            smallExitOK = false;
            break;
        default:
            // actually a logical failure
            return false;
        }

        if (largeU != null) {
            if (largeU.getOpenSide() == direction) {
                // large U faces direction of travel, so it will stand still
                largeExitOK = false;
            }
        }
        if (smallU != null) {
            if (smallU.getOpenSide() == direction) {
                if ((largeU != null) && largeExitOK) {
                    // smallU is nested in a largeU than can move
                    // The smallU will be carried by the largeU unless the
                    // largeU is facing away from the direction of travel
                    if (largeU.getOpenSide() == (direction ^ 2)) {
                        smallExitOK = false;
                    }
                } else {
                    smallExitOK = false;
                }
            }
        }

        // We now know which pieces are free to leave their current square. Now
        // determine if the destination is able to receive all, some, or none
        // of them
        switch (direction) {
        case NORTH:
            moverY--;
            break;
        case EAST:
            moverX++;
            break;
        case SOUTH:
            moverY++;
            break;
        case WEST:
            moverX--;
            break;
        }

        // (moverX, moverY) are now the co-ordinates of the destination
        let destIndex = GVcols * moverY + moverX;

        if ((destIndex < 0) || (destIndex >= GVrows * GVcols)) {
            return false;
        }

        let destShape = playArea[destIndex];
        let nextShape = null;

        // if destShape is null, the destination is clear and all would-be
        // movers can move, otherwise further tests are required:
        if (destShape != null) {
            switch (destShape.getType()) {
            case uFIXED:
                return false;    // can't walk into a fixed block
            case uLARGE:
                if ((destShape.getOpenSide() ^ direction) != 2) {
                    return false;
                }

                // the large U can accommodate all but a large U
                if (largeExitOK) {
                    return false;
                }

                // but is there a nested small U?
                if ((nextShape = destShape.getNext()) != null) {
                    if (smallExitOK) {
                        // nested small U blocks a moving small U
                        return false;
                    }

                    if ((nextShape.getOpenSide() ^ direction) != 2) {
                        // open face of small U is not in line with mover
                        return false;
                    }
                }
                break;
            case uSMALL:
                if (largeExitOK) {
                    return false;
                }

                if ((destShape.getOpenSide() ^ direction) != 2) {
                    return false;
                }

                // only able to accommodate the mover
                if (smallExitOK) {
                    return false;
                }
                break;
            }
        }

        // Pieces indicated by smallExitOK and largeExitOK are cleared to
        // move. Move them to the inMotionChain
        if (largeExitOK) {
            inMotionChain = baseShape;

            if (smallExitOK || (smallU == null)) {
                baseShape = null;
                playArea[index] = null;
            } else {
                // (smallU != null) && !smallExitOK)
                baseShape.unChain(smallU);
                smallU.unChain(mover);
                inMotionChain.addToChain(mover);
                baseShape = smallU;
                playArea[index] = baseShape;
            }
        } else if (   ((largeU == null) && smallExitOK) ||
                      ((largeU == null) && (smallU == null))
                  ) {
            inMotionChain = baseShape;
            baseShape = null;
            playArea[index] = null;
        } else if ((largeU != null) && (!largeExitOK) && smallExitOK) {
            inMotionChain = baseShape.getNext();
            baseShape.unChain(inMotionChain);
        } else {
            inMotionChain = mover;
            baseShape.unChain(mover);
        }
    }

    // At this point a move is in progress and the moving pieces are in the
    // inMotionChain. Guard against a change in direction now the validity
    // checks are by-passed
    if (direction != curDir) {
        let disp = mover.getDisp(curDir);
        force = true;
        direction = curDir;

        if ((2 * disp) < UNIT_SIZE) {
            direction = HOME;
        }
    }

    if ((delta >= UNIT_SIZE) || force) {
        // the movement takes us up to the next grid position or the movement
        // was abandoned when past the half-way point.
        // Come to rest at the destination
        let nextShape;
        for (   nextShape = inMotionChain;
                nextShape != null;
                nextShape = nextShape.getNext()) {
            nextShape.moveShape(direction);
        }
        if (direction != HOME) {
            moves++;
            showMoves();
        }
        // having arrived at a resting place, return the contents of the
        // inMotionChain
        moverX = mover.getX();
        moverY = mover.getY();
        index = GVcols * moverY + moverX;

        if (playArea[index] != null) {
            if (inMotionChain.getType() == uLARGE) {
                inMotionChain.unChain(mover);
                inMotionChain.addToChain(playArea[index]);
                inMotionChain.addToChain(mover);
                playArea[index] = inMotionChain;
            } else {
                playArea[index].addToChain(inMotionChain);
            }
            if ((playArea[index].getColour() == "blue") &&
                (playArea[index].getNext().getColour() == "red")) {
                gameOver = true;
                if (!winShown) {
                    showCongrats();
                    /*if (!timer2Running) {
                        // allow time for paint to be synchronised to screen
                        timer2Running = true;
                        winId = window.setInterval(showCongrats, 200);
                    }*/
                }
            }
        } else {
            playArea[index] = inMotionChain;
        }
        inMotionChain = null;
    } else {
        let nextShape;
        for (   nextShape = inMotionChain;
                nextShape != null;
                nextShape = nextShape.getNext()) {
            nextShape.setDisp(delta, direction);
        }
    }
    return true;
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) { var dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropDown = dropdowns[i];
            if ((openDropDown.id != "messageDrop") && openDropDown.classList.contains('show')) {
                openDropDown.classList.remove('show');
            }
        }
    }
}

function validateGamePlan(plan) {
    let digit0 = "0".charCodeAt(0);
    let digit9 = digit0 + 9;

    if (plan.length < 2) {
        return false;
    }

    let ch = plan.charCodeAt(0);

    if ((ch < digit0) || (ch > digit9)) {
        return false;
    }

    let cols = ch - digit0;
    ch = plan.charCodeAt(1);

    if ((ch < digit0) || (ch > digit9)) {
        return false;
    }

    let rows = ch - digit0;

    if (plan.length < (2 + cols * rows)) {
        return false;
    }

    return true;
}

function setGrid(cols, rows) {
    sCols = cols;
    sRows = rows;
}


function paintPuzzle() {
    let h = canvas.height;
    let w = canvas.width;
    let nxt = null;

    if ((GVheight != h) || (GVwidth != w)) {
        // reset scaling data
        GVheight = h;
        GVwidth = w;
        let wScale = Math.floor((GVwidth - GVcols * 5 - 3) /
                                (GVcols * UNIT_SIZE));
        scale = Math.floor((GVheight - GVrows * 5 - 3) / (GVrows * UNIT_SIZE));

        if (wScale < scale) {
            scale = wScale;
        }

        playWidth = GVcols * (5 + UNIT_SIZE * scale) + 3;
        playHeight = GVrows * (5 + UNIT_SIZE * scale) + 3;
        sOriginX = xOff = 2 + Math.floor((GVwidth - playWidth) / 2);
        sOriginY = yOff = 2 + Math.floor((GVheight - playHeight) / 2);
    }

    // draw an outline 2-pixels thick
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, GVwidth, GVheight);
    ctx.fillStyle = "black";
    ctx.fillRect(xOff - 2, yOff - 2, playWidth, 2);
    ctx.fillRect(xOff + playWidth - 4, yOff - 2, 2, playHeight);
    ctx.fillRect(xOff - 2, yOff - 2, 2, playHeight);
    ctx.fillRect(xOff - 2, yOff + playHeight - 4, playWidth, 2);

    // rule lines to indicate play area positions
    ctx.fillStyle = "#e0e0e0";   // light grey

    let i;
    ctx.lineWidth = 1;

    for (i = 1; i < GVcols; i++) {
        ctx.beginPath();
        ctx.moveTo(xOff + i * (5 + UNIT_SIZE * scale), yOff);
        ctx.lineTo(xOff + i * (5 + UNIT_SIZE * scale), yOff + playHeight - 2);
        ctx.stroke();
    }

    for (i = 1; i < GVrows; i++) {
        ctx.beginPath();
        ctx.moveTo(xOff, yOff + i * (5 + UNIT_SIZE * scale));
        ctx.lineTo(xOff + playWidth - 2, yOff + i * (5 + UNIT_SIZE * scale));
        ctx.stroke();
    }

    let moverIndex = mover.getIndex();

    for (i = 0; i < playArea.length; i++) {
        // Draw mover first and allow its halo to be overdrawn
        if (moverIndex == i) {
            mover.draw(ctx);
        }
        for (nxt = playArea[i]; nxt != null; nxt = nxt.getNext()) {
            if (nxt != mover) {
                nxt.draw(ctx);
            }
        }
    }

    if (inMotionChain != null) {
        // the mover piece has been force drawn along with the fixed
        // pieces, so we mustn't draw it again because it it's entering a
        // non-moving piece, that piece has already been set up to overlap
        // the halo.

        for (nxt = inMotionChain; nxt != null; nxt = nxt.getNext()) {
            if (nxt != mover) {
                nxt.draw(ctx);
            }
        }
    }
}

function setupGame(plan) {
    let gamePlan = null;
    let digit0 = "0".charCodeAt(0);
    window.clearInterval(animId);
    animStep = 0;
    moves = 0;
    gameOver = false;
    winShown = false;
    showTitle();
    showMoves();

    if (plan == null) {
        gamePlan = plans[puzNo];
    } else {
        gamePlan = plan;
    }

    if (validateGamePlan(gamePlan)) {
        let ch = 0;
        let cols = gamePlan.charCodeAt(0) - digit0;
        let rows = gamePlan.charCodeAt(1) - digit0;
        let elements = cols * rows;
        let extras = 2 + elements;
        let i = 0;
        let j = 0;
        let limit = 0;

        if ((GVcols != cols) || (GVrows != rows)) {
            playArea = new Array(elements);
        }

        mover = null;
        inMotionChain = null;
        gameOver = false;

        for (i = 0; i < elements; i++) {
            do {
                if (limit == 0) {
                    ch = gamePlan.charCodeAt(2 + i);
                } else {
                    ch = gamePlan.charCodeAt(extras++);
                }
                ch -= digit0;
                let type = ((ch >> 4) & 3) - 1;
                let facing = (ch >> 2) & 3;
                let colour = ch & 3;

                switch (type) {
                case -1:
                    // empty node
                    break;
                case 0:    // small u
                case 1:    // large U
                    if (colour != 0) {
                        colour--;
                    }
                    break;
                case 2:
                    switch(colour) {
                    case 0:
                        type   = uMOVER;
                        colour = uBLACK;
                        break;
                    case 1:
                        type   = uFIXED;
                        colour = uBLACK;
                        break;
                    case 2:
                    case 3:
                        limit = colour + 1;
                        j = 0;
                        break;
                    }
                    break;
                }

                if ((limit > 0) && (j == 0)) {
                    j = 1;
                    continue;
                }

                if (type < 0) {
                    playArea[i] = null;
                } else {
                    let shape = new Ushape(type, facing, colour, i % cols,
                                            Math.floor(i / cols));
                    if (type == uMOVER) {
                        mover = shape;
                    }

                    if ((limit == 0) || (j == 1)) {
                        playArea[i] = shape;
                    } else {
                        playArea[i].addToChain(shape);

                        if ((playArea[i].getType() == uLARGE) &&
                                (playArea[i].getColour() == "blue") &&
                                (shape.getType() == uSMALL) &&
                                (shape.getColout() == "red")) {
                            gameOver = true;
                        }
                    }
                }

                j++;
            } while (j < limit);

            limit = 0;
            j = 0;
        }

        GVcols = cols;
        GVrows = rows;
    }

    setGrid(GVcols, GVrows);
    prevX = mX;
    prevY = mY;
    GVwidth = 0;   // force complete evaluation of display params
    paintPuzzle();
}
