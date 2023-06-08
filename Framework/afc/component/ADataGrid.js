


/**
* TODO:

* - 각 셀의 Drag & Drop 기능
* - 합계 그리드 
* - distinct
*/

// ==> 모바일에서 스크롤 매니저 작동 오류 - [완료]


function ADataGrid()
{
	AView.call(this);
	
	//-----------------------------------------------------------	
	//	data object format
	//	object = { text: 'abc', type:'check', select:true }
	
	this.dataArr2 = [];
	this.showArr2 = this.dataArr2;
	
	//-----------------------------------------------------------
	
	//보여지는 데이터의 시작 인덱스
	this.dataInx = 0;
	this.renderRowCnt = 0;
	
	this.startCol = 0;
	this.endCol = 0;
	
	this.sortInfo = [];
	this.sortColInx = -1;
	
	this.selObjs = [];
	
	//리얼 관련
	this.realMap = null;
	this.realField = null;
}
afc.extendsClass(ADataGrid, AView);


ADataGrid.prototype.init = function(context, evtListener)
{
	AView.prototype.init.call(this, context, evtListener);
	
	var childComps = this.getChildren();
	this.scrlView = childComps[0];
	this.grid = this.scrlView.getChildren()[0];
	this.scrollBarV = childComps[1];
	this.scrollBarH = childComps[2];
	
	this.setOption(
	{
		isHideHeader : this.getAttr('data-hide-header'),			//헤더를 숨길지
		isSingleSelect : this.getAttr('data-single-select'),		//ctrl 키를 누르고 선택해도 하나만 선택된다. 
		isFullRowSelect : this.getAttr('data-fullrow-select'),		//특정 cell 을 클릭해도 그 row 전체가 선택된다.
		isSelectable : this.getAttr('data-selectable'),				//선택 [불]가능 옵션 플래그
		isSortable : this.getAttr('data-sortable'),					//헤더 선택시 정렬처리 여부
		isColumnResize : this.getAttr('data-column-resize'),
		
		isPivotGrid: this.getAttr('data-pivot-grid'),
		isHideHScrollbar: this.getAttr('data-hide-hscrollbar'),
		
	}, true);
	
	//개발인 경우는 작동되지 않도록
	if(this.isDev()) 
		this.option.isColumnResize = false;
	
	this.nameKeyArr = this.grid.nameKeyArr.slice();
	if(this.option.isPivotGrid) 
	{
		this.pivotGrid = childComps[3];
		this.nameKeyArr = this.nameKeyArr.concat(this.pivotGrid.nameKeyArr);
	}
	
	if(afc.isMobile)
	{
		this.scrlView.setWidth('calc(100% - ' + this.scrlView.getPos().left + 'px)');
		this.scrlView.setHeight('100%');
		
		this.scrollBarV.setHeight('100%');
		this.scrollBarH.setWidth('100%');
		
		if(this.pivotGrid) this.pivotGrid.setHeight('100%');
		
		//모바일을 위한 자체 스크롤 활성화
		this.enableScrlManagerY();
		
		this.enableScrlManagerX();
	}
	

	//옵션 정보를 실제 자식 그리드에 적용해 준다.
	this._applyOptionToChild();
	
	for(var i=0; i<this.grid.columnCount; i++)
	{
		this.sortInfo.push({order:1});		//정렬 오름차순 1, 내림차순 -1
	}
	
	if(this.pivotGrid) this.scrollBarV.addWheelArea(this.pivotGrid.element);
	
	this.scrollBarV.addWheelArea(this.grid.element);

	this.scrollBarV.addEventListener('scroll', this, '_onScrollY');
	this.scrollBarH.addEventListener('scroll', this, '_onScrollX');
	
	if(this.pivotGrid) 
	{
		this.pivotGrid.addEventListener('select', this, '_onGridSelect');
		this.pivotGrid.addEventListener('dblclick', this, '_onGridDblclick');
	}
	
	this.grid.addEventListener('select', this, '_onGridSelect');
	this.grid.addEventListener('dblclick', this, '_onGridDblclick');
	
	this.grid.scrollArea.css('overflow-y', 'visible');	//or hidden
	
	
	//scrollGap : 하나의 데이터를 표현할 영역의 넓이... 보통 그리드에서 로우
	//scrollPadding : 스크롤 영역에서 제외할 상단 영역.. 보통 그리드에서 헤더
	this.scrollBarV.setScrollArea(this.grid.scrollArea.height(), this.grid.hRowTmplHeight, this.grid.rowTmplHeight, true);	//scrlAreaHeight, scrollPadding, scrollGap
	

	//각각의 컴포넌트 내부에서 해 주므로 추가로 호출할 필요 없음
	//if(afc.isScrollIndicator) this.enableScrollIndicator();
};

//임의로 활성화 시킬 경우 호출
ADataGrid.prototype.enableScrollIndicator = function()
{
	this.scrlView._enableScrollIndicatorX();
	this.scrollBarV.enableScrollIndicator();
};

ADataGrid.prototype._applyOptionToChild = function()
{
	this.grid.setOption(this.option);

	//그리드의 fullRowSelect 가 작동되지 않도록
	//데이터그리드는 자체적으로 처리한다.
	this.grid.option.isFullRowSelect = false;
	

	//데이터 그리드는 무조건 로우템플릿을 제거하므로 
	if(!this.isDev()) this.grid.removeAll();

	if(this.option.isPivotGrid)
	{
		this.pivotGrid.setOption(this.option);
		this.pivotGrid.option.isFullRowSelect = false;
	
		if(!this.isDev()) this.pivotGrid.removeAll();
	}
	
	if(this.option.isColumnResize)
	{
		this.grid.columnResizable();
		if(this.option.isPivotGrid) this.pivotGrid.columnResizable();
	}
};

