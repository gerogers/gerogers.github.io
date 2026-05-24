// vi:se ts=50 sw=4 ai ml:

"use strict";

const canvas = document.getElementById('Pythagoras');
const ctx = canvas.getContext('2d');
// illustrate using a 3, 4, 5 right angled triangle
const sideA = 3;
const sideB = 4;
const sideH = 5;
const steps = 36;
const dStep = ((Math.PI * 3) / 2) / steps;
const dAngleA = Math.atan(sideA / sideB);
const dAngleB = Math.atan(sideB / sideA);
let scale = 40;
let lMrgn = 10 + scale;
let tMrgn = 10 + scale;
let dashBaseX = lMrgn + (2 * sideB * scale);
let dashBaseY = tMrgn + (2 * sideB * scale);
let txtLeft = lMrgn + sideA * scale / 2;
let txtDown = tMrgn + 2 * sideB * scale;
let txtLower = tMrgn + (2 * sideB + sideA) * scale;
let frameCt = 0;
let animId = -1;
let caption1a =
    "The 3 angles of any triangle add to 180\u00B0, so in a " +
    "right-angled triangle,";
let caption1b =
    "(such as this one) the other 2 angles \u03B8 and \u03C6 add to 90\u00B0.";
let caption1c =
    "Click in this canvas area to add a second copy of this triangle ..";
let caption2a =
    "Notice that the second triangle has been rotated by 90\u00B0 and " +
    "placed such that";
let caption2b =
    "angles \u03C6 and \u03B8 combine to form a 90\u00B0 angle at the top " +
    "of the diagram."
let caption2c = "Click to add a third triangle ..";
let caption3a = "and a fourth ..";
let caption4a = "Satisfy yourself that the four hypotenuses form a square.";
let caption4b = "Click once more to fill in the empty square in the middle ..";
let caption5a = "So the yellow area is the square of the hypotenuse.";
let caption5b = "Click to re-arrange the components a little ..";
let caption6a = "and again ..";
let caption7a = "And finally ..";
let caption8a = "We see that the yellow area (square of the hypotenuse " +
                "reshaped),"
let caption8b = "is now made up of a-squared + b-squared. Q.E.D";

class CPolygon {
    constructor(xs, ys) {
        this.m_x = xs;
        this.m_y = ys;
    }

    setPoly(xs, ys) {
        let n = this.m_x.length;
        for (let i = 0; i < n; i++) {
            this.m_x[i] = xs[i];
            this.m_y[i] = ys[i];
        }
    }

    draw(clr) {
        let n = this.m_x.length;
        ctx.beginPath();
        ctx.moveTo(this.m_x[0], this.m_y[0]);
        for (let i = 1; i < n; i++) {
            ctx.lineTo(this.m_x[i], this.m_y[i]);
        }
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.fillStyle = clr;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}

let h = canvas.height;
let w = canvas.width;
let mTriangleA = new CPolygon([0, 0, 0], [0, 0, 0]);
let mTriangleB = new CPolygon([0, 0, 0], [0, 0, 0]);
let mTriangleC = new CPolygon(
                [   (lMrgn + (2 * sideB + sideA) * scale),
                    (lMrgn + (sideB + sideA) * scale),
                    (lMrgn + (sideB + sideA) * scale) ],
                [   (tMrgn + (2 * sideB - sideA) * scale),
                    (tMrgn + (2 * sideB - sideA) * scale),
                    (tMrgn + 2 * sideB * scale) ] );
let mTriangleD = new CPolygon(
                [   (lMrgn + (sideB + sideA) * scale),
                    (lMrgn + (sideB + sideA) * scale),
                    (lMrgn + sideB * scale) ],
                [   (tMrgn + 2 * sideB * scale),
                    (tMrgn + sideB * scale),
                    (tMrgn + sideB * scale) ] );
let mSquare = new CPolygon(
                [   (lMrgn + 2 * sideB * scale),
                    (lMrgn + 2 * sideB * scale),
                    (lMrgn + (sideB + sideA) * scale),
                    (lMrgn + (sideB + sideA) * scale) ],
                [   (tMrgn + sideB * scale),
                    (tMrgn + (2 * sideB - sideA) * scale),
                    (tMrgn + (2 * sideB - sideA) * scale),
                    (tMrgn + sideB * scale) ] );

let xRow = [0, 0, 0];
let yRow = [0, 0, 0];

function animNext() {
    if ((++frameCt == (4 + steps)) || (frameCt == (4 + 2 * steps))) {
        window.clearInterval(animId);
    }
    paintFrame();
}

function paintFrame() {
    if (frameCt > (4 + 2 * steps + 1)) {
        frameCt = 0;
    }
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, w, h);

