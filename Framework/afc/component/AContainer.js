
//기본으로 변경
//afc.loadScript("Framework/afc/component/AView.js");

/**
 * @author asoocool
 */
 
//-------------------------------------------------------------------------------------------------------- 
//	* AContainer 는 추상적인 클래스로만 사용
//	1) 컨테이너가 init 만 호출하고 open 을 호출하지 않으면 프레임만 존재하고 어떤 영역에도 추가되어져 있지 않은 상태이다.
//	2) 컨테이너가 open 을 호출했지만 url 을 셋팅하지 않은 경우는 컨테이너의 빈 프레임만 부모에 추가된 상태이고 내부 영역(클라이언트 영역)에는
//	뷰가 없는 상태이다. 내부 뷰는 setView 를 통해 이후에 셋팅할 수 있다.
//
//	* 컨테이너는 오직 하나의 뷰만을 갖는다. 뷰가 내부적으로 스플릿뷰나 플렉스뷰를 가지고 화면을 다시 분할 할 수 있다.
//---------------------------------------------------------------------------------------------------------  

function AContainer(containerId)	//필요시만 셋팅
{
	this.view = null;
	
	//뷰를 감싸고 있는 아이템
	this.viewItem = null;
	
	this.containerId = containerId;	//컨테이너를 구분 짓는 아이디(APage, AWindow)
	
	this.element = null;
	this.$ele = null;
	
	this.parent = null;			//parent AContainer
	this.url = null;
	
	this.className = afc.getClassName(this);
	
   	//같은 컨테이너를 여러 윈도우가 disable 시킬 수 있으므로 레퍼런스 카운팅을 한다.
	this.disableCount = 0;

	//여기에서 값을 초기화 하면 안됨. init 함수에서 setOption 함수를 이용함.
	/*
	this.option = 
	{
		isAsync: true,
		inParent: true
	};
	*/
	this.option = {};
	
}



//-------------------------------------------------------------------------
//	static area

AContainer.openContainers = {};

AContainer.findOpenContainer = function(cntrId)
{
	return AContainer.openContainers[cntrId];
};

AContainer.getDefaultParent = function(self)
{
    //현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
    var fApp = AApplication.getFocusedApp();

	var parent = fApp.getMainContainer();
	if(!parent) 
	{
		var navi = ANavigator.getRootNavigator();
		if(navi) parent = navi.getActivePage();
	}

	if(!parent || parent===self) parent = fApp.rootContainer;
	
	return parent;
};


AContainer.TAG = '<div class="AContainer-Style"></div>';

AContainer.disableIosScroll = false;

AContainer.isAsyncLoad = false;

//--------------------------------------------------------------------------


AContainer.prototype.init = function(context, noViewItem)
{
	this.setOption(
	{
		isAsync: AContainer.isAsyncLoad,
		inParent: true
		
	}, true);	

	if(!context) context = $(AContainer.TAG)[0];

    this.element = context;
    this.element.acont = this;	//AContainer
    this.$ele = $(this.element);
	
	//this.isActiveRecursive = !afc.isMobile;
	
	this.isActiveRecursive = false;
	
	this.tabKey = new TabKeyController();
	
	if(!noViewItem) this.makeViewItem();
};


AContainer.prototype.setData = function(data) { this.data = data; };
AContainer.prototype.getData = function() { return this.data; };

AContainer.prototype.makeViewItem = function()
{
	var $item = $('<div class="_view_item_"></div>');
	
    $item.css(
    {
        width: '100%',
        height: '100%',
        position: 'relative'
    });

    this.$ele.append($item);

    this.viewItem = $item[0];
};

