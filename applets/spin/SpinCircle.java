// vi:set ts=4:
import java.awt.*;

public class SpinCircle
{
	SpinCircle	next;
	String		strName;
	SpinMovingPoint	centre;
	int			radius;
	int			dropUnit;
	int			r;		// radius after scaling
	int			z;		// dropUnit after scaling
	int			y_offset;	// current displacement from start of drop
	int			y_target;	// where will it all end?
	Color		fill;
	Color		outline;
	public SpinCircle(SpinTok tok, GameBoard spn)
	{
		next = null;
		strName = tok.strName;
		radius = 0;
		y_offset = 0;
		y_target = 0;
		fill = Spin.transparent;
		outline = Spin.clrOutline;
		int len = tok.strParams.length;
		int i;
		String str;
		if (len > 2)
		{
			try
			{
				this.dropUnit = Integer.parseInt(tok.strParams[2]);
			}
			catch (NumberFormatException e)
			{
			}
			if (this.dropUnit < 1)
			{
				spn.logError("Circle dropUnit must be greater than 0");
			}
		}
		if (len > 1)
		{
			try
			{
				this.radius = Integer.parseInt(tok.strParams[1]);
			}
			catch (NumberFormatException e)
			{
			}
			if (this.radius < 1)
			{
				spn.logError("Circle radius must be greater than 0");
			}
		}
		if (len > 0)
		{
			str = tok.strParams[0];
			SpinPoint pt = spn.findPoint(str);
			if (pt == null)
				spn.logError("Circle " + strName +
							 ", missing centre point " + str);
			else
			{
				this.centre = new SpinMovingPoint(pt);
				if (!spn.replacePoint(str, this.centre))
				{
					spn.logError("Circle " + strName +
								 ", cannot find centre point " + str);
				}
			}
		}
		if (len != 3)
		{
			spn.logError("Circle expected (point_name, radius, dropUnit), got " +
						 len + "parameters");
		}
		len = tok.strAttrNames.length;
		for (i = 0; i < len; i++)
		{
			if (tok.strAttrNames[i].equals("fill"))
			{
				fill = Spin.clrFill;
				if (tok.strAttrVals[i] != null)
				{
					SpinColour spc = spn.findColour(tok.strAttrVals[i]);
					if (spc != null)
						fill = spc.clr;
				}
			}
			else if ((tok.strAttrNames[i].equals("outline")) &&
					 (tok.strAttrVals[i] != null))
			{
				SpinColour spo = spn.findColour(tok.strAttrVals[i]);
				if (spo != null)
					outline = spo.clr;
			}
			else if (tok.strAttrNames[i].equals("nofill"))
			{
				fill = Spin.transparent;
			}
			else if (tok.strAttrNames[i].equals("noborder"))
			{
				outline = Spin.transparent;
			}
		}
		r = radius;
		z = dropUnit;
	}
	public int setDrop(GameBoard gb)
	{
		int			i;
		int 		dz=99;

		for (i = 0; i < gb.ptA.length; i++)
		{
			int x1, x2, y1, y2;
			int h1, h2, v1, v2;
			x1 = gb.ptA[i].x;
			y1 = gb.ptA[i].y;
			x2 = gb.ptB[i].x;
			y2 = gb.ptB[i].y;

			if (x1 < x2)
			{
				h1 = centre.x - x1;
				h2 = x2 - centre.x;
				v1 = y1 - centre.y;
				v2 = y2 - centre.y;
			}
			else
			{
				h1 = centre.x - x2;
				h2 = x1 - centre.x;
				v1 = y2 - centre.y;
				v2 = y1 - centre.y;
			}

			if (((h1 + r/2) > 0) && ((h2 + r/2) > 0) && ((v1 > 0) || (v2 > 0)))
			{
				// We have a line whose end-point x-coords bracket this
				// circle and at least one end of which is below its
				// centre. Compute the relative height of the intersection
				// of the line and the circle's vertical path.
				x1 = h1 + h2;
				if (x1 != 0)
				{
					y1 = ((h1 * v2) + (h2 * v1)) / x1;
				}
				// If the intersection is below the centre, then the
				// line will stop the drop
				if (y1 >= 0)
				{
					y2 = y1 / z;
					if (y2 < dz)
						dz = y2;
				}
			}	
		}
		if (dz == 99) dz = 0;	// be safe
		y_target = dz * z;
		y_offset = 0;
		return y_target;
	}

	// After location of centre has been adjusted, clear offset and target
	public void clearOffset()
	{
		y_target = 0;
		y_offset = 0;
	}

	// Before computing effect of rotation on centre of circle
	// consolidate current adjuctment
	public void applyOffset()
	{
		centre.y += y_target;
		y_offset = 0;
		y_target = 0;
	}
}
