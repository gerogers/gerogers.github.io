// vi:set ts=4:
import java.awt.*;

class GameBoard extends Canvas
{
	Dimension	m_Dim;
	Image		m_OffScrImg;
	int			errCount;
	int			longest;
	// drawing parameters - only change with image size
	int			cx;		// centre co-ords
	int			cy;		// centre co-ords
	int			s;		// scaling factor
	// number of rotation units in a right angle - must be multiple of 6
	static final int rotunit = 30;
	int			rotDegrees;	// amount of rotation required
	int			angle;	// in units defined by rotunit
	int			pointCount;
	int			x[];	// reset copy of x co-ords of all points
	int			y[];	// reset copy of y co-ords of all points
	SpinPoint	ptA[];	// co-ords of A ends of all lines
	SpinPoint	ptB[];	// B ends
	boolean		updated;
	boolean		scaleable;
	boolean		dropped;
	Spin		spn;
	SpinPoint	pointChain;
	SpinColour	colourChain;
	SpinObject	objectsChain;
	SpinObject	objectsTail;
	SpinLines	linesChain;
	SpinLines	linesTail;
	SpinCircle	circlesChain;
	SpinCircle	circlesTail;

	public GameBoard(Spin spn, String strDegrees, String strPoints,
					 String strColours, String strObjects, String strLines,
					 String strCircles)
	{
		errCount = 0;
		longest = 0;
		pointCount = 0;
		angle = 0;
		updated = true;		// force a redraw
		scaleable = true;
		dropped = false;
		this.spn = spn;
		m_Dim = null;
		m_OffScrImg = null;
		pointChain = null;
		colourChain = null;
		objectsChain = null;
		objectsTail = null;
		linesChain = null;
		linesTail = null;
		circlesChain = null;
		circlesTail = null;
		SpinParse pp = new SpinParse(strPoints);
		SpinTok tok = pp.nextTok();
		int diagSqr = 0;		// square of longest diagonal
		int sqr;
		int nObjLines = 0;		// number of lines in SpinObjects
		int nLinesLines = 0;	// number of lines in SpinLines
		SpinPoint sp;
		rotDegrees = 60;

		try
		{
			rotDegrees = Integer.parseInt(strDegrees);
		}
		catch (NumberFormatException e)
		{
		}

		while (tok != null)
		{
			if (tok.strName == "0")
				break;
			sp = new SpinPoint(tok);
			addPoint(sp);
			sqr = sp.x * sp.x + sp.y * sp.y;
			if (sqr > diagSqr)
				diagSqr = sqr;
			tok = pp.nextTok();
		}

		if (tok == null)
		{
			errCount++;
			spn.logError(pp.getLastError());
		}

		x = new int[pointCount];
		y = new int[pointCount];

		for (sp = pointChain; (sp != null); sp = sp.next)
		{
			x[sp.index] = sp.x;
			y[sp.index] = sp.y;
		}

		longest = 1 + (int)Math.sqrt((double)diagSqr);
		pp = new SpinParse(strColours);
		tok = pp.nextTok();
		SpinColour sc;

		while (tok != null)
		{
			if (tok.strName == "0")
				break;
			sc = new SpinColour(tok);
			addColour(sc);
			tok = pp.nextTok();
		}

		if (tok == null)
		{
			errCount++;
			spn.logError(pp.getLastError());
		}

		pp = new SpinParse(strObjects);
		tok = pp.nextTok();
		SpinObject so;

		while (tok != null)
		{
			if (tok.strName == "0")
				break;
			so = new SpinObject(tok, this);
			addObject(so);
			if (so.outline != Spin.transparent)
				nObjLines += so.sp.length;
			tok = pp.nextTok();
		}

		pp = new SpinParse(strLines);
		tok = pp.nextTok();
		SpinLines sl;

		while (tok != null)
		{
			if (tok.strName == "0")
				break;
			sl = new SpinLines(tok, this);
			addLines(sl);
			nLinesLines += sl.sp.length - 1;
			tok = pp.nextTok();
		}

		pp = new SpinParse(strCircles);
		tok = pp.nextTok();
		SpinCircle scirc;

		while (tok != null)
		{
			if (tok.strName == "0")
				break;
			scirc = new SpinCircle(tok, this);
			addCircle(scirc);
			tok = pp.nextTok();
		}

		// set up arrays of ends of drawn lines
		int i = 0;
		int j;

		ptA = new SpinPoint[nObjLines + nLinesLines];
		ptB = new SpinPoint[nObjLines + nLinesLines];

		for (so = objectsChain; so != null; so = so.next)
		{
			if (so.outline != Spin.transparent)
			{
				for (j = 0; j < so.sp.length - 1; j++)
				{
					ptA[i] = so.sp[j];
					ptB[i++] = so.sp[j + 1];
				}
				ptA[i] = so.sp[j];
				ptB[i++] = so.sp[0];
			}
		}

		for (sl = linesChain; sl != null; sl = sl.next)
		{
			for (j = 0; j < sl.sp.length - 1; j++)
			{
				ptA[i] = sl.sp[j];
				ptB[i++] = sl.sp[j + 1];
			}
		}

		repaint();
	}
	public void logError(String strErr)
	{
		errCount++;
		spn.logError(strErr);
	}
	public void allowRescale()
	{
		scaleable = true;
	}
	public void inhibitRescale()
	{
		scaleable = false;
	}
	public void setDropped()
	{
		dropped = true;
	}
	public boolean hasDropped()
	{
		return dropped;
	}
	public int getRotIncs()
	{
		return ((rotunit * rotDegrees) / 90);
	}
	public void addPoint(SpinPoint sp)
	{
		sp.index = pointCount++;
		sp.next = pointChain;
		pointChain = sp;
	}
	public void addColour(SpinColour sc)
	{
		sc.next = colourChain;
		colourChain = sc;
	}
	public void addObject(SpinObject obj)
	{
		if (objectsTail == null)
		{
			objectsChain = obj;
		}
		else
		{
			objectsTail.next = obj;
		}
		objectsTail = obj;
	}
	public void addLines(SpinLines lines)
	{
		if (linesTail == null)
		{
			linesChain = lines;
		}
		else
		{
			linesTail.next = lines;
		}
		linesTail = lines;
	}
	public void addCircle(SpinCircle circle)
	{
		if (circlesTail == null)
		{
			circlesChain = circle;
		}
		else
		{
			circlesTail.next = circle;
		}
		circlesTail = circle;
	}
	public SpinPoint findPoint(String name)
	{
		SpinPoint next;
		for (next = pointChain; next != null; next = next.next)
		{
			if (next.strName.equals(name))
				return next;
		}
		return null;
	}
	public boolean replacePoint(String name, SpinPoint sp)
	{
		SpinPoint next;
		if (pointChain.strName.equals(name))
		{
			sp.next = pointChain.next;
			pointChain = sp;
			return true;
		}
		for (next = pointChain; next.next != null; next = next.next)
		{
			if (next.next.strName.equals(name))
			{
				sp.next = next.next.next;
				next.next = sp;
				return true;
			}
		}
		return false;
	}
	public SpinColour findColour(String name)
	{
		SpinColour next;
		for (next = colourChain; next != null; next = next.next)
		{
			if (next.strName.equals(name))
				return next;
		}
		return null;
	}
	public void incAngle()
	{
		angle++;
		updated = true;
		repaint();
	}
	public void decAngle()
	{
		angle--;
		updated = true;
		repaint();
	}

