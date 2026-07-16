// vi:set ts=4:
import java.awt.*;

public class SpinLines
{
	SpinLines	next;
	String		strName;
	SpinPoint	sp[];
	int			x[];
	int			y[];
	Color		outline;
	public SpinLines(SpinTok tok, GameBoard spn)
	{
		this.next = null;
		this.strName = tok.strName;
		int len = tok.strParams.length;
		this.sp = new SpinPoint[len];
		this.x = new int[len];
		this.y = new int[len];
		this.outline = Spin.clrOutline;
		int i;
		String str;
		for (i = 0; i < len; i++)
		{
			x[i] = 0;
			y[i] = 0;
			str = tok.strParams[i];
			sp[i] = spn.findPoint(str);
			if (sp[i] == null)
				spn.logError("Lines " + strName + ", missing point " + str);
		}
		len = tok.strAttrNames.length;
		for (i = 0; i < len; i++)
		{
			if ((tok.strAttrNames[i].equals("outline")) &&
					 (tok.strAttrVals[i] != null))
			{
				SpinColour spo = spn.findColour(tok.strAttrVals[i]);
				if (spo != null)
					outline = spo.clr;
			}
			else if (tok.strAttrNames[i].equals("noborder"))
			{
				outline = Spin.transparent;
			}
		}
	}
}
