
/**
 *	AView 를 상속받아 새로운 컴포넌트를 생성하는 예
 */
function APivotGrid()
{
	AView.call(this);

	//TODO:edit here
	
	//	자신이 포함되어져 있는 프레임웍 이름을 지정합니다.
	this.frwName = 'afc';

}
afc.extendsClass(APivotGrid, AView);

APivotGrid.prototype.init = function(context, evtListener)
{
	AView.prototype.init.call(this, context, evtListener);

	var childComps = this.getChildren();
	this.scrollView = childComps[0];
	this.scrollGrid = this.scrollView.getChildren()[0];
	this.pivotGrid = childComps[1];
	
	//매핑타입을 3으로 지정하여 AView 의 ChildMapping 처럼 처리되게 한다.
	this.pivotGrid.mappingType = this.scrollGrid.mappingType = 3;
	this._setChildQueryInfo();
	
	this.setOption(
	{
		isHideHeader : this.getAttr('data-hide-header'),			//헤더를 숨길지
		isSingleSelect : this.getAttr('data-single-select'),		//ctrl 키를 누르고 선택해도 하나만 선택된다. 
		isFullRowSelect : this.getAttr('data-fullrow-select'),	
		isSelectable : this.getAttr('data-selectable'),				//선택 [불]가능 옵션 플래그
		isSortable : this.getAttr('data-sortable'),					//헤더 선택시 정렬처리 여부
		isColumnResize : this.getAttr('data-column-resize'),
		
	}, true);
	
	//개발인 경우는 작동되지 않도록
	if(this.isDev()) this.option.isColumnResize = false;
	
	// 런타임
	else
	{
		//개발중에는 선택 이벤트를 수정하지 않는다.
		//두 개의 그리드의 selectCell 함수 변경
		this._setAllGridSelect();
		
		//EXPivotVIew-Style 안의 pivotGrid, scrollGrid, scrollView의 스크롤바를 display: none; 처리를 했기 떄문에 스크롤 영역 체크하지 않게 처리한다.
		//this.addClass('EXPivotView-Style');
		
		this.pivotGrid.isCheckScrl = false;
		this.scrollGrid.isCheckScrl = false;
		
		//height auto 가 동작하기 위해 구성요소를 relative 로 변경해 준다.
		if(!this.element.style.height || this.element.style.height=='auto')
		{
			this.pivotGrid.$ele.css('position','relative');
			this.scrollGrid.$ele.css('position','relative');
		}
	}
	
	this.nameKeyArr = this.scrollGrid.nameKeyArr.slice();
	this.nameKeyArr = this.nameKeyArr.concat(this.pivotGrid.nameKeyArr);

	//옵션 정보를 실제 자식 그리드에 적용해 준다.
	this._applyOptionToChild();
	
	this.pivotGrid.addEventListener('select', this, '_onGridSelect');
	this.pivotGrid.addEventListener('dblclick', this, '_onGridDblclick');

	this.scrollGrid.addEventListener('select', this, '_onGridSelect');
	this.scrollGrid.addEventListener('dblclick', this, '_onGridDblclick');
	
	this.scrollGrid.scrollArea.css('overflow-y', 'visible');	//or hidden

	//스크롤 속도를 개선한 피봇 그리드 확장 클래스(APivotGridEx) 인 경우는 기본 스크롤을 사용한다.
	if(this.className!='APivotGridEx')
	{
		//height auto 인 경우는 상위 view 의 기본 스크롤이 작동하기 때문에 ScrollManager 를 사용하지 않는다.
		if(this.element.style.height && this.element.style.height!='auto')
		{
			this.pivotGrid.addEventListener('scroll', this, '_onGridScroll');
			this.pivotGrid.addEventListener('scrolltop', this, '_onGridScrollTop');
			this.pivotGrid.addEventListener('scrollbottom', this, '_onGridScrollBottom');
		
			this.pivotGrid.enableScrlManager(null, this.scrollGrid.scrollArea[0]);
			this.scrollGrid.enableScrlManager(this.pivotGrid.scrollArea[0], null);
			this.scrollView.enableScrlManagerX();

			this.scrollView.scrlManagerX.addDisableManager(this.scrollGrid.scrlManager);
			this.scrollGrid.scrlManager.addDisableManager(this.scrollView.scrlManagerX);	
		}
	}
	
	
	if(afc.isScrollIndicator) this.enableScrollIndicator();
};