ADataGrid.prototype.updatePosition = function(width, height)
{
	AView.prototype.updatePosition.call(this, width, height);

    var scrlSize = this.grid.scrollArea.height();
	
    if(scrlSize)
	    this.scrollBarV.setScrollArea(scrlSize, this.grid.hRowTmplHeight, this.grid.rowTmplHeight, true);
	
	var pivotAdd = 0;
	
	if(this.pivotGrid) pivotAdd = this.pivotGrid.getWidth();
	
    scrlSize = this.scrlView.$ele.width();
    if(scrlSize)
    {
        this.scrollBarH.setScrollArea(scrlSize, 0, 1);
        this.scrollBarH.setDataCount(this.grid.$ele.width()+pivotAdd);
    }
	
	if(!this.isDev())
	{
		this._resetInitRow(true);
		this.renderData();
	}
};

//좌우 스크롤시 보여지는 컬럼만 갱신하기 위해 startCol 과 endCol 의 값을 구한다.
ADataGrid.prototype.checkColPos = function()
{
	var chkStart = this.scrlView.element.scrollLeft, 
		chkEnd = chkStart + this.scrlView.element.clientWidth - 17;
	
	var $cells = $(this.grid.getRow(0)).children();
	var end = $cells.length, sum = 0, i = 0;
	
	
	for(; i<end; i++)
	{
		sum += $cells.get(i).offsetWidth;
		
		if(sum>chkStart) 
		{
			this.startCol = i++;
			break;
		}
	}
	
	for(; i<end; i++)
	{
		sum += $cells.get(i).offsetWidth;
		
		if(sum>chkEnd || i+1 == end) 
		{
			this.endCol = i;
			break;
		}
	}
		
	//console.log(this.startCol + ', ' + this.endCol);
};

ADataGrid.prototype.resetColPos = function()
{
	this.startCol = 0;
	this.endCol = this.grid.getColumnCount() - 1;
};


ADataGrid.prototype.clearSelected = function()
{
	//기존에 선택되어져 있는 선택정보를 지운다. 원본 obj 의 원소가 지워지는 것이 아니므로
	for(var i=0; i<this.selObjs.length; i++)
	{
		this.selObjs[i].select = undefined;
		this.selObjs[i].parentDataArr = undefined;
	}

	this.selObjs.length = 0;
};

ADataGrid.prototype.addSelectObj = function(selObj, existCheck)
{
	if(existCheck)
	{
		//기존에 원소가 존재하면 지우고 추가 실패이므로 return false
		if(this.removeSelectObj(selObj)>-1) return;
	}
	
	selObj.select = true;
	
	this.selObjs.push(selObj);
};

//selObj 가 존재하지 않으면 -1 리턴
ADataGrid.prototype.removeSelectObj = function(selObj)
{
	var inx = this.selObjs.indexOf(selObj);
	
	if(inx>-1) 
	{
		selObj.select = undefined;
		selObj.parentDataArr = undefined;
		
		this.selObjs.splice(inx, 1);
	}
	
	return inx;
};

ADataGrid.prototype._onGridSelect = function(acomp, info, e)
{
	var evtObj = this._gridClickManage(acomp, info, e);

	if(this.aevent.selectBind)
	{
		if(evtObj) this.reportEvent('select', evtObj, e);
	}
};

ADataGrid.prototype._onGridDblclick = function(acomp, info, e)
{
	if(this.aevent.dblclickBind)
	{
		var evtObj = this._gridClickManage(acomp, info, e);
		
		if(evtObj) this.reportEvent('dblclick', evtObj, e);
	}
};

ADataGrid.prototype._gridClickManage = function(acomp, info, e)
{
	var cell = info[0], evtObj = {}, addVal = 0;
	
	evtObj.isHeader = cell.isHeader;
	
	if(this.pivotGrid && acomp===this.grid)	//피봇그리드가 존재하면서 스크롤 그리드의 셀을 선택한 경우
		addVal = this.pivotGrid.columnCount;

	var pos = acomp.indexOfCell(cell),
		rowInx = this.dataInx + pos[0],
		colInx = addVal + pos[1],
		parentDataArr = this.showArr2[rowInx];
	
	//헤더를 클릭한 경우
	if(cell.isHeader)
	{
		//colInx = acomp.colIndexOfCell(cell) + addVal;
		
		evtObj.rowInx = 0;
		evtObj.colInx = colInx;
		
		if(this.sortColInx==colInx) 
		{
			this.sortInfo[colInx].order *= -1;
		}
		
		//정렬 컬럼이 바뀌면 
		else 
		{
			//이전 컬럼의 정렬 정보를 초기화
			if(this.sortColInx>-1)
			{
				this.sortInfo[this.sortColInx].order = 1;	//정렬 오름차순 1, 내림차순 -1
			
				this.sortImg.remove();
				this.sortImg = null;
			}
		
			this.sortColInx = colInx;
		}
		
		var sortImgName = this.sortInfo[colInx].order == 1? 'sort_up':'sort_down';
		// sort Image 변경
		if(this.sortImg) this.sortImg.attr('src', 'Framework/afc/image/' + sortImgName + '.png');
		else
		{
			this.sortImg = $('<img src="Framework/afc/image/' + sortImgName + '.png" style="vertical-align: middle; margin-left: 5px; margin-right: -21px"></img>');
			$(cell).append(this.sortImg);
		}
		
		this.sortColumn(this.sortColInx);
	}
	
	//body cell 을 클릭한 경우
	else
	{
		var isClear = (this.option.isSingleSelect || !e.ctrlKey);	//싱글 셀렉트가 아니고 컨트롤키가 눌리면 
		
		if(isClear) this.clearSelected();

		var obj;
			
		evtObj.rowInx = rowInx;
		evtObj.colInx = colInx;

		if(this.option.isFullRowSelect) 
		{
			var colCnt = this.grid.columnCount;
			
			if(this.pivotGrid) colCnt += this.pivotGrid.columnCount;
			
			for(var i=0; i<colCnt; i++)
			{
				obj = parentDataArr[i];
				
				if(obj)
				{
					obj.parentDataArr = parentDataArr;

					this.addSelectObj(obj, !isClear);

					//클릭한 셀만 체크
					if(i==colInx)
					{
						//type은 checkbox 또는 radio 임
						if(obj.type) obj.checked = !obj.checked;
					}
				}
			}
			
			evtObj.selObj = parentDataArr;
		}
		else
		{
			obj = parentDataArr[colInx];
			
			if(obj)
			{
				//향후에 obj 만으로 자신의 배열상의 인덱스를 얻기 위해 저장해 둠.
				obj.parentDataArr = parentDataArr;

				this.addSelectObj(obj, !isClear);

				evtObj.selObj = obj;

				//type은 checkbox 또는 radio 임
				if(obj.type) obj.checked = !obj.checked;
			}
		}
		
		this.renderData();
	}
	
	return evtObj;
};

