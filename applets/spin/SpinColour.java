// vi:set ts=4:
import java.awt.*;

public class SpinColour
{
	SpinColour	next;
	String		strName;
	Color		clr;
	public SpinColour(String name, Color clr)
	{
		this.next = null;
		this.strName = name;
		this.clr = clr;
	}
	public SpinColour(SpinTok tok)
	{
		this.next = null;
		this.strName = tok.strName;
		this.clr = Color.black;
		int r = 0;
		int g = 0;
		int b = 0;
		if (tok.strParams.length > 0)
		{
			try
			{
				r = Integer.parseInt(tok.strParams[0]);
			}
			catch (NumberFormatException e)
			{
			}
		}
		if (tok.strParams.length > 1)
		{
			try
			{
				g = Integer.parseInt(tok.strParams[1]);
			}
			catch (NumberFormatException e)
			{
			}
		}
		if (tok.strParams.length > 2)
		{
			try
			{
				b = Integer.parseInt(tok.strParams[2]);
			}
			catch (NumberFormatException e)
			{
			}
		}
		this.clr = new Color(r, g, b);
	}
}