    if (frameCt <= 4) {
        xRow[0] = lMrgn + sideB * scale;
        yRow[0] = tMrgn + sideB * scale;
        xRow[1] = lMrgn + 2 * sideB * scale;
        yRow[1] = tMrgn + sideB * scale;
        xRow[2] = lMrgn + 2 * sideB * scale;
        yRow[2] = tMrgn + (sideB - sideA) * scale;
        mTriangleA.setPoly(xRow, yRow);
    } else if (frameCt >= 4 + steps) {
        xRow[0] = lMrgn + sideB * scale;
        yRow[0] = tMrgn + sideB * scale;
        xRow[1] = lMrgn + sideB * scale;
        yRow[1] = tMrgn + 2 * sideB * scale;
        xRow[2] = lMrgn + (sideB + sideA) * scale;
        yRow[2] = tMrgn + 2 * sideB * scale;
        mTriangleA.setPoly(xRow, yRow);
    }

    if (frameCt <= 4 + steps) {
        xRow[0] = lMrgn + 2 * sideB * scale;
        yRow[0] = tMrgn + (sideB - sideA) * scale;
        xRow[1] = lMrgn + 2 * sideB * scale;
        yRow[1] = tMrgn + (2 * sideB - sideA) * scale;
        xRow[2] = lMrgn + (2 * sideB + sideA) * scale;
        yRow[2] = tMrgn + (2 * sideB - sideA) * scale;
        mTriangleB.setPoly(xRow, yRow);
    } else if (frameCt > 4 + 2 * steps) {
        xRow[0] = lMrgn + (sideB + sideA) * scale;
        yRow[0] = tMrgn + 2 * sideB * scale;
        xRow[1] = lMrgn + (sideA + 2 * sideB) * scale;
        yRow[1] = tMrgn + 2 * sideB * scale;
        xRow[2] = lMrgn + (2 * sideB + sideA) * scale;
        yRow[2] = tMrgn + (2 * sideB - sideA) * scale;
        mTriangleB.setPoly(xRow, yRow);
    }

    if ((frameCt >= 4) && (frameCt < 4 + steps)) {
        let angle = dStep * (frameCt - 4);
        // rotating triangle A, reset its co-ords
        xRow[0] = lMrgn + sideB * scale;
        yRow[0] = tMrgn + sideB * scale;
        xRow[1] = lMrgn + (sideB + sideB * Math.cos(angle)) * scale;
        yRow[1] = tMrgn + (sideB - sideB * Math.sin(angle)) * scale;
        xRow[2] = lMrgn + (sideB + sideH * Math.cos(dAngleA + angle)) * scale;
        yRow[2] = tMrgn + (sideB - sideH * Math.sin(dAngleA + angle)) * scale;
        mTriangleA.setPoly(xRow, yRow);
    }

    mTriangleA.draw('yellow');

    if ((frameCt > 4 + steps) && (frameCt <= 4 + 2 * steps)) {
        let angle = dStep * (frameCt - 4 - steps);

        // rotating triangle B, reset its co-ords
        xRow[0] = lMrgn +
            (2 * sideB + sideA - sideH * Math.cos(dAngleB + angle)) * scale;
        yRow[0] = tMrgn + 
            (2 * sideB - sideA - sideH * Math.sin(dAngleB + angle)) * scale;
        xRow[1] = lMrgn + (2 * sideB + sideA - sideA * Math.cos(angle)) * scale;
        yRow[1] = tMrgn + (2 * sideB - sideA - sideA * Math.sin(angle)) * scale;
        xRow[2] = lMrgn + (2 * sideB + sideA) * scale;
        yRow[2] = tMrgn + (2 * sideB - sideA) * scale;
        mTriangleB.setPoly(xRow, yRow);
    }