APivotGrid.prototype._qryLoadDone = function(aquery)
{
	AView.prototype._qryLoadDone.call(this, aquery);
	
	this._setChildQueryInfo(aquery);
};

//pivot scroll 그리드에 매핑정보를 전달하는 함수
//로드시점에 pivotGrid 즉 하위 컴포넌트가 초기화되기 전인 경우에는 무시한다.
//현재 컴포넌트의 init 시점에도 호출하여 지금까지 로드된 매핑정보를 전달한다.
APivotGrid.prototype._setChildQueryInfo = function(aquery)
{
	if(this.pivotGrid)
	{
		var thisObj = this, qryName;
		var dataKeyArr, pivotGridMappingCnt = this.pivotGrid.getMappingCount().length;
		
		if(aquery)
		{
			qryName = aquery.getName();
			_set_query_helper(qryName, this.dataKeyMap[qryName]);
		}
		else
		{
			for(qryName in this.dataKeyMap)
			{
				if(this.dataKeyMap[qryName])
				{
					_set_query_helper(qryName, this.dataKeyMap[qryName]);
				}
			}
		}
	}
	
	function _set_query_helper(qryName, qryDataKeyMap)
	{
		for(var blockName in qryDataKeyMap)
		{
			dataKeyArr = qryDataKeyMap[blockName];
			thisObj.pivotGrid.setQueryInfo(qryName, blockName, dataKeyArr.slice(0, pivotGridMappingCnt));
			thisObj.scrollGrid.setQueryInfo(qryName, blockName, dataKeyArr.slice(pivotGridMappingCnt));
		}
	}
};

APivotGrid.prototype.getPivotGrid = function()
{
	return this.pivotGrid;
};

APivotGrid.prototype._applyOptionToChild = function()
{
	this.scrollGrid.setOption(this.option);

	//데이터 그리드는 무조건 로우템플릿을 제거하므로 
	if(!this.isDev()) 
	{
		this.removeAll();
	}

	this.pivotGrid.setOption(this.option);
	
	if(this.option.isColumnResize)
	{
		this.scrollGrid.columnResizable();
		this.pivotGrid.columnResizable();
	}
	
	if(this.option.isHideHeader) this.hideHeader();	
};

APivotGrid.prototype.setMainGridWidth = function(width)
{
	this.scrollGrid.setStyle('width', width);
};

APivotGrid.prototype.getMainGridWidth = function()
{
	return this.scrollGrid.getStyle('width');
};

APivotGrid.prototype.setPivotGridWidth = function(width)
{
	this.pivotGrid.setStyle('width', width);
	
	this.scrollView.posUtil.setPos('left', width);
	this.scrollView.posUtil.setStretchValue('left', width);
};

APivotGrid.prototype.getPivotGridWidth = function()
{
	return this.pivotGrid.getStyle('width');
};

APivotGrid.prototype._getDataStyleObj = function()
{
	return this.scrollGrid._getDataStyleObj();
};

// object 형식의 css class 값을 컴포넌트에 셋팅한다.
// default style 값만 셋팅한다.
APivotGrid.prototype._setDataStyleObj = function(styleObj)
{
	this.scrollGrid._setDataStyleObj(styleObj);
	this.pivotGrid._setDataStyleObj(styleObj);
};

// 매핑가능한 개수를 리턴한다.
APivotGrid.prototype.getMappingCount = function()
{
	var mappingArr = this.scrollGrid.getMappingCount();
	
	var pMappingArr = this.pivotGrid.getMappingCount();
	//pMappingArr[0] = 'P ' + pMappingArr[0];
	mappingArr = pMappingArr.concat(mappingArr);
	
	return mappingArr;
};

APivotGrid.prototype.showHeader = function()
{
	this.pivotGrid.showHeader();
	this.scrollGrid.showHeader();
};