AContainer.prototype.setView = function(view, isFull, asyncCallback)
{
	var thisObj = this;

	if(asyncCallback)
	{
		this.view = null;
		
		AView.createView(this.viewItem, view, this, null, null, null, function(aview)
		{
			_after_helper(aview);
			
			if(typeof(asyncCallback)=='function') asyncCallback(aview);
		});
	}
	else 
	{
		if(typeof(view)=='string') view = AView.createView(this.viewItem, view, this);
		else
		{
			this.viewItem.appendChild(view.element);

			//기존의 뷰가 들어올 경우 새로운 값으로 변경
			view.owner = this;
			view._item = this.viewItem;
			this.viewItem.view = view;
			view.element.container = this.getContainer();
			view.element.rootView = view;

			//기존의 뷰가 들어올경우에는 view의 realizeChild가 호출을 안하므로
			//여기서 탭키추가를 위해 호출해준다.
			
			var _find_child = function(item)
			{
				item.eachChild(function(acomp){
					//하위 컴포넌트에도 컨테이너를 다시 넣어준다.
					acomp.element.container = view.element.container;
					thisObj.tabKey.addCompMap(acomp, item.owner);
					if(acomp.eachChild) _find_child(acomp);
				});
			}

			_find_child(view);

			this.tabKey.saveOwnerMap(view.owner);
		}
		
		_after_helper(view);
		
		//새로 생성되어진 뷰를 리턴
		return this.view;
	}


	function _after_helper(_view)
	{
		thisObj.view = _view;
		
		if(!_view || !_view.isValid()) return;
		
		//컨테이너에 셋팅되는 기본 뷰를 가득차게 한다.
		if(isFull) _view.$ele.css({ left:'0px', top:'0px', width:'100%', height:'100%' });

		thisObj.tabKey.init(thisObj.view, !thisObj.option.focusOnInit);

		//iphone web
		if(AContainer.disableIosScroll)
		{
			if(afc.isIos && !afc.isHybrid)
			{
				//컨테이너에 기본 touch 를 disable 시켜 드래그 바운스 효과를 없앰.
				thisObj.$ele.bind('touchstart', function(e)
				{
					//자체 스크롤이 필요한 컴포넌트는 예외, AComponent 의 escapePreventDefault 함수를 호출하면 된다.
					if(!e.target.noPreventDefault) e.preventDefault();
				});	
			}
		}
	}

};

AContainer.prototype.open = function(url, parent, left, top, width, height)
{
	//parent 가 지정 되어져 있지 않으면
	if(!parent) parent = AContainer.getDefaultParent(this);
	
	if(!(parent instanceof AContainer)) 
	{
		console.error('parent must be AContainer');
	}
	
	this.parent = parent;
	this.url = url;
    
	//init 이 호출되지 않은 경우 
	if(!this.element) this.init();

	//position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	if(!width) width = 'auto';
	if(!height) height = 'auto';
	
	// container 의 넓이 높이에 비율이 주어지면 리사이즈 시 이벤트를 보내주기위해
	//if( width.indexOf('%')>-1 || height.indexOf('%')>-1 ) this.isResizeEvent = true;
	
	this.$ele.css( { 'left':left, 'top':top, 'width': width, 'height': height });
	
    //현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
    var fApp = AApplication.getFocusedApp();
	
	//if(this.option.inParent) this.parent.$ele.append(this.$ele);
	//else fApp.rootContainer.$ele.append(this.$ele);
	
	if(this.option.inParent) 
	{
		//루트컨테이너를 생성할 때는 viewItem 을 만들지 않기 때문에 비교
		if(this.parent.viewItem) this.parent.viewItem.appendChild(this.element);
		else this.parent.element.appendChild(this.element);
	}
	else 
	{
		if(fApp.rootContainer.viewItem) fApp.rootContainer.viewItem.appendChild(this.element);
		else fApp.rootContainer.element.appendChild(this.element);
	}
	
	var thisObj = this;
	
	if(url) 
	{
		//view 비동기 로드 옵션
		if(this.option.isAsync) 
		{
			this.setView(url, null, function(aview)
			{
				_after_setview();
				
				if(typeof(thisObj.option.isAsync)=='function') 
					thisObj.option.isAsync(aview);
			});
			
			return;
		}
		else this.setView(url);
	}
	
	_after_setview();
	
	//return true;
	
	function _after_setview()
	{
		thisObj.onCreate();

		//컨테이너가 오픈되면 전역 메모리에 컨테이너아이디를 키로 하여 모두 저장해 둔다.
		AContainer.openContainers[thisObj.getContainerId()] = thisObj;

		//parent 가 static 으로 지정되어 있으면 자신도 static 로 변경해 준다.
		//container split 시 static 으로 지정할 경우 셋팅되어짐.
		if(thisObj.parent!==fApp.rootContainer && thisObj.parent.$ele.css('position')=='static')
		{
			thisObj.$ele.css('position', 'static');
		}

		//모바일이고 noAutoScale 값이 참이면 
		if(afc.isMobile && thisObj.option.noAutoScale)
		{
			//autoScale 이 적용되지 않은 효과가 나타나도록
			//반대로 줌을 적용해 준다.
			var scale = 1/PROJECT_OPTION.general.scaleVal;
			thisObj.$ele.css('zoom', scale);
		}
	}
};