ADataGrid.prototype._onScrollX = function(acomp, info, e)
{
	this.scrlView.element.scrollLeft = info;
	
	if(!this.isScrollingX) 
	{
		this.isScrollingX = true;
		this.isScrollingY = false;
		
		//좌우스크롤이 시작되는 시점에 초기화하고 화면 갱신
		this.resetColPos();
		this._resetInitRow(true);
		this.renderData();
	}
	
	
};

ADataGrid.prototype._onScrollY = function(acomp, info, e)
{
	//중간쯤 스크롤되어져 있다가 데이터를 모두 삭제하는 경우도 스크롤 이벤트 발생. 
	if(this.showArr2.length==0) return;
	
	var newInx = 0;
	
	if(this.scrollBarV.isScrollBottom()) 
	{
		newInx = this.showArr2.length - this.scrollBarV.getCountPerArea();
		
		// removeAll 되는 경우 스크롤이벤트가 발생한다.
		// 그 때 위의 dataInx 구하는 방식으로는 음수가 나오게 되므로 최소값인 0으로 세팅한다.
		if(newInx < 0) newInx = 0;
		
		if(this.aevent.scrollbottomBind)
			this.reportEvent('scrollbottom', null, e);	
	}
	else 
	{
		if(this.aevent.scrolltopBind && this.scrollBarV.isScrollTop()) this.reportEvent('scrolltop', null, e);
		
		newInx = Math.floor(info/this.grid.rowTmplHeight);
	}
	
	//값이 달라진 경우만 렌더링 되도록
	if(newInx != this.dataInx) 
	{
		this.dataInx = newInx;
		
		if(!this.isScrollingY) 
		{
			this.isScrollingY = true;
			this.isScrollingX = false;

			//상하 스크롤이 시작되는 시점에 체크
			this.checkColPos();
		}
		
		// 셀에 추가된 스타일의 변경과 머지된 그리드의 스크롤을 위해 필요.
		this._resetInitRow(true);
		
		this.renderData();
	}
};

//	모든 row 를 지우고 현재의 데이터와 상황에 맞게 row 를 다시 추가한다.
ADataGrid.prototype._resetInitRow = function(isReset)
{
	var areaCnt = this.scrollBarV.getCountPerArea();
	var renderCnt = Math.min(areaCnt, this.showArr2.length);
	
	//화면이 안 보여지고 있는 경우는 -1이 리턴된다.
	if(areaCnt<0) return;
	
	//isReset 을 생략한 경우는 자동으로 계산해 준다.
	if(isReset==undefined) isReset = (this.showArr2.length<=areaCnt);
	
	if(isReset)
	{
		this.isScrollingX = false;
		this.isScrollingY = false;
	
		if(this.scrollMoveState)
		{
			// touchmove 이벤트 중에... element 가 제거되면 무브 이벤트가 중단되므로 
			// 최초 이동시에는 숨긴다.
			if(this.scrollMoveState==1)
			{
				if(this.pivotGrid) this.pivotGrid.tBody.children().hide();
				this.grid.tBody.children().hide();
			}
			else 
			{
				//계속해서 추가된 돔이 많아지면 성능이 저하되므로 무브 이벤트 이후에 추가된 로우는 제거한다.
				if(this.pivotGrid) this.pivotGrid.tBody.find(':visible').remove();
				this.grid.tBody.find(':visible').remove();
			}
		}
		
		var infoArr2 = [];
		infoArr2.length = renderCnt;

		for(var i=0; i<renderCnt; i++)
			infoArr2[i] = [];

		if(this.scrollMoveState)
		{
			this.scrollMoveState = 2;
		
			//새로 추가되는 로우가 숨겨진 로우 앞으로 와야 하므로 prepend 를 true 로 셋팅
			if(this.pivotGrid) this.pivotGrid.addRows(infoArr2, null, true);
			this.grid.addRows(infoArr2, null, true);
		}
		else
		{
			if(this.pivotGrid) this.pivotGrid.setRows(infoArr2);
			this.grid.setRows(infoArr2);
		}

		this.renderRowCnt = renderCnt;
		this.checkColPos();
	}

};


//현재의 index 및 offset 정보로 부터 데이터를 얻어와 그리드 셀의 각 값을 갱신한다.
//즉, 화면을 다시 그리는 일을 한다.
ADataGrid.prototype.renderData = function()
{
	var end = this.dataInx + this.renderRowCnt, 
		i = this.dataInx, j = 0;
		
	if(end>this.showArr2.length) end = this.showArr2.length;

	if(this.pivotGrid) this.pivotGrid.clearSelected();

	this.grid.clearSelected();

	var dataOffset = this.pivotGrid ? this.pivotGrid.columnCount : 0;
	
	for(; i<end; i++)
	{
		if(this.pivotGrid) this._setRowsByObj(this.pivotGrid, j, this.showArr2[i]);
		
		this._setRowsByObj(this.grid, j++, this.showArr2[i], this.startCol, this.endCol, dataOffset);
	}
};

