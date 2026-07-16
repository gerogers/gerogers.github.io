// vi:set ts=4:
import java.awt.*;

public class SpinParse
{
	String	strData;
	String	strError;
	int		index;
	public SpinParse(String str)
	{
		strData = str;
		resetParser();
	}
	public void resetParser()
	{
		index = 0;
		strError = "No error";
	}
	public String getLastError()
	{
		return strError;
	}
	static public boolean isAlpha(char ch)
	{
		return (((ch >= 'A') && (ch <= 'Z')) ||
				((ch >= 'a') && (ch <= 'z')));
	}
	static public boolean isNum(char ch)
	{
		return ((ch >= '0') && (ch <= '9'));
	}
	static public boolean isAlphaNum(char ch)
	{
		return (isNum(ch) || isAlpha(ch));
	}
	public SpinTok nextTok()
	{
		if (index >= strData.length())
			return (new SpinTok("0", null, null, null));
		int args = 0;
		int attrs = 0;
		int start = index;
		char ch = ' ';
		while (index < strData.length())
		{
			ch = strData.charAt(index);
			if (isAlpha(ch) || ((index != start) && isNum(ch)))
				index++;
			else
				break;
		}
		String Name = new String(strData.substring(start, index));
		if (ch != '(')
		{
			strError = "Identifier \"" + Name + "\" not followed by '('";
			return null;
		}
		index++;
		start = index;
		while (index < strData.length())
		{
			ch = strData.charAt(index++);
			if (ch == ',')
				args++;
			else if ((ch == ')') || (ch == ':'))
			{
				args++;
				break;
			}
		}
		if (ch == ':')
		{
			while (index < strData.length())
			{
				ch = strData.charAt(index++);
				if (ch == '(')
				{
					while (index < strData.length())
					{
						if (strData.charAt(index++) == ')')
							break;
					}
				}
				else if (ch == ',')
					attrs++;
				else if (ch == ')')
				{
					attrs++;
					break;
				}
			}
		}
		String strArgs[] = new String[args];
		String strAttrNames[] = new String[attrs];
		String strAttrVals[] = new String[attrs];
		args = 0;
		attrs = 0;
		index = start;
		while (index < strData.length())
		{
			ch = strData.charAt(index++);
			if ((ch == ',') || (ch == ')') || (ch == ':'))
			{
				strArgs[args++] =
					new String(strData.substring(start, index - 1));
				start = index;
				if (ch != ',')
					break;
			}
		}
		if (ch == ':')
		{
			while (index < strData.length())
			{
				ch = strData.charAt(index++);
				if ((ch == '(') || (ch == ',') || (ch == ')'))
				{
					strAttrNames[attrs] =
						new String(strData.substring(start, index - 1));
					start = index;
				}
				else
					continue;
				if (ch == '(')
				{
					while (index < strData.length())
					{
						if (strData.charAt(index++) == ')')
							break;
					}
					strAttrVals[attrs] =
						new String(strData.substring(start, index - 1));
					// tolerate an optional comma after attribute value
					if (index < strData.length())
					{
						ch = strData.charAt(index);
						if ((ch == ',') || (ch == ')'))
							index++;
					}
					start = index;
				}
				else
					strAttrVals[attrs] = null;
				attrs++;
				if (ch == ')')
					break;
			}
		}
		return new SpinTok(Name, strArgs, strAttrNames, strAttrVals);
	}
}