AContainer.prototype.close = function(result, data)
{
	this.onClose();
	
	if(this.view) 
	{
		var doc = this.view.getDocument();
		if(doc) doc.closeDocument();
		
		this.view.removeFromView();
		this.view = null;
		
		if(this.title && this.title.view)
		{
			this.title.view.removeFromView();
		}
	}
	
	//if container is splitted, destroy all them
	this.destroySplit();
	
    this.$ele.remove();
    this.$ele = null;
	this.element = null;
	
	//delete AContainer.openContainers[this.getContainerId()];
	AContainer.openContainers[this.getContainerId()] = undefined;	
	
	//return true;
};

AContainer.prototype.setParent = function(newParent, styleObj)
{
	if(!newParent) newParent = AContainer.getDefaultParent(this);
	
	if(!(newParent instanceof AContainer)) 
	{
		console.error('parent must be AContainer');
		//return null;
	}
	
	var oldParent = this.parent;
	this.parent = newParent;

	if(styleObj) this.$ele.css(styleObj);

	//inParent 옵션이 있는 경우만 element 를 이동시켜 준다.
	if(this.option.inParent)
	{
		this.parent.$ele.append(this.$ele);

		this.onResize();
	}
	
	return oldParent;
};

AContainer.prototype.getClassName = function()
{
	return this.className;
};

//active 이벤트를 자식들에게 재귀적으로 호출해 줄지 여부
//이 값이 false 이고 원하는 자식에게만 전달하고 싶을 경우
//수동으로 뷰의 onActive 함수내에서 _callSubActiveEvent 함수를 호출해 주면 된다.
AContainer.prototype.setActiveRecursive = function(isRecursive) 
{
	this.isActiveRecursive = isRecursive;
};

AContainer.prototype.show = function()
{
	this.$ele.show();
};

AContainer.prototype.hide = function()
{
    this.$ele.hide();
};

//컨테이너의 리소스 로드가 완료되면 호출, 최초 한번만 호출된다.
//리소스는 로드됐지만 컨테이너가 보여지진 않는다. 
AContainer.prototype.onCreate = function()
{
	var thisObj = this;
	setTimeout(function() 
	{
		if(thisObj.onCreateDone) thisObj.onCreateDone();
		
	}, 0);

};


//Application 이 Background 로 이동하는 경우
AContainer.prototype.onAppPause = function() 
{
};

//Application 이 Foreground 로 이동하는 경우
AContainer.prototype.onAppResume = function()
{
};

AContainer.prototype.onClose = function()
{
	
};



AContainer.prototype._callSubActiveEvent = function(funcName, isFirst)
{
	if(!this.isValid()) return;
	
	if(this.splitter)
	{
		var count = this.getSplitCount(), acont;

		for(var i=0; i<count; i++)
		{
			acont = this.getSplitPanel(i);
			if(acont) acont[funcName].call(acont, isFirst);
		}
	}
	
	else if(this.view) 
	{
		// isFirst 가 참인 경우, onInitDone 이후 자동으로 호출됨.
		if(funcName=='onActiveDone' && isFirst) return;
		
		this.view[funcName].call(this.view, isFirst);
	}

};

//--------------------------------------------------------------------

//뷰가 활성화되기 바로 전에 호출된다.
AContainer.prototype.onWillActive = function(isFirst) 
{
	this._callSubActiveEvent('onWillActive', isFirst);
};

//뷰의 활성화가 시작되면 호출된다.
AContainer.prototype.onActive = function(isFirst) 
{
	this._callSubActiveEvent('onActive', isFirst);
};

//뷰의 활성화가 완료되면 호출된다.
AContainer.prototype.onActiveDone = function(isFirst) 
{
	this._callSubActiveEvent('onActiveDone', isFirst);
};

AContainer.prototype.onWillDeactive = function() 
{
	this._callSubActiveEvent('onWillDeactive');
};