ADataGrid.prototype.setDelegator = function(delegator)
{
	this.delegator = delegator;
};

ADataGrid.prototype._gridButtonClick = function(e)
{
	if(this.delegator && this.delegator.onDataGridBtnClick) 
	{
		this.delegator.onDataGridBtnClick(this, e.target, e);
	}
};

ADataGrid.prototype._gridCheckBoxClick = function(e)
{
	if(this.delegator && this.delegator.onDataGridChkClick) 
	{
		//이벤트가 발생한 checkbox 의 부모는 그리드의 셀(td) 이다.
		e.target.parentNode.dataObj.checked = e.target.checked;
		
		this.delegator.onDataGridChkClick(this, e.target, e);
	}
};

ADataGrid.prototype.enableScrlManagerY = function()
{
	if(this.scrlManagerY) return this.scrlManagerY;
	
	afc.loadScript("Framework/afc/library/ScrollManager.js");

	var thisObj = this;
	
	this.scrlManagerY = new ScrollManager();
	this.scrlManagerY.setOption({moveDelay: 5});
	
	this.scrlManagerY.setStopCallback(function()
	{
		//스크롤이 완료되면 값을 리셋한다.
		thisObj.scrollMoveState = 0;
	
		if(thisObj.pivotGrid) thisObj.pivotGrid.tBody.find(':hidden').remove();
		thisObj.grid.tBody.find(':hidden').remove();
	});
	
	this._scrollImplementY();
	
	return this.scrlManagerY;
};

ADataGrid.prototype.enableScrlManagerX = function()
{
	if(this.scrlManagerX) return this.scrlManagerX;
	
	afc.loadScript("Framework/afc/library/ScrollManager.js");

	var thisObj = this;
	
	this.scrlManagerX = new ScrollManager();
	this.scrlManagerX.setOption({moveDelay: 10});
	
	this._scrollImplementX();
	
	return this.scrlManagerX;
};


ADataGrid.prototype._scrollImplementY = function() 
{
	var thisObj = this,
		isDown = false,	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
		scrlArea = this.element;
		
	//--------------------------------------------------------
	//	scroll 그리드 
	
	//touch start
	AEvent.bindEvent(scrlArea, AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		thisObj.isScrollingY = false;
		thisObj.isScrollingX = false;
		
		thisObj.scrlManagerY.initScroll(e.changedTouches[0].clientY);
		
		//setStopCallback 에서 값 0 이 된 이후에 셋팅되도록 initScroll 함수 뒤에 호출해야 한다.
		thisObj.scrollMoveState = 1;
	});
	
	//touch move
	AEvent.bindEvent(scrlArea, AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown || thisObj.isScrollingX) return;
		
		e.preventDefault();
		
		thisObj.scrlManagerY.updateScroll(e.changedTouches[0].clientY, _scrlHelper);
	});
	
	//touch end
	AEvent.bindEvent(scrlArea, AEvent.ACTION_UP, function(e)
	{
		if(!isDown || thisObj.isScrollingX) return;
		isDown = false;
		
		thisObj.scrlManagerY.scrollCheck(e.changedTouches[0].clientY, _scrlHelper);
	});
	
	
	function _scrlHelper(move)
	{
		if(move==0) return true;
		
		thisObj.scrollBarV.offsetBarPos(move);
		
		return true;
	}
};

ADataGrid.prototype._scrollImplementX = function() 
{
	var thisObj = this,
		isDown = false,	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
		scrlArea = this.scrlView.element;
		
	//--------------------------------------------------------
	//	scroll 그리드 
	
	//touch start
	AEvent.bindEvent(scrlArea, AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		thisObj.isScrollingX = false;
		thisObj.isScrollingY = false;
		
		//e.preventDefault();
		
		thisObj.scrlManagerX.initScroll(e.changedTouches[0].clientX);
		
	});
	
	//touch move
	AEvent.bindEvent(scrlArea, AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown || thisObj.isScrollingY) return;
		
		e.preventDefault();
		
		thisObj.scrlManagerX.updateScroll(e.changedTouches[0].clientX, _scrlHelper);
	});
	
	//touch end
	AEvent.bindEvent(scrlArea, AEvent.ACTION_UP, function(e)
	{
		if(!isDown || thisObj.isScrollingY) return;
		isDown = false;
		
		//e.preventDefault();
		
		thisObj.scrlManagerX.scrollCheck(e.changedTouches[0].clientX, _scrlHelper);
	});
	
	
	function _scrlHelper(move)
	{
		if(move==0) return true;
		
		thisObj.scrollBarH.offsetBarPos(move);
		
		return true;
	}
};


//-----------------------------------------------------------------------------------
//	public functions

//showArr2 의 변화값을 스크롤바에 반영하고 그리드의 각 값도 갱신한다.
//isReset : 내부적으로만 사용, 화면 개발시점에 호출할 경우는 생략한다.
ADataGrid.prototype.updateDataGrid = function(isReset)
{
	this.scrollBarV.setDataCount(this.showArr2.length);
	
	//명시적으로 false 를 셋팅한 경우는 호출하지 않는다.
	if(isReset!=false) this._resetInitRow(isReset);
	
	this.renderData();
};

ADataGrid.prototype.getGridData = function()
{
	return this.dataArr2;
};

ADataGrid.prototype.getFilteredData = function()
{
	return this.showArr2;
};

//	dataArr2 is two dimension array that is composed of objects
//	object = { text: 'abc', type:'check', select:true }
//  updateType 0: update,init 1: noupdate,init 2:update,noinit
ADataGrid.prototype.setGridData = function(dataArr2, updateType, isFiltered)
{
	if(!isFiltered) this.dataArr2 = dataArr2;
	
	this.showArr2 = dataArr2;
	
	//원본 데이터가 사라지므로 데이터만 지워주면 됨.
	if(updateType != 2)
	{
		this.selObjs.length = 0;
		this.dataInx = 0;	
	}
	
	if(!isFiltered) this._maskGridData(dataArr2);
	
	// type이 sum인 경우 위의 항목을 다 더한다.
	//this.sum();
	
	if(updateType != 1) this.updateDataGrid(true);
};