	// restore original points, scaled
	public void resetPoints()
	{
		SpinPoint	sp;

		for (sp = pointChain; sp != null; sp = sp.next)
		{
			sp.x = x[sp.index] * s;
			sp.y = y[sp.index] * s;
		}
	}
	public void restart()
	{
		SpinCircle sc;

		for (sc = circlesChain; sc != null; sc = sc.next)
		{
			sc.clearOffset();
			x[sc.centre.index] = sc.centre.orig_x;
			y[sc.centre.index] = sc.centre.orig_y;
		}
		angle = 0;
		updated = true;
		repaint();
	}
	public void rotatePoints()
	{
		SpinPoint   sp;

		// First get into range (0 <= angle < 360 deg)
		while (angle < 0)
			angle += (4 * rotunit);
		while (angle >= (4 * rotunit))
			angle -= (4 * rotunit);
		// now do the rotation
		double alpha = (Math.PI * (double)angle ) / ((double)(rotunit * 2));
		for (sp = pointChain; sp != null; sp = sp.next)
		{
			sp.rotatePoint(alpha);
		}
	}
	public void snapPoints()
	{
		SpinPoint   sp;
		int			dividend;
		int			rem;

		if (s < 3)
			return;

		int small = s / 2;

		for (sp = pointChain; sp != null; sp = sp.next)
		{
			dividend = sp.x / s;
			rem = sp.x % s;
			if (rem > small)
				dividend++;
			else if (rem < -small)
				dividend--;
			sp.x = dividend * s;

			dividend = sp.y / s;
			rem = sp.y % s;
			if (rem > small)
				dividend++;
			else if (rem < -small)
				dividend--;
			sp.y = dividend * s;
		}
	}
	public void translatePoints()
	{
		SpinPoint sp;

		for (sp = pointChain; sp != null; sp = sp.next)
		{
			sp.x += cx;
			sp.y = cy - sp.y;
		}
	}
	public void resetObjects()
	{
		SpinObject	so;
		int			i;

		for (so = objectsChain; so != null; so = so.next)
		{
			for (i = 0; i < so.sp.length; i++)
			{
				so.x[i] = so.sp[i].x;
				so.y[i] = so.sp[i].y;
			}
		}
	}
	public void resetLines()
	{
		SpinLines	sl;
		int			i;

		for (sl = linesChain; sl != null; sl = sl.next)
		{
			for (i = 0; i < sl.sp.length; i++)
			{
				sl.x[i] = sl.sp[i].x;
				sl.y[i] = sl.sp[i].y;
			}
		}
	}
	public void resetCircles()
	{
		SpinCircle	sc;

		for (sc = circlesChain; sc != null; sc = sc.next)
		{
			sc.r = sc.radius * s;
			sc.z = sc.dropUnit * s;
		}
	}
	// accommodate completed drop in origins of circles
	public void moveCentres()
	{
		SpinCircle	sc;
		int x;
		int y;
		double alpha = (Math.PI * (double)angle ) / ((double)(rotunit * 2));

		dropped = false;

		for (sc = circlesChain; sc != null; sc = sc.next)
		{
			// propagate movement offset to y co-ord
			sc.applyOffset();
			// hold centre co-ords and restore at end
			x = sc.centre.x;
			y = sc.centre.y;
			// untranslate
			sc.centre.x -= cx;
			sc.centre.y = cy - sc.centre.y;
			// unrotate
			sc.centre.rotatePoint(-alpha);
			// unscale
			this.x[sc.centre.index] = Math.round(((float)sc.centre.x) / s);
			this.y[sc.centre.index] = Math.round(((float)sc.centre.y) / s);
			// restore in case we're asked to redraw
			sc.centre.x = x;
			sc.centre.y = y;
		}
	}