AContainer.prototype.onDeactive = function() 
{
	this._callSubActiveEvent('onDeactive');
};

AContainer.prototype.onDeactiveDone = function() 
{
	this._callSubActiveEvent('onDeactiveDone');
};


//-------------------------------------------------------------------

AContainer.prototype.onOrientationChange = function(info)
{
	
};

AContainer.prototype.onBackKey = function()
{
	return false;
};

AContainer.prototype.onResize = function()
{
	if(this.splitter) 
	{
		this.splitter.updateSize();
	}
	
	//자신이 네비게이터의 프레임 컨테이너인 경우
	else if(this.childNavigator)
	{
		this.childNavigator.onResize();
	}

	else if(this.view) this.view.updatePosition();
	
	//자신을 부모로 해서 open 을 호출한 자식 컨테이너들
	this.$ele.children('.AContainer-Style').each(function()
	{
		if(this.acont && this.acont.isShow())
			this.acont.onResize();
	});
	
	
};

//----------------------------------------------------------------------

AContainer.prototype.getPos = function()
{
	return this.$ele.position();
};

AContainer.prototype.setPos = function(pos)
{
	this.$ele.css( { 'left': pos.left+'px', 'top': pos.top+'px' });
};


AContainer.prototype.getWidth = function()
{
	return this.$ele.width();
};

AContainer.prototype.getHeight = function()
{
	return this.$ele.height();
};

AContainer.prototype.setWidth = function(width)
{
	return this.$ele.width(width);
};

AContainer.prototype.setHeight = function(height)
{
	return this.$ele.height(height);
};

//----------------------------------------------------------------------------------------

AContainer.prototype.getParent = function()
{
	return this.parent;
};


AContainer.prototype.setContainerId = function(containerId)
{
	this.containerId = containerId;
};

AContainer.prototype.getContainerId = function()
{
	return this.containerId;
};

AContainer.prototype.getContainer = function()
{
	return this;
};

AContainer.prototype.getView = function()
{
	return this.view;
};

AContainer.prototype.isShow = function()
{
	return this.$ele.is(":visible");
};

AContainer.prototype.isOpen = function()
{
	return (this.element!=null);
};

AContainer.prototype.isValid = function()
{
	return this.element;
};



AContainer.prototype.toString = function()
{
	var ret = '\n{\n', value;
    for(var p in this) 
    {
        if(!this.hasOwnProperty(p)) continue;
        
        value = this[p];
        
        if(typeof(value) == 'function') continue;
        
        else if(value instanceof HTMLElement)
        {
        	if(afc.logOption.compElement) ret += '    ' + p + ' : ' + $(value)[0].outerHTML + ',\n';
        	else ret += '    ' + p + ' : ' + value + ',\n';
        }
        else if(value instanceof Object) ret += '    ' + p +' : ' + afc.getClassName(value) + ',\n';
		else ret += '    ' + p + ' : ' + value + ',\n';
    }
    ret += '}\n';
    
    return ret;
};

/*
AContainer.prototype.actionDelay = function(filter)
{
	if(this.view) this.view.actionDelay(filter);
};
*/

AContainer.prototype.actionDelay = function()
{
	var thisObj = this;
	
	this.enable(false);
	
	setTimeout(function() 
	{
		if(thisObj.isValid()) thisObj.enable(true);
		
	}, afc.DISABLE_TIME);
};

