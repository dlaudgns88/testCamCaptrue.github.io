
/**
 * @author asoocool
 */

function ACheckBoxEvent(acomp)
{
	AEvent.call(this, acomp);
	
}
afc.extendsClass(ACheckBoxEvent, AEvent);

ACheckBoxEvent.prototype.actionDownState = function()
{
	AComponent.setFocusComp(this.acomp);
};

ACheckBoxEvent.prototype.actionClickState = function()
{
	this.acomp.setCheck(!this.acomp.getCheck());
};

ACheckBoxEvent.prototype.defaultAction = function()
{
	this._click();
	this._keyup();
};

ACheckBoxEvent.prototype.keyup = null;

ACheckBoxEvent.prototype.onKeyUp = function(e)
{	
	if(this.acomp!==AComponent.getFocusComp()) return;
	
	//if(!this.acomp.keyPropagation) e.stopPropagation();
		
	if(e.keyCode == 13 || e.keyCode == 32)
	{
		this.actionClickState();
		this.acomp.reportEvent('click', null, e);
	}
	
	this.acomp.reportEvent('keyup', null, e);
	
	return (this.acomp.keyPropagation == false);
};


//---------------------------------------------------------------------------------------------------
//	Component Event Functions





//---------------------------------------------------------------------------------------------------