APivotGrid.prototype.hideHeader = function()
{
	this.pivotGrid.hideHeader();
	this.scrollGrid.hideHeader();
};

APivotGrid.prototype.enableScrollIndicator = function()
{
	var thisObj = this;
	
	//자동으로 생성된 pivotGrid 의 스크롤 인디케이터는 제거하고
	this.pivotGrid.scrlIndicator.destroy();
	this.pivotGrid.scrlIndicator = null;
	
	//우측의 스크롤 그리드의 스크롤 인디케이터의 위치를 보정하기 위해...
	//callback 으로 필요한 시점에 호출된다.
	this.scrollGrid.scrlIndicator.resetScrollPos(function()
	{
		if(!thisObj.isValid() || !thisObj.scrollView.isValid()) return;
		//우측의 스크롤 그리드의 스크롤 인디케이터의 위치를 보정한다.
		var newLeft = thisObj.scrollView.getWidth() + thisObj.scrollView.element.scrollLeft - ScrollIndicator.scrlWidth;
		
		// 'this' is scrollIndicator
		this.setStyle({left: newLeft+'px', right:''});
	});
	
	//상하 스크롤은 하지 않으므로 제거
	if(this.scrollView.scrlIndicatorY)
	{
		this.scrollView.scrlIndicatorY.destroy();
		this.scrollView.scrlIndicatorY = null;
	
	}
	
	//scrollView 의 스크롤이 발생하면 scrollGrid 의 ScrollIndicator 같이 움직이는 현상을 방지한다.
	this.scrollView.element.addEventListener('scroll', function(e)
	{
		thisObj.scrollGrid.scrlIndicator.hide();
	});
	
};

//APivotGrid 가 스크롤 가능 영역에 추가되어져 있을 경우
//APivotGrid 스크롤이 끝나고(ex, scrollBottom) 상위 스크롤이 연속적으로 발생되도록 하려면
//상위 스크롤은 enableScrlManager 가 호출되어져야 하고 자신은 overscrollBehavior 함수를 호출해야 한다.
APivotGrid.prototype.overscrollBehavior = function(disableScrlManager)
{
	this.pivotGrid.overscrollBehavior(disableScrlManager);
	this.scrollGrid.overscrollBehavior(disableScrlManager);
};

//------------------------------------------------------------------------------------------

APivotGrid.prototype.lockScrollView = function()
{
	this.scrollView.scrlManagerX.removeAllDisableManager();
	this.scrollGrid.scrlManager.removeAllDisableManager();
	this.scrollView.scrlManagerX.enableScroll(false);
};

APivotGrid.prototype.unlockScrollView = function()
{
	this.scrollView.scrlManagerX.addDisableManager(this.scrollGrid.scrlManager);
	this.scrollGrid.scrlManager.addDisableManager(this.scrollView.scrlManagerX);
	this.scrollView.scrlManagerX.enableScroll(true);
};


APivotGrid.prototype.scrollViewLeft = function()
{
	this.scrollView.element.scrollLeft = this.scrollGrid.getWidth();
};

APivotGrid.prototype.setData = function(pivotData, scrollData)
{
	this.pivotGrid.setData(pivotData);
	this.scrollGrid.setData(scrollData);
};

//하나의 row 를 추가한다.
APivotGrid.prototype.addRow = function(pivotData, scrollData)
{
	var row1 = this.pivotGrid.addRow(pivotData),
		row2 = this.scrollGrid.addRow(scrollData);

	//this._heightSync(row1, row2);

	return [row1, row2];
};


//데이터가 많은 경우 addRow 를 여러번 호출하는 것보다
//addRows 로 한번에 추가하는 것이 성능적으로 유리하다. 
APivotGrid.prototype.addRows = function(pivotInfoArr2, scrollInfoArr2, pivotRowData2, scrollRowData2)
{
	var ret1 = this.pivotGrid.addRows(pivotInfoArr2, pivotRowData2),
		ret2 = this.scrollGrid.addRows(scrollInfoArr2, scrollRowData2);
	
	return [ret1, ret2];
};