//tabview 를 찾아서 selectedView 에 enable 처리를 하면
//문제가 해결되는지... 컨테이너의 $ele.find 하면 탭뷰까지 찾아서 처리해 주고 있는게 아닌지... 확인
AContainer.prototype.enable = function(isEnable)
{
	//스플릿되어 있는 경우는 뷰가 없는 경우인데 처리해야 하므로
	//아래 처럼 view 의 enable 을 호출하면 안되고 직접 찾아서 해야 함.
	
	//if(this.view) this.view.enable(isEnable);
	
	this.isEnable = isEnable;
	
	if(isEnable) this.$ele.css('pointer-events', 'auto');
	else this.$ele.css('pointer-events', 'none');
	
	
	//input, textarea tag 도 같이 해줘야 이벤트 전달시 키보드 오픈을 막을 수 있다.
	
	_enable_helper(this.$ele.find('input'));
	_enable_helper(this.$ele.find('textarea'));
	_enable_helper(this.$ele.find('.RGrid-Style'));
	_enable_helper(this.$ele.find('button')); //button 도 전달되므로 추가
	
	//탭뷰는 선택된 뷰가 pointer-events: auto 되어있으므로 이벤트 전달을 막기 위해 처리한다.
	this.$ele.find('.ATabView-Style').each(function()
	{
		if(this.acomp)
		{
			var view = this.acomp.getSelectedView();
			if(view)
			{
				if(isEnable)
				{
					if(view.isEnable) view.$ele.css('pointer-events', 'auto');
				}
				else view.$ele.css('pointer-events', 'none');
			}
		}
	});
	
	function _enable_helper($eles)
	{
		if(isEnable)
		{
			$eles.each(function()
			{
				if(!this.acomp || (this.acomp && this.acomp.isEnable))
					$(this).css('pointer-events', 'auto');
			});
		}
		else
		{
			//disable 전부 호출해 주면 된다.
			$eles.css('pointer-events', 'none');
		}
	}
};

/*
//--------------------------------------------------------------
//	패널은 다른 컨테이너의 부분 컨테이너 역할만 할 수 있다. 
AContainer.prototype.addPanel = function(panel)
{
	this.panels.push(panel);
	
	//차후 실제로 컨테이너 밑으로 들어가도록 하는 작업하기
	
};

AContainer.prototype.removePanel = function(panel)
{
	//this.panels.push(panel);
	
};
*/


//----------------------------------------------------------------------------------------
// split functions

//	createSplit 호출 시 내부에 분할 개수만큼의 빈 컨테이너가 생긴다.
//	이후 분할된 컨터이너에 setView 함수를 호출하여 뷰를 셋팅 또는 로드한다.
//	cntrClass 는 분할 시 셋팅할 컨테이너 클래스. 생략하면 APanel. null 이나 '' 이면 컨테이너를 셋팅하지 않는다. 이 경우 차후 setSplitPanel 을 호출하여 셋팅해 줘야한다.
//	APanel 이외의 다른 클래스는 지정할 수 없다.
AContainer.prototype.createSplit = function(count, sizeArr, splitDir, barSize, panelClass)
{
	if(this.splitter) return null;
	
	//afc.loadScript('Framework/afc/library/ASplitter.js');
	
	if(!window.ASplitter)
	{
		console.error('ASplitter is not defined.');
		console.info("Check Default Load Settings. or ");
		console.info("afc.loadScript('Framework/afc/library/ASplitter.js');");
		return;
	}

	this.splitter = new ASplitter(this, barSize);
	this.splitter.createSplit(this.viewItem, count, sizeArr, splitDir);

	if(panelClass==undefined) panelClass = 'APanel';
	
	//null 이나 '' 을 입력하면 셋팅하지 않음.
	else if(!panelClass) return null;	
	
	var newCntr = null, ret = [];
	for(var i=0; i<count; i++)
	{
		newCntr = new window[panelClass]();
		newCntr.init();
		this.setSplitPanel(i, newCntr);
		
		newCntr.onCreate();
		
		ret.push(newCntr);
	}
	
	return ret;
};

AContainer.prototype.destroySplit = function()
{
	if(!this.splitter) return;
	
	var count = this.getSplitCount(), acont;
	
	for(var i=0; i<count; i++)
	{
		acont = this.getSplitPanel(i);
		if(acont) acont.close();
	}
	
	this.splitter.removeAllSplit();
	this.splitter = null;
};

//새롭게 분할 컨테이너를 추가한다.
AContainer.prototype.insertSplit = function(inx, splitSize, isAfter, cntrClass)
{
	if(!this.splitter) return null;
	
	var item = this.splitter.insertSplit(inx, splitSize, isAfter);
	
	if(cntrClass==undefined) cntrClass = 'APanel';
	
	//null 이나 '' 을 입력하면 셋팅하지 않음.
	else if(!cntrClass) return null;
	
	var newCntr = new window[cntrClass]();
	newCntr.init();
	this.setSplitPanel(item, newCntr);
	
	newCntr.onCreate();
	
	return newCntr;
};

AContainer.prototype.appendSplit = function(splitSize, cntrClass)
{
	return this.insertSplit(-1, splitSize, true, cntrClass);
};

