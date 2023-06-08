
/**
Constructor
Do not call Function in Constructor.
*/
function MainView()
{
	AView.call(this);

	//TODO:edit here

}
afc.extendsClass(MainView, AView);


MainView.prototype.init = function(context, evtListener)
{
	AView.prototype.init.call(this, context, evtListener);

	//TODO:edit here
	this.mainTabView.addTab('tab01', 'Source/testPage01.lay', 'tab01');
	this.mainTabView.addTab('tab02', 'Source/testPage02.lay', 'tab02');
	this.mainTabView.addTab('tab03', 'Source/testPage03.lay', 'tab03');
		
	this.mainTabView.selectTabById('tab01');
};

MainView.prototype.onInitDone = function()
{
	AView.prototype.onInitDone.call(this);

	//TODO:edit here

};

MainView.prototype.onActiveDone = function(isFirst)
{
	AView.prototype.onActiveDone.call(this, isFirst);

	//TODO:edit here

};