APivotGrid.prototype.prependRow = function(pivotData, scrollData)
{
	var row1 = this.pivotGrid.prependRow(pivotData),
		row2 = this.scrollGrid.prependRow(scrollData);
		
	//this._heightSync(row1, row2);

	return [row1, row2];
};

APivotGrid.prototype.setRow = function(rowInx, pivotData, scrollData, start, end)
{
	var row1 = this.pivotGrid.setRow(rowInx, pivotData, start, end);
	var row2 = this.scrollGrid.setRow(rowInx, scrollData, start, end);
	
	//this._heightSync(row1, row2);
	
	return [row1, row2];
};

//row가 여러줄 일 경우 다 같이 높이가 변한다.
/*
APivotGrid.prototype._heightSync = function(row1, row2)
{
	//height() 함수 호출이, 시간 소요가 크다.
	var h1 = row1.height(), h2 = row2.height();

	//컨텐츠에 따라 두 row 의 높이가 달라진 경우 높이를 맞춰준다. 대부분 같으므로 아래와 같이 처리하는 것이 성능에 유리
	if(h1!=h2)
	{
		var h = Math.max(h1, h2);
		row1.height(h);
		row2.height(h);
		
		//cell 의 높이를 직접 셋팅한 경우는 작동하지 않는지 테스트 필요, 안되면 다음과 같이
		//row1.children().height(h);
		//row2.children().height(h);
	}
};
*/

APivotGrid.prototype.removeRow = function(rowIdx)
{
	this.pivotGrid.removeRow(rowIdx);
	this.scrollGrid.removeRow(rowIdx);
};

APivotGrid.prototype.removeFirst = function()
{
	this.pivotGrid.removeFirst();
	this.scrollGrid.removeFirst();
};

APivotGrid.prototype.removeLast = function()
{
	this.pivotGrid.removeLast();
	this.scrollGrid.removeLast();
};

// 오작동으로 인해 주석처리, 필요하다면 hide, show override 처리
/*
APivotGrid.prototype.show = function(showType)
{
	this.pivotGrid.show(showType);
	this.scrollGrid.show(showType);

	//AView.prototype.show.call(this, showType);
};
*/

APivotGrid.prototype.removeAll = function()
{
	this.pivotGrid.removeAll();
	this.scrollGrid.removeAll();
};

APivotGrid.prototype.createBackup = function(maxRow, restoreCount)
{
	this.pivotGrid.createBackup(maxRow, restoreCount);
	this.scrollGrid.createBackup(maxRow, restoreCount);
};

APivotGrid.prototype.destroyBackup = function()
{
	this.pivotGrid.destroyBackup();
	this.scrollGrid.destroyBackup();
};

//추가되는 순간 화면에 표시되지 않고 바로 백업되도록 한다. append 인 경우만 유효
APivotGrid.prototype.setDirectBackup = function(isDirect)
{
	this.pivotGrid.setDirectBackup(isDirect);
	this.scrollGrid.setDirectBackup(isDirect);
};

APivotGrid.prototype.applyBackupScroll = function()
{
	this.pivotGrid.applyBackupScroll();
	return this.scrollGrid.applyBackupScroll();
};

//isFullRowSelect 가 참이면 선택된 row 가 리턴된다.
APivotGrid.prototype.getSelectedCells = function()
{
    return [ this.pivotGrid.getSelectedCells(), this.scrollGrid.getSelectedCells() ];
};

//endInx 가 생략되면 1개 선택
APivotGrid.prototype.selectRows = function(startIdx, endIdx)
{
	this.pivotGrid.selectRows(startIdx, endIdx);
	this.scrollGrid.selectRows(startIdx, endIdx);
};

