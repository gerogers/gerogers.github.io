// vi:set ts=4:
import java.awt.*;

public class SpinMovingPoint extends SpinPoint
{
	int			orig_x;
	int			orig_y;

	public SpinMovingPoint(SpinPoint sp)
	{
		this.next = null;
		this.index = sp.index;
		this.x = sp.x;
		this.y = sp.y;
		this.orig_x = this.x;
		this.orig_y = this.y;
	}
}