//filterData 가 null 이면 필터를 해제한다.
ADataGrid.prototype._setFilteredData = function(filterData, updateType)
{
	if(filterData==null) this.setGridData(this.dataArr2, updateType, false);
	else this.setGridData(filterData, updateType, true);
};

ADataGrid.prototype.filter = function(filterFunc, updateType)
{
	var arr = this.dataArr2.filter(filterFunc);
	
	this._setFilteredData(arr, updateType);
};


ADataGrid.prototype.removeAllRowData = function(noUpdate)
{
	this.dataArr2.length = 0;
	
	//원본 데이터가 사라지므로 데이터만 지워주면 됨.
	this.selObjs.length = 0;
	this.dataInx = 0;
	
	if(!noUpdate) this.updateDataGrid();
};

ADataGrid.prototype._maskRowData = function(rowData)
{
	this._maskGridData([rowData]);
};

ADataGrid.prototype._maskGridData = function(gridData)
{
	var $tmplCells, dataObj, rowData,
		$pTmplCells = $(),
		pivotColCnt = 0,
		pivotGrid = this.getPivotGrid();

	if(pivotGrid)
	{
		pivotColCnt = pivotGrid.getColumnCount();
		$pTmplCells = pivotGrid.$rowTmpl.eq(0).children('td');
	}
	//차후 매번 호출되지 않도록 멤버 변수로 만들어 놓기
	//var $tmplCells = this.grid.$rowTmpl.eq(0).children('td'), dataObj;
	$tmplCells = this.grid.$rowTmpl.eq(0).children('td');
	
	for(var i=0; i<gridData.length; i++)
	{
		rowData = gridData[i];
		$pTmplCells.each(function(j) {
			if(this.dm)
			{
				dataObj = rowData[j];
				if(this.dm.maskFuncs[0] === ADataMask.DataGrid.dataType)
				{
					this.dm.mask(dataObj); //{ text: '' };
				}
				else
				{
					//dataObj.original = dataObj.text;
					//dataObj.text = this.dm.mask(dataObj.text);
					dataObj.maskdata = this.dm.mask(dataObj.text);
				}
				
				//dataObj = this.dm.mask(dataObj); { type:'checkbox', checked:dataObj.text};
			}
		});

		$tmplCells.each(function(j)	{
			if(this.dm)
			{
				dataObj = rowData[j + pivotColCnt];
				//dataObj.original = dataObj.text;
				//dataObj.text = this.dm.mask(dataObj.text);
				dataObj.maskdata = this.dm.mask(dataObj.text);
			}
		});
	}
};

/*
ADataGrid.prototype.sum = function()
{
	var rowData, sumRowData, sumColDataArr = [];
	for(var i=this.showArr2.length-1; i>-1; i--)
	{
		rowData = this.showArr2[i];
		for(var j=0; j<this.showArr2[i].length; j++)
		{
			if(this.showArr2[i][j].type == 'sum')
			{
				if(sumColDataArr[j]) this._maskCellData(i, j, sumColDataArr[j]);
				sumColDataArr[j] = rowData[j];
				sumColDataArr[j].text = 0;
				continue;
			}
			
			if(sumColDataArr[j])
			{
				//if(rowData[j].original) sumColDataArr[j].text += parseFloat(rowData[j].original);
				//else sumColDataArr[j].text += parseFloat(rowData[j].text);
				sumColDataArr[j].text += parseFloat(rowData[j].text);
			}
			
			if(i==0)
			{
				if(sumColDataArr[j]) this.maskCellData(i, j, sumColDataArr[j]);
			}
		}
	}
};
*/

ADataGrid.prototype.getMetaData = function(row)
{
	if(typeof(row)=="number") row = this.dataArr2[row];
	
	if(row) return row._data;
	else return null;
};

ADataGrid.prototype.setMetaData = function(row, metaData)
{
	if(typeof(row)=="number") row = this.dataArr2[row];
	
	if(row) row._data = metaData;
};


ADataGrid.prototype.insertRowData = function(rowInx, rowData, metaData, noUpdate)
{
	this._maskRowData(rowData);
	this.dataArr2.splice(rowInx, 0, rowData);
	
	if(metaData) rowData._data = metaData;

	// type이 sum인 경우 위의 항목을 다 더한다.
	//this.sum();
	
	if(!noUpdate) this.updateDataGrid();
};

ADataGrid.prototype.addRowData = function(rowData, metaData, noUpdate)
{
	this._maskRowData(rowData);
	this.dataArr2.push(rowData);
	
	if(metaData) rowData._data = metaData;

	// type이 sum인 경우 위의 항목을 다 더한다.
	//this.sum();
	
	if(!noUpdate) this.updateDataGrid();
};

//특정 row 의 전체 데이터를 덮어 쓴다.
ADataGrid.prototype.setRowData = function(rowInx, rowData, metaData, noUpdate)
{
	this._maskRowData(rowData);
	this.dataArr2[rowInx] = rowData;
	
	if(metaData) rowData._data = metaData;
	
	if(!noUpdate) this.updateDataGrid(false);
};

//this.mergeCellData 함수와 같은 작업을 로우의 전체 cell 에 수행한다.
ADataGrid.prototype.mergeRowData = function(rowInx, rowData, noUpdate)
{
	var curRowData = this.dataArr2[rowInx];
	
	for(var i=0; i<curRowData.length; i++)
		afc.mergeObject(curRowData[i], rowData[i]);
	
	if(!noUpdate) this.updateDataGrid(true);
};