AContainer.prototype.prependSplit = function(splitSize, cntrClass)
{
	return this.insertSplit(0, splitSize, false, cntrClass);
};

AContainer.prototype.removeSplit = function(inx)
{
	this.splitter.removeSplit(inx, function(removeItem)	
	{ 
		removeItem.acont.close();
	});
};

AContainer.prototype.getSplit = function(inx)
{
	return this.splitter.getSplit(inx);
};

AContainer.prototype.getSplitPanel = function(inx)
{
	var split = this.splitter.getSplit(inx);
	if(split) return split.acont;
	else return null;
	
	//return this.splitter.getSplit(inx).acont;
};

AContainer.prototype.getSplitCount = function()
{
	if(!this.splitter) return -1;
	return this.splitter.getSplitCount();
};

AContainer.prototype.indexOfPanel = function(panel)
{
	var count = this.getSplitCount();
	for(var i=0; i<count; i++)
	{
		if(panel===this.getSplitPanel(i)) return i;
	}
	
	return -1;
};

//open 되어 있지 않은 Panel 은 open 과 같은 효과를 갖는다.
//split 인 경우 parent 를 기준으로 open 함수를 호출할 수 없다.
//parent frame 으로 들어가는 것이 아니라 parent 밑의 split frame 로 들어가기 때문에
//setSplitPanel 함수를 호출해 줘야 한다.
AContainer.prototype.setSplitPanel = function(inx, acont)
{
	if(!(acont instanceof APanel)) 
	{
		alert('Container class should be APanel');
		return;
	}
	
	var $item;
	if(typeof(inx) == 'number') $item = $(this.splitter.getSplit(inx));
	else $item = $(inx);
	
	$item.append(acont.$ele);
	
	//새로운 값으로 변경
	acont._item = $item[0];
	$item[0].acont = acont;
	acont.parent = this;
	
	if(this.splitter.isStatic) acont.$ele.css('position', 'static');
	
	acont.$ele.css({ left:'0px', top:'0px', width:'100%', height:'100%' });
};


AContainer.prototype.onSplitChanged = function(splitFrame)
{
	if(splitFrame.acont)
		splitFrame.acont.onResize();
};



//------------------------------------------
//	asoocool test
//drag & drop 관련


//drag & drop 관련
/*
AContainer.prototype.enableDrag = function(isDraggable, offsetX, offsetY)
{
	if(!this.ddManager) this.ddManager = new DDManager(this);
	
	if(!offsetX) offsetX = 0;
	if(!offsetY) offsetY = 0;
	
	this.ddManager.setOffset(offsetX, offsetY);
	this.ddManager.enableDrag(isDraggable);
};

AContainer.prototype.enableDrop = function(isDroppable)
{
	if(!this.ddManager) this.ddManager = new DDManager(this);
	this.ddManager.enableDrop(isDroppable);
};
*/

//전역 리얼을 등록하기 위해 컨테이너도 registerReal 이 가능하도록 함.
//리얼데이터 수신시 컨테이너의 updateComponent 가 호출됨.
AContainer.prototype.updateComponent = function(queryData)
{

};

//noOverwrite 가 true 이면, 기존의 값이 존재할 경우 덮어쓰지 않는다.
AContainer.prototype.setOption = function(option, noOverwrite)
{
    for(var p in option)
    {
    	if(!option.hasOwnProperty(p)) continue;
    	
		if(!noOverwrite || this.option[p]==undefined)
		{
			this.option[p] = option[p];
		}
    }
};



//-----------------------------------------------------------------------
//	deprecated
//
AContainer.prototype.setId = function(containerId)
{
	this.containerId = containerId;
};

AContainer.prototype.getId = function()
{
	return this.containerId;
};

AContainer.prototype.getElement = function()
{
    return this.view.element;
};

AContainer.prototype.get$ele = function()
{
	return this.view.$ele;	
};

AContainer.prototype.addComponent = function(acomp, isPrepend, insComp)
{
	this.view.addComponent(acomp, isPrepend, insComp);
};

AContainer.prototype.findCompById = function(strId)
{
	return this.view.findCompById(strId);
};

AContainer.prototype.findCompByGroup = function(strGroup)
{
	return this.view.findCompByGroup(strGroup);
};

//-----------------------------------------------------------------------