/**
 * @author asoocool
 */

function AScrollBar()
{
	AComponent.call(this);
	
	//this.scrlAreaHeight = 0;
	this.scrollGap = 0;			//하나의 데이터를 표현할 영역의 넓이... 보통 그리드에서 로우
	this.scrollPadding = 0;		//스크롤 영역에서 제외할 상단 영역.. 보통 그리드에서 헤더
	
	this.countPerArea = 0;		//한 영역에 보여질 데이터 개수
	this.dataCount = 0;			//스크롤바가 표현하고 있는 데이터의 개수
	this.$cntLo = null;			//컨텐츠의 가상영역 1
	this.$cntHi = null;			//컨텐츠의 가상영역 2, 브라우저에 따라 1개로 데이터 개수를 모두 표현하지 못하므로 사용
	
	this.isScrollVert = true;

};
afc.extendsClass(AScrollBar, AComponent);


AScrollBar.CONTEXT = 
{
	//tag:'<div data-base="AScrollBar" data-class="AScrollBar" class="AScrollBar-Style"><pre> </pre><pre> </pre></div>',
	
	//동적으로 추가되도록 변경
	tag:'<div data-base="AScrollBar" data-class="AScrollBar" class="AScrollBar-Style"></div>',

    defStyle: 
    {
    	width: afc.scrlWidth+'px', height:'200px' 
    },
   
    events: ['scroll']
};

AScrollBar.NAME = "AScrollBar";

AScrollBar.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);
	
	//동적으로 추가되도록 변경
	this.$ele.html('<pre> </pre><pre> </pre>');
	this.$ele.css(
	{
		'z-index': 0,	//scrollTop 으로 이동할 경우는 부모 레이어에 z-index 를 주어 가속 시킨다.
	});
	var $child = this.$ele.children();
	
	this.$cntLo = $child.eq(0);
	this.$cntHi = $child.eq(1);

	var scrollType = this.getAttr('data-scroll-type');
	
	if(!scrollType) scrollType = 'vert';
	
	this.setScrollType(scrollType);
	
	if(afc.isScrollIndicator) this.enableScrollIndicator();
};

AScrollBar.prototype.setScrollType = function(type)
{
	this.isScrollVert = (type=='vert');
	
	//세로 스크롤바인 경우 
	if(this.isScrollVert)
	{
		this.setStyle('overflow-x', 'hidden');
		this.setStyle('overflow-y', 'scroll');
		
		this.$cntLo.width('100%');
		this.$cntHi.width('100%');
		
		this.$cntLo.height(0);
		this.$cntHi.height(0);
		
		//IE는 완전히 덮히면 스크롤 작동이 제대로 안됨. + firefox도 마찬가지
		//if((afc.isIE && afc.strIEVer!="edge") || afc.isFirefox) this.setWidth(afc.scrlWidth+1);
		//else this.setWidth(afc.scrlWidth);
		
		this.setWidth(afc.scrlWidth+1);
	}
	else 
	{
		this.setStyle('overflow-x', 'scroll');
		this.setStyle('overflow-y', 'hidden');
		
		this.$cntLo.height('100%');
		this.$cntHi.height('100%');
		
		this.$cntLo.width(0);
		this.$cntHi.width(0);
		
		//IE는 완전히 덮히면 스크롤 작동이 제대로 안됨. + firefox도 마찬가지
		//if((afc.isIE && afc.strIEVer!="edge") || afc.isFirefox)  this.setHeight(afc.scrlWidth+1);
		//else this.setHeight(afc.scrlWidth);
		
		this.setHeight(afc.scrlWidth+1);
	}

};

AScrollBar.prototype.enableScrollIndicator = function()
{
	this.scrlIndicator = new ScrollIndicator();
	
	if(this.isScrollVert) 
	{
		this.scrlIndicator.init('vertical', this.element);
	}
	else 
	{
		this.scrlIndicator.init('horizontal', this.element);
	}
};

//------------------------------

//scrollGap : 하나의 데이터를 표현할 영역의 넓이... 보통 그리드에서 로우
//scrollPadding : 스크롤 영역에서 제외할 상단 영역.. 보통 그리드에서 헤더
AScrollBar.prototype.setScrollArea = function(scrlAreaHeight, scrollPadding, scrollGap, isBorder)
{
	//this.scrlAreaHeight = scrlAreaHeight;
	this.scrollPadding = scrollPadding;
	this.scrollGap = scrollGap;
	
	var borderCnt = 0;
	
	if(isBorder) borderCnt = (scrlAreaHeight-scrollPadding)/scrollGap;
	
	this.countPerArea = Math.floor( (scrlAreaHeight-scrollPadding-borderCnt)/scrollGap );
	
};

AScrollBar.prototype.getCountPerArea = function()
{
	return this.countPerArea;
};


AScrollBar.prototype.setDataCount = function(dataCount)
{
	var cntHeight = this.scrollGap*dataCount + this.scrollPadding;
	var half = cntHeight/2;
	
	if(this.isScrollVert)
	{
		this.$cntLo.css('height', half + 'px');
		this.$cntHi.css('height', half + 'px');
		
		//static 에 inline-block 을 사용했기 때문에 x,y 값을 지정하지 않아도 된다.
		//this.$cntHi.css('top', half + 'px');
	}
	else 
	{
		this.$cntLo.css('width', cntHeight + 'px');
		this.$cntHi.css('width', cntHeight + 'px');
	}
	
	this.dataCount = dataCount;
};

AScrollBar.prototype.addDataCount = function(count)
{
	this.setDataCount(this.dataCount+count);
};

//휠 이벤트 발생시 스크롤 바를 이동 시킬 영역을 셋팅한다.
//AScrollBar.prototype.setWheelArea = function(wheelArea)
AScrollBar.prototype.addWheelArea = function(wheelArea)
{
	var thisObj = this;
	
	wheelArea.addEventListener("wheel", function(e)
	{
		e.preventDefault();
		e.stopPropagation();
		
   		var delta = 0;
		
		//console.log(e);
		//console.log(e.wheelDelta + ', ' + e.deltaY);
		
		//chrome, edge
		if(afc.isFirefox) delta = e.deltaY/3;
		else delta = e.deltaY/100;
		
		//console.log(delta);
		
		//if(delta > 0) thisObj.onWheelUp();
		//else if(delta < 0) thisObj.onWheelDown();
		
		thisObj._onWheelEvent(delta);
		
   	}, false);
};

AScrollBar.prototype._onWheelEvent = function(delta)
{
	this.offsetBarPos(this.scrollGap*delta);
};

/*
AScrollBar.prototype.onWheelUp = function(cnt)
{
	this.offsetBarPos(-this.scrollGap*cnt);
};

AScrollBar.prototype.onWheelDown = function(cnt)
{
	this.offsetBarPos(this.scrollGap*cnt);
};
*/

AScrollBar.prototype.offsetBarPos = function(move)
{
	if(this.isScrollVert) this.element.scrollTop += move;
	else this.element.scrollLeft += move;
	
	//this.listener.onScrollY(this.element.scrollTop);
};

AScrollBar.prototype.isScrollTop = function()
{
	return (this.element.scrollTop==0);
};

AScrollBar.prototype.isScrollBottom = function()
{
	return (this.element.scrollHeight-this.element.clientHeight-this.element.scrollTop <= 1);
};

AScrollBar.prototype.isScrollLeft = function()
{
	return (this.element.scrollLeft==0);
};

AScrollBar.prototype.isScrollRight = function()
{
	return (this.element.scrollWidth-this.element.clientWidth-this.element.scrollLeft <= 1);
};


