    if (frameCt > 0) {
        mTriangleB.draw('yellow');
    }
    if (frameCt > 1) {
        mTriangleC.draw('yellow');
    }
    if (frameCt > 2) {
        mTriangleD.draw('yellow');
    }
    if (frameCt > 3) {
        mSquare.draw('yellow');
    }
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText('b', lMrgn + 3 * sideB * scale / 2 - 2,
                    tMrgn + sideB * scale - 4);

    if (frameCt < 5) {
        ctx.fillText('a', lMrgn + (2 * sideB - 0.25) * scale,
                        tMrgn + (2 * sideB - sideA) * scale / 2 + 6);
        ctx.fillText('\u03B8', lMrgn + 7 * sideB * scale / 6,
                        tMrgn + sideB * scale - 4);
        ctx.fillText('\u03C6', lMrgn + 23 * sideB * scale / 12 + 2,
                        tMrgn + (sideB - 5 * sideA / 6) * scale);
    }
    if (frameCt > 0) {
        ctx.fillText('a', lMrgn + (4 * sideB + sideA) * scale / 2 - 5,
                        tMrgn + (2 * sideB - sideA) * scale - 4);
    }
    if ((frameCt > 0) && (frameCt <= 4 + steps)) {
        ctx.fillText('b', lMrgn + 2 * sideB * scale + 4,
                        tMrgn + (3 * sideB - 2 * sideA) * scale / 2 + 12);
        ctx.fillText('\u03B8', lMrgn + 2 * sideB * scale + 4,
                        tMrgn + (7 * sideB / 16) * scale);
        ctx.fillText('\u03C6', lMrgn + (2 * sideB + sideA - 0.5) * scale,
                        tMrgn + (2 * sideB - sideA) * scale - 4);
    }
    if (frameCt >= 4 + steps) {
        ctx.fillText('b', lMrgn + sideB * scale - 12,
                        tMrgn + 3 * sideB * scale / 2 + 4);
    }
    if (frameCt >= 4 + 2 * steps) {
        ctx.fillText('a', lMrgn + (2 * sideB + sideA) * scale + 4,
                        tMrgn + (4 * sideB - sideA) * scale / 2 + 4);
    }
    if (frameCt > 4 + 2 * steps) {
        ctx.beginPath();
        ctx.moveTo(mSquare.m_x[1], mSquare.m_y[1]);
        ctx.lineTo(dashBaseX, dashBaseY);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'gray';
        ctx.stroke();
    }

    // Captions
    ctx.font = '16px sans-serif';
    if (frameCt == 0) {
        ctx.fillText(caption1a, txtLeft, txtDown);
        ctx.fillText(caption1b, txtLeft, txtDown + 20);
        ctx.fillText(caption1c, txtLeft, txtDown + 60);
    } else if (frameCt == 1) {
        ctx.fillText(caption2a, txtLeft, txtDown);
        ctx.fillText(caption2b, txtLeft, txtDown + 20);
        ctx.fillText(caption2c, txtLeft, txtDown + 60);
    } else if (frameCt == 2) {
        ctx.fillText(caption3a, txtLeft, txtDown);
    } else if (frameCt == 3) {
        ctx.fillText(caption4a, txtLeft, txtLower);
        ctx.fillText(caption4b, txtLeft, txtLower + 20);
    } else if (frameCt == 4) {
        ctx.fillText(caption5a, txtLeft, txtLower);
        ctx.fillText(caption5b, txtLeft, txtLower + 40);
    } else if (frameCt == 5) {
        animId = window.setInterval(animNext, 25);
    } else if (frameCt == (4 + steps)) {
        ctx.fillText(caption6a, txtLeft, txtDown + 40);
    } else if (frameCt == (5 + steps)) {
        animId = window.setInterval(animNext, 25);
    } else if (frameCt == (4 + 2 * steps)) {
        ctx.fillText(caption7a, txtLeft, txtDown + 40);
    } else if (frameCt == (5 + 2 * steps)) {
        ctx.fillText(caption8a, txtLeft, txtLower);
        ctx.fillText(caption8b, txtLeft, txtLower + 20);
    }
}

function mouseClick(event) {
    frameCt++;
    paintFrame();
}

paintFrame();

