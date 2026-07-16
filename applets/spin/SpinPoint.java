// vi:set ts=4:
import java.awt.*;

public class SpinPoint
{
	SpinPoint	next;
	String		strName;
	int			index;
	int			x;
	int			y;

	public SpinPoint()
	{
		this.next = null;
		this.strName = null;
		this.index = 0;
		this.x = 0;
		this.y = 0;
	}

	public SpinPoint(String name, int x, int y)
	{
		this.next = null;
		this.strName = name;
		this.x = x;
		this.y = y;
	}

	public SpinPoint(SpinTok tok)
	{
		this.next = null;
		this.strName = tok.strName;
		this.x = 0;
		if (tok.strParams.length > 0)
		{
			try
			{
				x = Integer.parseInt(tok.strParams[0]);
			}
			catch (NumberFormatException e)
			{
			}
		}
		this.y = 0;
		if (tok.strParams.length > 1)
		{
			try
			{
				y = Integer.parseInt(tok.strParams[1]);
			}
			catch (NumberFormatException e)
			{
			}
		}
	}

	// rotate point through angle alpha
	public void rotatePoint(double alpha)
	{
		double h;
		double theta;
		if ((x == 0) && (y == 0))
		{
			// this point is at the centre of rotation, so its position
			// won't change. Any value of theta will do, but don't
			// do the divide by h as that is zero.
			h = 0.0;
			theta = 0.0;
		}
		else
		{
			h = Math.sqrt((double)((x * x) + (y * y)));
			theta = Math.asin((double)y/h);
		}
		if (x < 0.0)
		{
			if (y < 0.0)
			{
				theta = -(Math.PI + theta);
			}
			else
			{
				theta = Math.PI - theta;
			}
		}
		theta += alpha;
		x = (int) Math.round(h * Math.cos(theta));
		y = (int) Math.round(h * Math.sin(theta));
	}
}
