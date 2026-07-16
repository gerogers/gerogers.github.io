// vi:set ts=4:
import java.awt.*;

class Animate implements Runnable
{
	int				toDo;
	boolean			clockwise;
	GameBoard		board;
	Thread			threadRot;
	long			lSleepTime = 15;
	boolean			Moving;

	// Constructor
	Animate(GameBoard board, boolean clockwise)
	{
		this.board = board;
		this.clockwise = clockwise;
		toDo = board.getRotIncs();
		Moving = true;
		board.inhibitRescale();
		threadRot = new Thread(this);
		threadRot.start();
	}

	public boolean IsMoving()
	{
		return Moving;
	}

	public void run()
	{
		boolean doDrop = false;
		if (toDo == board.getRotIncs())
			doDrop = true;
		try
		{
			while (toDo > 0)
			{
				if (clockwise)
				{
					board.decAngle();
				}
				else
				{
					board.incAngle();
				}

				toDo--;
				board.repaint();
				threadRot.sleep(lSleepTime);
			}
		}
		catch (InterruptedException e)
		{
		}

		int d;
		int pDrop=0;
		SpinCircle sc;
		if (doDrop)
		{
			for (sc = board.circlesChain; sc != null; sc = sc.next)
			{
				d = sc.setDrop(board);
				if (d > pDrop)
					pDrop = d;
			}

			// pDrop = number of pixels to drop
			try
			{
				while (pDrop > 0)
				{
					for (sc = board.circlesChain; sc != null; sc = sc.next)
					{
						if (sc.y_offset < sc.y_target)
						{
							sc.y_offset += 2 * board.s;
							if (sc.y_offset > sc.y_target)
								sc.y_offset = sc.y_target;
						}
					}
					pDrop -= 2 * board.s;
					board.repaint();
					threadRot.sleep(lSleepTime);
				}
			}
			catch (InterruptedException e) { }
		}
		board.setDropped();
		board.allowRescale();
		Moving = false;
	}
}
