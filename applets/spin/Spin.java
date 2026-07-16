// vi:set ts=4:
import java.awt.*;
import java.applet.*;
import java.awt.event.*;
import java.util.StringTokenizer;

public class Spin extends Applet
	implements ActionListener, WindowListener
{
	static final String strVersion = "0.9";
	static final Color transparent = new Color(0x88000000);
	static final Color clrOutline = Color.black;
	static final Color clrFill = Color.white;
	static final Color clrPanel = Color.gray;
	static final Color clrButton = Color.lightGray;
	final String strParDegrees = "degrees";
	final String strParPoints = "points";
	final String strParColours = "colours";
	final String strParObjects = "objects";
	final String strParLines = "lines";
	final String strParCircles = "circles";
	final String strRestart = "Restart";
	final String strASpin = "Spin <-";
	final String strCSpin = "-> Spin";
	final String strAbout = "About";
	String strDegrees;
	String strPoints;
	String strColours;
	String strObjects;
	String strLines;
	String strCircles;
	Label lbBlank1;
	Label lbBlank2;
	Panel pnlControls;
	Panel pnlStatus;
	Label lbStatus;
	Button btnRestart;
	Button btnASpin;
	Button btnCSpin;
	Button btnAbout;
	GameBoard	board;
	Animate		anim;
	About		m_about = null;
	Frame		m_AboutFrame = null;
	private String cleanPar(String name)
	{
		String str = null;
		String par = null;
		par = getParameter(name);
		if (par == null)
			return null;
		StringTokenizer stk = new StringTokenizer(par);
		str = "";
		while (stk.hasMoreTokens())
		{
			str = str + stk.nextToken();
		}
		return str;
	}

	public void init()
	{
		pnlControls = new Panel();
		pnlControls.setLayout(new GridLayout(1,6));
		pnlControls.setBackground(clrPanel);
		btnRestart = new Button(strRestart);
		btnRestart.setBackground(clrButton);
		btnRestart.addActionListener(this);
		pnlControls.add(btnRestart);
		lbBlank1 = new Label();
		lbBlank1.setBackground(clrPanel);
		pnlControls.add(lbBlank1);
		btnASpin = new Button(strASpin);
		btnASpin.setBackground(clrButton);
		btnASpin.addActionListener(this);
		pnlControls.add(btnASpin);
		btnCSpin = new Button(strCSpin);
		btnCSpin.setBackground(clrButton);
		btnCSpin.addActionListener(this);
		pnlControls.add(btnCSpin);
		lbBlank2 = new Label();
		lbBlank2.setBackground(clrPanel);
		pnlControls.add(lbBlank2);
		btnAbout = new Button(strAbout);
		btnAbout.setBackground(clrButton);
		btnAbout.addActionListener(this);
		pnlControls.add(btnAbout);
		pnlStatus = new Panel();
		pnlStatus.setLayout(new GridLayout(1,1));
		pnlStatus.setBackground(clrPanel);
		lbStatus = new Label();
		lbStatus.setBackground(clrPanel);
		pnlStatus.add(lbStatus);
		setLayout(new GridLayout(1,1));
		strDegrees = cleanPar(strParDegrees);
		strPoints = cleanPar(strParPoints);
		strColours = cleanPar(strParColours);
		strObjects = cleanPar(strParObjects);
		strLines = cleanPar(strParLines);
		strCircles = cleanPar(strParCircles);
		board = new GameBoard(this, strDegrees, strPoints, strColours,
							  strObjects, strLines, strCircles);
		board.setBackground(Color.lightGray);
		this.setBackground(Color.lightGray);
		this.setForeground(Color.black);
		this.setLayout(new BorderLayout());
		this.add(pnlControls, BorderLayout.NORTH);
		this.add(pnlStatus, BorderLayout.SOUTH);
		this.add(board, BorderLayout.CENTER);
		board.repaint();
	}

	public void start() {}
	public void stop() {}
	public void destroy() {}
	public void logError(String strErr)
	{
		lbStatus.setText(strErr);
	}
	public void actionPerformed(ActionEvent ev)
	{
		String str = ev.getActionCommand();

		if (str.equals(strRestart))
		{
			if ((anim == null) || (!anim.IsMoving()))
			{
				board.restart();
			}
		}
		else if (str.equals(strCSpin))
		{
			if (board.hasDropped())
				board.moveCentres();
			if ((anim == null) || (!anim.IsMoving()))
			{
				anim = new Animate(board, true);
			}
		}
		else if (str.equals(strASpin))
		{
			if (board.hasDropped())
				board.moveCentres();
			if ((anim == null) || (!anim.IsMoving()))
			{
				anim = new Animate(board, false);
			}
		}
		else if (str.equals(strAbout))
		{
			if (m_about == null)
			{
				m_about = new About(this);
				m_AboutFrame = new Frame("Credits and Copyrights");
				m_AboutFrame.add("Center", m_about);
				m_AboutFrame.pack();
				m_AboutFrame.addWindowListener(this);
				m_AboutFrame.show();
			}
			else
			{
				RemoveAboutBox();
			}
		}
	}
	public void RemoveAboutBox()
	{
		if (m_about != null)
		{
			m_AboutFrame.removeWindowListener(this);
			m_AboutFrame.dispose();
			m_AboutFrame = null;
			m_about = null;
		}
	}
	public void windowActivated(WindowEvent e) {}
	public void windowClosed(WindowEvent e)
	{
		Window w = e.getWindow();

		if (w != null)
		{
			RemoveAboutBox();
		}
	}
	public void windowClosing(WindowEvent e)
	{
		Window w = e.getWindow();

		if (w != null)
		{
			RemoveAboutBox();
		}
	}
	public void windowDeactivated(WindowEvent e) {}
	public void windowDeiconified(WindowEvent e) {}
	public void windowIconified(WindowEvent e) {}
	public void windowOpened(WindowEvent e) {}
}