ADataGrid.prototype.removeRowData = function(rowInx, noUpdate)
{
	if(typeof(rowInx)!="number") rowInx = this.dataArr2.indexOf(rowInx);

	this.dataArr2.splice(rowInx, 1);
	
	if(!noUpdate) this.updateDataGrid();
};

ADataGrid.prototype.getRowData = function(rowInx)
{
	return this.dataArr2[rowInx];
};

ADataGrid.prototype.getFilteredRowData = function(rowInx)
{
	return this.showArr2[rowInx];
};

ADataGrid.prototype._maskCellData = function(rowInx, colInx, cellData)
{
	var pivotColCnt = 0,
		pivotGrid = this.getPivotGrid();

	if(pivotGrid)
	{
		pivotColCnt = pivotGrid.getColumnCount();
		if(colInx < pivotColCnt)
		{
			_mask_func(pivotGrid.$rowTmpl.eq(0).children('td').get(colInx));
			return;
		}
	}
	
	_mask_func(this.grid.$rowTmpl.eq(0).children('td').get(colInx - pivotColCnt));
	
	function _mask_func(cell)
	{
		if(cell.dm)
		{
			if(cell.dm.maskFuncs[0] === ADataMask.DataGrid.dataType)
			{
				cellData.type = cell.dm.maskParams[0][0];
				cell.dm.mask(cellData); //{ text: '' };
			}
			else
			{
				//cellData.original = cellData.text;
				//cellData.text = cell.dm.mask(cellData.text);
				cellData.maskdata = cell.dm.mask(cellData.text);
			}
		}
	}
};

//특정 cell 의 데이터를 덮어 쓴다.
ADataGrid.prototype.setCellData = function(rowInx, colInx, cellData, noUpdate)
{
	this._maskCellData(rowInx, colInx, cellData);

	this.dataArr2[rowInx][colInx] = cellData;
	
	if(!noUpdate) this.updateDataGrid(false);
};

//특정 cell 의 기존 데이터와 새로운 데이터를 머지한다.
ADataGrid.prototype.mergeCellData = function(rowInx, colInx, cellData, noUpdate)
{
	var curData = this.dataArr2[rowInx][colInx];
	
	this._maskCellData(rowInx, colInx, cellData);
	
	afc.mergeObject(curData, cellData);
	
	if(!noUpdate) this.updateDataGrid(true);
};

ADataGrid.prototype.getCellData = function(rowInx, colInx)
{
	return this.dataArr2[rowInx][colInx];
};

ADataGrid.prototype.sortColumn = function(colInx)
{
	var order = this.sortInfo[colInx].order;
	
	this.showArr2.sort(function(a, b)
	{
		var textA = a[colInx].text;//.toUpperCase();
		var textB = b[colInx].text;//.toUpperCase();
		if (textA < textB) return -order;
		if (textA > textB) return order;
		return 0;
	});
	
	this.renderData();
};

//선택된 모든 object 들을 배열로 리턴한다. 
ADataGrid.prototype.getSelectedData = function()
{
	return this.selObjs;
};

//선택된 obj 가 포함된 부모 배열들을 배열로 리턴한다.
ADataGrid.prototype.getSelectedRowArrs = function()
{
	var retArr = [], parArr;
	
	for(var i=0; i<this.selObjs.length; i++)
	{
		parArr = this.selObjs[i].parentDataArr;
		
		if(retArr.indexOf(parArr)<0) 
		{
			retArr.push(parArr);
			
			if(this.option.isFullRowSelect) i += this.grid.columnCount - 1;
		}
	}
	
	return retArr;
};

// 데이터 목록 중 colInx 위치의 데이터가 checked 인 인덱스를 배열로 리턴하는 함수
ADataGrid.prototype.getCheckedIndices = function(colInx)
{
	var arr = [], obj;
	
	if(colInx == undefined) colInx = 0;
	
	for(var i=0; i<this.dataArr2.length; i++)
	{
		obj = this.dataArr2[i][colInx];
		
		if(obj && obj.checked)
		{
			arr.push(i);
		}
	}
	
	return arr;
};

//row array 의 인덱스를 리턴한다. row array 는 object 담고 있는 1차원 배열
ADataGrid.prototype.indexOfRowArr = function(rowArr)
{
	return this.dataArr2.indexOf(rowArr);
};

//object 가 위치한 row 의 index 를 리턴한다.
ADataGrid.prototype.rowIndexOfData = function(dataObj)
{
	if(dataObj.parentDataArr) return this.dataArr2.indexOf(dataObj.parentDataArr);
	else return -1;
};

//object 가 위치한 column 의 index 를 리턴한다.
ADataGrid.prototype.colIndexOfData = function(dataObj)
{
	if(dataObj.parentDataArr) return dataObj.parentDataArr.indexOf(dataObj);
	else return -1;
};


ADataGrid.prototype.setPivotGrid = function(grid)
{
	this.pivotGrid = grid;
	this.option.isPivotGrid = grid ? true : false;
};

ADataGrid.prototype.getPivotGrid = function()
{
	return this.pivotGrid;
};

ADataGrid.prototype.setPivotGridWidth = function(width)
{
	if(this.pivotGrid) 
	{
		this.pivotGrid.setSgapH(afc.scrlWidth+'px');
		this.pivotGrid.posUtil.setSize(width, 'calc(100% - ' + afc.scrlWidth + 'px)');
		this.pivotGrid.posUtil.setStretchValue('height', afc.scrlWidth+'px');

		this.scrlView.posUtil.setPos('left', width);
		this.scrlView.posUtil.setStretchValue('left', width);
	}
};

ADataGrid.prototype.getPivotGridWidth = function()
{
	if(!this.pivotGrid) return '';
	
	return this.pivotGrid.getStyle('width');
};


ADataGrid.prototype.setMainGridWidth = function(width)
{
	this.grid.setStyle('width', width);
};

