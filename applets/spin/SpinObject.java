// vi:set ts=4:
import java.awt.*;

public class SpinObject
{
	SpinObject	next;
	String		strName;
	SpinPoint	sp[];
	int			x[];
	int			y[];
	Color		fill;
	Color		outline;
	public SpinObject(SpinTok tok, GameBoard spn)
	{
		this.next = null;
		this.strName = tok.strName;
		int len = tok.strParams.length;
		this.sp = new SpinPoint[len];
		this.x = new int[len];
		this.y = new int[len];
		fill = Spin.transparent;
		outline = Spin.clrOutline;
		int i;
		String str;
		for (i = 0; i < len; i++)
		{
			x[i] = 0;
			y[i] = 0;
			str = tok.strParams[i];
			sp[i] = spn.findPoint(str);
			if (sp[i] == null)
				spn.logError("Object " + strName + ", missing point " + str);
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
	}
}
