
/**
 * 
 */

function AVideoEvent(acomp)
{
	AEvent.call(this, acomp);
	
}
afc.extendsClass(AVideoEvent, AEvent);


//---------------------------------------------------------------------------------------------------
//	Component Event Functions
//	events: ['load']

AVideoEvent.prototype.load = function()
{
	this._load();
};