	public void update(Graphics gc)
	{
		paint(gc);
	}
	public void paint(Graphics gc)
	{
		if (errCount != 0)
			return;		// don't try to draw after errors

		Dimension	Dim = getSize();	// canvas size

		if ((m_Dim == null) || (scaleable && !m_Dim.equals(Dim)))
		{
			updated = true;
			m_Dim = Dim;
			requestFocus();
			m_OffScrImg = createImage(Dim.width, Dim.height);
			// co-ords of centre
			cx = Dim.width / 2;
			cy = Dim.height / 2;
			// scaling factor
			s = (cx < cy ? cx : cy);
			s /= longest;
			if (s == 0)
				s = 1;
		}
		if (updated)
		{
			// reset all points
			resetPoints();
			rotatePoints();
			if (angle % (rotunit * rotDegrees / 90) == 0)
			{
				// on multiples of rotDegrees rotation, force points to grid
				snapPoints();
			}
			translatePoints();
			resetObjects();
			resetLines();
			resetCircles();
			updated = false;
		}

		// preparation done, now draw the board
		Graphics og = m_OffScrImg.getGraphics();
		og.setColor(Spin.clrPanel);
		og.fillRect(0, 0, Dim.width, Dim.height);
		SpinObject so;
		for (so = objectsChain; so != null; so = so.next)
		{
			if (so.fill != Spin.transparent)
			{
				og.setColor(so.fill);
				og.fillPolygon(so.x, so.y, so.x.length);
			}
			if (so.outline != Spin.transparent)
			{
				og.setColor(so.outline);
				og.drawPolygon(so.x, so.y, so.x.length);
			}
		}
		SpinLines sl;
		for (sl = linesChain; sl != null; sl = sl.next)
		{
			if (sl.outline != Spin.transparent)
			{
				og.setColor(sl.outline);
				og.drawPolyline(sl.x, sl.y, sl.x.length);
			}
		}
		SpinCircle sc;
		for (sc = circlesChain; sc != null; sc = sc.next)
		{
			if (sc.fill != Spin.transparent)
			{
				og.setColor(sc.fill);
				og.fillOval(sc.centre.x - sc.r,
							sc.centre.y - sc.r + sc.y_offset,
							2 * sc.r, 2 * sc.r);
			}
			if (sc.outline != Spin.transparent)
			{
				og.setColor(sc.outline);
				og.drawOval(sc.centre.x - sc.r,
							sc.centre.y - sc.r + sc.y_offset,
							2 * sc.r, 2 * sc.r);
			}
		}

	    // draw completed image on-screen...
		gc.drawImage(m_OffScrImg, 0, 0, this);
	}	// end paint
}
