// vi:set ts=4:
import java.awt.*;
import java.applet.*;
import java.awt.event.*;
import java.util.StringTokenizer;

class About extends Panel implements ActionListener
{
	Panel			m_pnlAboutControls;
	Panel			m_pnlInfo;
	Button			m_btnAboutOK;
	final String	m_strAboutOK = "OK";
	Label			m_lbVersion;
	Label			m_lbCopr1;
	Label			m_lbBlank1;
	Label			m_lbBlank2;
	Label			m_lbBlank3;
	Label			m_lbBlank4;
	Spin			m_Caller;

	About(Spin who)
	{
		m_Caller = who;
		this.setBackground(new Color(192, 255, 192));
		this.setForeground(Color.black);
		this.setLayout(new BorderLayout());
		m_pnlAboutControls = new Panel();
		m_pnlAboutControls.setLayout(new GridLayout(1,5));
		m_lbBlank1 = new Label();
		m_pnlAboutControls.add(m_lbBlank1);
		m_lbBlank2 = new Label();
		m_pnlAboutControls.add(m_lbBlank2);
		m_btnAboutOK = new Button(m_strAboutOK);
		m_btnAboutOK.setBackground(Color.lightGray);
		m_pnlAboutControls.add(m_btnAboutOK);
		m_lbBlank3 = new Label();
		m_pnlAboutControls.add(m_lbBlank3);
		m_lbBlank4 = new Label();
		m_pnlAboutControls.add(m_lbBlank4);
		this.add("South", m_pnlAboutControls);
		m_pnlInfo = new Panel();
		m_pnlInfo.setLayout(new GridLayout(2,1));
		m_lbVersion = new Label("Spin version " + Spin.strVersion);
		m_lbCopr1 = new Label("Applet, \u00a9 Graham E. Rogers, 2001, 2026");
		m_pnlInfo.add(m_lbVersion);
		m_pnlInfo.add(m_lbCopr1);
		this.add("Center", m_pnlInfo);
		m_btnAboutOK.addActionListener(this);
	}

	public void actionPerformed(ActionEvent ev)
	{
		String str = ev.getActionCommand();

		if (str.equals(m_strAboutOK))
		{
			m_Caller.RemoveAboutBox();
		}
	}
}