APivotGrid.prototype._setAllGridSelect = function()
{
	var self = this;
	
	//----------------------------------------------------------------
	//   select cell  
	//----------------------------------------------------------------

	//	isFullRowSelect 가 참이면 cellArr 은 tr element 의 array or jQuery 집합.
	//	rowSet 이 여러개인 경우 인 경우 여러개의 row 객체들을 가지고 있다.

	//	cellArr 는 element 를 담고 있는 배열이거나 jQuery 집합 객체이다.
	//	그룹지어야 할 cell 이나 row 들을 배열이나 jQuery 집합으로 모아서 넘긴다.

	//	※ 주의, cellArr 는 특정 cell 이나 row 를 그룹짓고 있는 배열이나 집합이므로 
	//	동등 비교를 할 경우 this.selectedCells[i][0] === cellArr[0] 과 같이 해야 함.
	//	그룹지어져 있는 경우 첫번째 원소의 주소만 비교하면 같은 그룹임
	
	self.pivotGrid.selectCell = self.scrollGrid.selectCell = function(cellArr, e)
	{
		AGrid.prototype.selectCell.call(this, cellArr, e);
		
		var selRow = cellArr[0];
		
		//fullrowselect 옵션이면 로우셋 전체를 얻어온다. 헤더가 아닌 경우
		if(self.option.isFullRowSelect && !selRow.isHeader)
		{
			var otherGrid = null;

			if(this===self.pivotGrid) otherGrid = self.scrollGrid;
			else otherGrid = self.pivotGrid;
		
			var inx = this.indexOfRow(selRow);
			//console.log(inx);
			
			AGrid.prototype.selectCell.call(otherGrid, otherGrid.getRowSet(inx), e);
		}
		
		
		/*
		var otherGrid = null;

		if(this===thisObj.pivotGrid) otherGrid = thisObj.scrollGrid;
		else otherGrid = thisObj.pivotGrid;
		
		//헤드부분은 무조건 셀이 넘어온다. 같은 셀을 넘겨주면 클리어처리
		if(cellArr[0].isHeader) otherGrid.clearSelected(); //AGrid.prototype.selectCell.call(otherGrid, cellArr, e);
		else
		{
			//var startIdx = this.indexOfRow(cellArr[0]),
			//	endIdx = this.indexOfRow(cellArr[cellArr.length-1]) + 1;

			//AGrid.prototype.selectCell.call(otherGrid, otherGrid.getRows(startIdx, endIdx), e);
		}
		*/
		
		
	};
	
};

APivotGrid.prototype._onGridSelect = function(acomp, info, e)
{
	if(this.aevent.selectBind)
	{
		this.reportEvent('select', info, e);
	}
};

APivotGrid.prototype._onGridScroll = function(acomp, info, e)
{
	if(this.aevent.scrollBind)
	{
		this.reportEvent('scroll', info, e);
	}
};

APivotGrid.prototype._onGridScrollTop = function(acomp, info, e)
{
	if(this.aevent.scrolltopBind)
	{
		this.reportEvent('scrolltop', info, e);
	}
};

APivotGrid.prototype._onGridScrollBottom = function(acomp, info, e)
{
	if(this.aevent.scrollbottomBind)
	{
		this.reportEvent('scrollbottom', info, e);
	}
};

APivotGrid.prototype._onGridDblclick = function(acomp, info, e)
{
	if(this.aevent.dblclickBind)
	{
		this.reportEvent('dblclick', info, e);
	}
};


APivotGrid.prototype.setScrollComp = function(acomp)
{
	if(acomp) acomp.setStyle('z-index', 3);
	this.pivotGrid.setScrollComp(acomp);
	this.scrollGrid.setScrollComp(acomp);
};

//-----------------------------------------------------
//	about scroll
APivotGrid.prototype.scrollTo = function(pos)
{
	this.pivotGrid.scrollTo(pos);
	this.scrollGrid.scrollTo(pos);
};

APivotGrid.prototype.scrollOffset = function(offset)
{
	this.pivotGrid.scrollOffset(offset);
	this.scrollGrid.scrollOffset(offset);
};

//row or rowIndex
APivotGrid.prototype.scrollIntoArea = function(row, isAlignTop)
{
	this.pivotGrid.scrollIntoArea(row, isAlignTop);
	this.scrollGrid.scrollIntoArea(row, isAlignTop);
};

APivotGrid.prototype.scrollToTop = function()
{
	this.pivotGrid.scrollToTop();
	this.scrollGrid.scrollToTop();
};

