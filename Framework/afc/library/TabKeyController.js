function TabKeyController()
{
	//depth가 있는 맵. 기본적으로 이곳에 쌓임.
	this.componentMap = 
	[
		
	];
	
	//탭인덱스를 빠르게 검색하기 위한 배열
	this.tabIndexArr =
	[
	
	];
}

TabKeyController.prototype.init = function(rootView, noFocus)
{
	if(!noFocus)
	{
		this.makeTabIndexArr();
		var nextComp = this._getFirstComp();
		if(nextComp) nextComp.setFocus();
		else
		{
			if(rootView && rootView.isValid())
			{	
				rootView.enableActiveFocus(true);
				AComponent.setFocusComp(rootView);
			}
		}
	}
	rootView.element.setAttribute('tabindex', -1);
	rootView.element.addEventListener('keydown', this._keydown);
};

//key down 이벤트
TabKeyController.prototype._keydown = function(e)
{
	var acont = this.acomp.getContainer();
	if(!acont) return;

	if(e.keyCode == 9 && acont.tabKey)
	{
		var nextComp = acont.tabKey.findNextTab(AComponent.getFocusComp(), e.shiftKey);
		if(nextComp) 
		{
			nextComp.setFocus();
			e.preventDefault();
			e.stopPropagation();
		}
	}
};

//다음 탭이 가능한 컴포넌트를 찾음. 
//없으면 탭이 가능한 첫번째 컴포넌트로. (주로 포커스가 rootView에 있을경우 발생한다.)
TabKeyController.prototype.findNextTab = function(comp, isShift)
{
	if(this.componentMap.length == 0) return;
	
	if(!this._isMakeArr) this.makeTabIndexArr();
	
	var nowIndex = this._getCompIndex(comp);
	
	if(nowIndex != null)
	{
		if(isShift)
		{
			return this._getPrevCompByIndex(nowIndex, nowIndex-1);
		}
		else
		{
			return this._getNextCompByIndex(nowIndex, nowIndex+1);
		}
	}
	else
	{
		return this._getFirstComp();
	}
};



//현재 컴포넌트의 순서를 찾음.
TabKeyController.prototype._getCompIndex = function(comp)
{
	if(!comp) return null;
	
	for(var i=0;i<this.tabIndexArr.length;i++)
	{
		if(this.tabIndexArr[i] == comp)
		{
			return i;
		}
	}
	return null;
};

//다음.
TabKeyController.prototype._getNextCompByIndex = function(start, inx)
{
	if(start == inx) return;

	if(inx < this.tabIndexArr.length)
	{
		if(this._checkTabValieComp(this.tabIndexArr[inx])) return this.tabIndexArr[inx];
		else return this._getNextCompByIndex(start, inx+1);
	}
	else
	{
		return this._getNextCompByIndex(start, 0);
	}
};

//이전
TabKeyController.prototype._getPrevCompByIndex = function(start, inx)
{
	if(start == inx) return;
	
	if(inx < 0)
	{
		return this._getPrevCompByIndex(start, this.tabIndexArr.length-1);
	}
	else
	{
		if(this._checkTabValieComp(this.tabIndexArr[inx])) return this.tabIndexArr[inx];
		else return this._getPrevCompByIndex(start, inx-1);
	}
};

//탭이 가능한 첫번쨰 컴포넌트를 리턴한다.
TabKeyController.prototype._getFirstComp = function()
{
	for(var i=0;i<this.tabIndexArr.length;i++)
	{
		if(this._checkTabValieComp(this.tabIndexArr[i])) return this.tabIndexArr[i];
	}
};

//뷰에서 호출함. 탭키컨트롤러 배열로 컴포넌트맵을 만듬.
TabKeyController.prototype.addCompMap = function(acomp, owner)
{
	this._isMakeArr = false;
	var inx = acomp.getAttr('tabindex'), map;
	
	if(owner)
	{
		if(owner.ownerTabMap) map = owner.ownerTabMap;
		else 
		{
			owner.ownerTabMap = [];
			map = owner.ownerTabMap;
		}
	}
	
	if(!map) map = this.componentMap;
	
	if(inx == 0 || inx == null)
	{
		map.push({comp:acomp, childArr:[]});
	}
	else
	{
		if(map.length == 0) map.push({comp:acomp, childArr:[]});
		else
		{
			var chk = false;
			for(var i in map)
			{
				if(!map[i].comp.getAttr('tabindex') || parseInt(inx) < parseInt(map[i].comp.getAttr('tabindex')))
				{
					map.splice(i, false, {comp:acomp, childArr:[]});
					chk = true;
					break;
				}
			}
			if(!chk) map.push({comp:acomp, childArr:[]});
		}	
	}
};

//동적로드된 경우에는 따로 모아두는데
//모아 뒀던 탭인덱스 배열을 세이브하는 함수.
TabKeyController.prototype.saveOwnerMap = function(owner)
{
	if(owner.ownerTabMap)
	{
		var result = this._setOwnerChild(owner, this.componentMap);
		if(!result) this.componentMap.push({comp: owner, childArr: owner.ownerTabMap.slice()});

		delete owner.ownerTabMap;
	}
};

TabKeyController.prototype._setOwnerChild = function(owner, targetArr)
{
	for(var i=0;i<targetArr.length;i++)
	{
		if(targetArr[i].comp == owner) 
		{
			targetArr[i].childArr = targetArr[i].childArr.concat(owner.ownerTabMap.slice());
			return true;
		}
		if(targetArr[i].childArr.length > 0) 
		{
			var res = this._setOwnerChild(owner, targetArr[i].childArr);
			if(res) return res;
		}
	}
};

//트리탐색은 for문이 겹쳐서 매번 탭마다 부하를 줄이기 위해
//빠른탐색 배열을 최초1회 만들어둔다.
TabKeyController.prototype.makeTabIndexArr = function()
{	
	this.tabIndexArr = [];
	this._makeArray(this.componentMap);
	this._isMakeArr = true;
};

TabKeyController.prototype._makeArray = function(arr)
{
	for(var i=0;i<arr.length;i++)
	{
		if(arr[i].childArr.length > 0) this._makeArray(arr[i].childArr);
		else this.tabIndexArr.push(arr[i].comp);
	}
};

//탭키이동이 가능한 컴포넌트인지 검사한다.
// tabindex가 -1이 아님
// 숨겨진 상태가 아님.
// enable false 상태가 아님.
// 탭키가 가능한 컴포넌트인가?
TabKeyController.prototype._checkTabValieComp = function(comp)
{
	if(!comp.isValid()) return false;
	
	if(comp.getAttr('tabindex') == -1) return false;
	
	if(!comp.isEnable) return false;
	
	if(!comp.isShow()) return false;
	
	if(!comp.isTabable) return false;
	
	return true;
};

