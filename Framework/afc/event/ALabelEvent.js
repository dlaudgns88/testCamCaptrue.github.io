
/**
 * @author asoocool
 */

function ALabelEvent(acomp)
{
	AEvent.call(this, acomp);
	
}
afc.extendsClass(ALabelEvent, AEvent);




//---------------------------------------------------------------------------------------------------
//	Component Event Functions

ALabelEvent.prototype.click = function()
{
	this._click();
};

ALabelEvent.prototype.longtab = function()
{
	this._longtab();
};


//---------------------------------------------------------------------------------------------------