APivotGrid.prototype.scrollToBottom = function()
{
	this.pivotGrid.scrollToBottom();
	this.scrollGrid.scrollToBottom();
};

APivotGrid.prototype.scrollToCenter = function()
{
	this.pivotGrid.scrollToCenter();
	this.scrollGrid.scrollToCenter();
};

//------------------------------------------------

APivotGrid.prototype.setUpdateType = function(updateType)
{
	this.pivotGrid.setUpdateType(updateType);
	this.scrollGrid.setUpdateType(updateType);
};

APivotGrid.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	this.pivotGrid.updateChildMappingComp(dataArr, queryData);
	this.scrollGrid.updateChildMappingComp(dataArr, queryData);
};

APivotGrid.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
};


//------------------------------------------------------------------------------


APivotGrid.NAME = "APivotGrid";

//scrollbar span 에 \n 이나 스페이스가 있어야 세로 스크롤바가 정상 작동한다.
//그래야 줄 바꿈이 되는 듯.
//data-flag 0100 -> 두번째 플래그 셋팅은 noChildSelect
//레이아웃트리에 하위 컴포넌트가 표현되지 않으며 캔버스에서도 선택되지 않는다.
//드래그&드랍으로 컴포넌트를 추가할 수도 없다.
APivotGrid.CONTEXT = 
{
    tag: '<div class="APivotGrid-Style" data-base="APivotGrid" data-class="APivotGrid" data-flag="0100" data-selectable="true" data-fullrow-select="true" \
	style="width: 500px; height: 300px; position: absolute; left: 30px; top: 30px;" data-pivot-grid="true"> \
			<div class="AView-Style" data-base="AView" data-class="AView" \
				data-sgap-width="3" style="width: calc(70% - 0px); height: 100%; left: 30%; top: 0px; overflow: hidden; z-index: 0;">	\
				<div data-base="AGrid" data-class="AGrid" class="AGrid-Style" data-selectable="true" data-clear-rowtmpl="true" style="width: 200%; height: 100%; left: 0px; top: 0px;"> \
					<div class="grid-scroll-area" style="overflow-y: visible;">	\
					<table class="grid-body-table" align="center">	\
					<colgroup><col><col><col><col><col><col></colgroup>	\
					<thead align="center" class="head-prop" style="visibility: visible; display: table-header-group;"> \
					<tr height="22px"><td>col1</td><td>col2</td><td>col3</td><td>col4</td><td>col5</td><td>col6</td></tr></thead> \
					<tbody align="center" class="body-prop"> \
					<tr height="22px"><td>1,1</td><td>1,2</td><td>1,3</td><td>1,4</td><td>1,5</td><td>1,6</td></tr></tbody></table></div> \
					<table class="grid-header-table" align="center"><colgroup><col><col><col><col><col><col></colgroup>	\
					<thead align="center" class="head-prop" style="display: none;"><tr height="22px"> \
					<td>col1</td><td>col2</td><td>col3</td><td>col4</td><td>col5</td><td>col6</td></tr></thead></table></div></div> \
				<div data-base="AGrid" data-class="AGrid" data-fullrow-select="true" data-selectable="true" data-clear-rowtmpl="true" class="AGrid-Style" \
					style="width: 30%; height: 100%;"> \
					<div class="grid-scroll-area"><table class="grid-body-table" align="center"><colgroup><col><col><col></colgroup> \
					<thead align="center" class="head-prop" style="visibility: visible; display: table-header-group;"> \
					<tr height="22px"><td>col1</td><td>col2</td><td>col3</td></tr></thead> \
					<tbody align="center" class="body-prop"><tr height="22px"><td>1,1</td><td>1,2</td><td>1,3</td></tr></tbody></table></div> \
					<table class="grid-header-table" align="center"><colgroup><col><col><col></colgroup><thead align="center" class="head-prop" style="display: none;"> \
					<tr height="22px"><td>col1</td><td>col2</td><td>col3</td></tr></thead></table></div></div>',

    defStyle:
    {
        width:'500px', height:'300px'
    },

    events: [ 'select', 'dblclick', 'scroll', 'scrolltop', 'scrollbottom' ]
};