ADataGrid.prototype.getMainGridWidth = function()
{
	return this.grid.getStyle('width');
};

ADataGrid.prototype._getDataStyleObj = function()
{
	return this.grid._getDataStyleObj();
};

// object 형식의 css class 값을 컴포넌트에 셋팅한다.
// default style 값만 셋팅한다.
ADataGrid.prototype._setDataStyleObj = function(styleObj)
{
	this.grid._setDataStyleObj(styleObj);
	
	if(this.pivotGrid) this.pivotGrid._setDataStyleObj(styleObj);
};

// 매핑가능한 개수를 리턴한다.
ADataGrid.prototype.getMappingCount = function()
{
	var mappingArr = this.grid.getMappingCount();
	if(this.pivotGrid)
	{
		var pMappingArr = this.pivotGrid.getMappingCount();
		//pMappingArr[0] = 'P ' + pMappingArr[0];
		mappingArr = pMappingArr.concat(mappingArr);
	}
	
	return mappingArr;
};

ADataGrid.prototype.setRealMap = function(realField)
{
	this.realField = realField;
	// this.realMap = null; 일 경우 addPattern 이 호출되기 전에 리얼이 수신되는 경우도 있다.
	this.realMap = {};
};

ADataGrid.prototype.getRealKey = function(data)
{
	return data[this.realField];
};

ADataGrid.prototype.setData = function(dataArr)
{
	//this.removeAll();

	var data, row, arr, i, j, keyArr;
	
	//조회하는 경우 기존의 맵 정보를 지운다.
	if(this.realField!=null) this.realMap = {};
	
	data = dataArr[0];
	if(data && Object.prototype.toString.call(data) == '[object Array]')
	{
		keyArr = [];
		for(i=0; i<data.length; i++) keyArr[i] = i;
		
		for(i=0; i<dataArr.length; i++)
		{
			data = dataArr[i];
			arr = new Array(keyArr.length);
			for(j=0; j<keyArr.length; j++)
			{
				arr[j] = { text: data[keyArr[j]] };
			}
			
			ADataMask.setQueryData(data, keyArr, dataArr);

			this.addRowData(arr, data.row_data, true);

			//리얼맵이 활성화 되어 있으면 조회 시점에 리얼맵을 만든다.
			if(this.realField!=null) this.realMap[this.getRealKey(data)] = row;
		}
	}
	else
	{
		keyArr = this.nameKeyArr;
		if(keyArr.length == 0) keyArr = Object.keys(data);
		for(i=0; i<dataArr.length; i++)
		{
			data = dataArr[i];
			arr = new Array(keyArr.length);

			//init 시점에 td 의 name으로 keyArr 을 만들어 놓기?
			for(j=0; j<keyArr.length; j++)
			{
				arr[j] = { text: data[keyArr[j]] };
			}

			ADataMask.setQueryData(data, keyArr, dataArr);

			this.addRowData(arr, data.row_data, true);

			//리얼맵이 활성화 되어 있으면 조회 시점에 리얼맵을 만든다.
			if(this.realField!=null) this.realMap[this.getRealKey(data)] = row;
		}
	}
	
	this.updateDataGrid();
};

ADataGrid.prototype.getData = function()
{
	return this.getGridData();
};

ADataGrid.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	if(!keyArr) return;
	
	if(queryData.isReal) 
	{
		var realType = queryData.aquery.getRealType();
		
		this.doRealPattern(dataArr, keyArr, queryData, realType);
	}
	else this.doAddPattern(dataArr, keyArr, queryData);
};

ADataGrid.prototype.doAddPattern = function(dataArr, keyArr, queryData)
{
	var i, j, data, arr, keyVal;
	
	//조회하는 경우 기존의 맵 정보를 지운다.
	if(this.realField!=null) this.realMap = {};
	
	for(i=0; i<dataArr.length; i++)
	{
		data = dataArr[i];
		arr = new Array(keyArr.length);

		for(j=0; j<keyArr.length; j++)
		{
			keyVal = keyArr[j];

			if(keyVal) arr[j] = { text: data[keyVal] };
		}
		
		ADataMask.setQueryData(data, keyArr, queryData);
		
		this.addRowData(arr, data.row_data, true);
		
		//리얼맵이 활성화 되어 있으면 조회 시점에 리얼맵을 만든다.
		if(this.realField!=null) 
		{
			this.realMap[this.getRealKey(data)] = arr;
		}
	}
	
	this.updateDataGrid();
};

ADataGrid.prototype.doRealPattern = function(dataArr, keyArr, queryData, realType)
{
	var data, keyVal, arr;
	data = dataArr[0];
	
	//update
	if(realType==0)
	{
		arr = this.realMap[this.getRealKey(data)];
		
		if(!arr) return;
		
		var cellData;
		for(var i=0; i<keyArr.length; i++)
		{
			keyVal = keyArr[i];

			if(keyVal) 
			{
				arr[i].text = data[keyVal];
			}
		}
		
		ADataMask.setQueryData(data, keyArr, queryData);
		
		this._maskRowData(arr);
		this.updateDataGrid(false);
	}
	
	else if(realType==2)
	{
		var realKey = this.getRealKey(data);
		
		arr = this.realMap[realKey];
		
		if(!arr) return;
		
		this.removeRowData(arr);
		
		delete this.realMap[realKey];
	}
	
	//insert
	else
	{
		arr = new Array(keyArr.length);
		for(var j=0; j<keyArr.length; j++)
		{
			keyVal = keyArr[j];
			if(keyVal) arr[j] = { text: data[keyVal] };
		}
		
		ADataMask.setQueryData(data, keyArr, queryData);
		
		//prepend
		if(realType==-1) this.insertRowData(0, arr, data.row_data);
		//append
		else if(realType==1) this.addRowData(arr, data.row_data);
		
		//리얼맵이 활성화 되어 있으면 추가 시점에 리얼맵을 셋팅해 준다.
		if(this.realField!=null) 
		{
			this.realMap[this.getRealKey(data)] = arr;
		}
	}
	
};

//rowData = [ {}, {}, ... ];
//{} --> { text: 'abc', type:'check', select:true, rowSpan:2 }
//{} --> { type:'sum', select:true, rowSpan:2 }

ADataGrid.prototype._setRowsByObj = function(grid, rowInx, rowData, start, end, dataOffset)
{
	var $cells = $(grid.getRow(rowInx)).children(), text;
	
	if(start==undefined) 
	{
		start = 0; 
		end = $cells.length - 1;
	}
	
	if(dataOffset==undefined) dataOffset = 0;
	
	var obj, cell;
	for(var i=start; i<=end; i++)
	{
		obj = rowData[i+dataOffset];
		
		if(!obj) continue;
		text = obj.maskdata || obj.text || ""; // || grid.$rowTmpl.children().eq(i).text();
		
		cell = $cells[i];
		
		cell.dataObj = obj;
		
		//이 코드가 들어가면 row, col 동시 머지가 안된다.
		//if(cell.style.display=='none') continue;
		
		if(obj.select) grid._addCell(cell);
		
		if(obj.type)
		{
			if(obj.type == 'button')
			{
				cell.innerHTML = '<button>' + text + '</button>';
				
				cell.children[0].addEventListener('click', this._gridButtonClick.bind(this));
			}
			
			else
			{
				if(obj.checked) cell.innerHTML = '<input type="' + obj.type + '" checked />';
				else cell.innerHTML = '<input type="' + obj.type + '"/>';
				
				cell.children[0].addEventListener('click', this._gridCheckBoxClick.bind(this));
			}
		}
		//else if(text != undefined) cell.textContent = text;
		else //if(text != undefined) 
		{
			cell.innerHTML = text;
			
			if(cell.shrinkInfo) AUtil.autoShrink(cell, cell.shrinkInfo);
		}
		
		if(obj.rowSpan)
		{
			grid.mergeRow(rowInx, i, obj.rowSpan);
		}
		
		if(obj.colSpan)
		{
			grid.mergeCol(rowInx, i, obj.colSpan);
			i += obj.colSpan - 1;
		}
		
		if(obj.style) cell.style.cssText += obj.style;
		if(obj.class) cell.classList.add(obj.class);
	}

};



//------------------------------------------------------------------------------


ADataGrid.NAME = "ADataGrid";

//scrollbar span 에 \n 이나 스페이스가 있어야 세로 스크롤바가 정상 작동한다.
//그래야 줄 바꿈이 되는 듯.
//data-flag 0100 -> 두번째 플래그 셋팅은 noChildSelect
//레이아웃트리에 하위 컴포넌트가 표현되지 않으며 캔버스에서도 선택되지 않는다.
//드래그&드랍으로 컴포넌트를 추가할 수도 없다.
ADataGrid.CONTEXT = 
{
    tag: '<div class="ADataGrid-Style" data-base="ADataGrid" data-class="ADataGrid" data-flag="0100"\
			data-selectable="true" data-fullrow-select="true">\
        <div class="AView-Style" data-base="AView" data-class="AView" data-sgap-height="1" data-sgap-width="1" data-stretch-height="true" data-stretch-width="true"\
		style="width: calc(100% - ' + afc.scrlWidth + 'px); height: calc(100% - ' + afc.scrlWidth + 'px); left: 0px; top: 0px; overflow: hidden; z-index: 0;">\
	<div data-base="AGrid" data-class="AGrid" class="AGrid-Style" data-selectable="true" style="width: 200%; height: 100%; left: 0px; top: 0px;">\
		<table class="grid-header-table" align="center">\
		<colgroup><col><col><col><col><col><col></colgroup>\
		<thead align="center" class="head-prop">\
			<tr height="22px">\
			<td>col1</td><td>col2</td><td>col3</td><td>col4</td><td>col5</td><td>col6</td>\
			</tr>\
		</thead>\
	</table>\
	<div class="grid-scroll-area">\
		<table class="grid-body-table" align="center">\
		<colgroup><col><col><col><col><col><col></colgroup>\
		<thead align="center" class="head-prop">\
		<tr height="22px">\
			<td>col1</td><td>col2</td><td>col3</td><td>col4</td><td>col5</td><td>col6</td>\
		</tr>\
		</thead>\
		<tbody align="center" class="body-prop">\
		<tr height="22px">\
			<td >1,1</td><td >1,2</td><td >1,3</td><td >1,4</td><td >1,5</td><td >1,6</td>\
		</tr>\
		</tbody>\
		</table>\
	</div></div></div>\
	<div class="AScrollBar-Style" data-base="AScrollBar" data-class="AScrollBar" data-scroll-type="vert" data-sgap-height="1" data-stretch-height="true"\
		style="width: ' + afc.scrlWidth + 'px; height: calc(100% - ' + afc.scrlWidth + 'px); overflow-y: scroll; position: absolute; right: 0px; top: 0px; overflow-x: hidden;">\
		<span style="width: 100%; height: 0px;"></span>\n<span style="width: 100%; height: 0px;"></span></div>\
	<div class="AScrollBar-Style" data-base="AScrollBar" data-class="AScrollBar" data-scroll-type="hori" data-sgap-width="1" data-stretch-width="true"\
		style="height: ' + afc.scrlWidth + 'px; overflow-x: scroll; width: calc(100% - ' + afc.scrlWidth + 'px); position: absolute; left: 0px; bottom: 0px; overflow-y: hidden;">\
		<span style="width: 830px; height: 100%;"></span>\n<span style="width: 830px; height: 100%;"></span></div></div>',

    defStyle:
    {
        width:'500px', height:'300px'
    },

    events: [ 'dblclick', 'longtab', 'select', 'scrolltop', 'scrollbottom' ]
};



