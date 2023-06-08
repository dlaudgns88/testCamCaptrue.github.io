class APainter {

	static ACTION_DOWN = APainter.isMobile() ? 'touchstart' : 'mousedown';
	static ACTION_MOVE = APainter.isMobile() ? 'touchmove' : 'mousemove';
	static ACTION_UP = APainter.isMobile() ? 'touchend' : 'mouseup';
	static ACTION_CANCEL = APainter.isMobile() ? 'touchcancel' : 'touchcancel';
	static ACTION_LEAVE = APainter.isMobile() ? 'touchcancel' : 'mouseleave';
  
  static isMobile()
  {
	if(navigator.userAgent) {
      return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    } else if(navigator.userAgentData) {
      return navigator.userAgentData.mobile;
    }
  }
  
  constructor(baseW, baseH)
  {
    this.targetView = null;
    
    this.paintView = null;
    
    this.drawCanvas = null;
    this.toolCanvas = null;
    this.mergeCanvas = null;
    
    this.drawCtx = null;
    this.toolCtx = null;
    this.mergeCtx = null;
    
    this.scale = 1;
    this.lineWidth = 3;
    this.eraseSize = 30;
    this.color = '#000';
    this.neonLineWidth = 10;
    this.neonColor = 'rgb(244, 203, 47)';
    
    this.tool = 'pen';
    this.isDrawing = false;
    this.isSingleTouch = true;
    this.drawInfo = null;
    
    this.isActive = false;
    
    this.baseW = baseW;
    this.baseH = baseH;
    
  }
  
  init()
  {
    this.paintView = this.createPaintView();
    
    this.mergeCanvas = this.createCanvas('A_mergeCanvas');
    this.mergeCtx = this.mergeCanvas.getContext('2d');
    this.mergeCanvas.style.pointerEvents = 'none';
    this.paintView.appendChild(this.mergeCanvas);
    
    this.drawCanvas = this.createCanvas('A_drawCanvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.paintView.appendChild(this.drawCanvas);
  
    this.drawCanvas.addEventListener(APainter.ACTION_DOWN, (e) => {this.onCanvasDown(e)}, false);
    this.drawCanvas.addEventListener(APainter.ACTION_MOVE, (e) => {this.onCanvasMove(e)}, false);
    this.drawCanvas.addEventListener(APainter.ACTION_UP, (e) => {this.onCanvasUp(e)}, false);
    this.drawCanvas.addEventListener(APainter.ACTION_CANCEL, (e) => {this.onCanvasUp(e)}, false);
  
    if(!APainter.isMobile()) {
      this.drawCanvas.addEventListener('mouseleave', (e) => {this.onCanvasUp(e)}, false);
    }
    
    this.toolCanvas = this.createCanvas('A_toolCanvas');
    this.toolCtx = this.toolCanvas.getContext('2d');
    this.toolCanvas.style.pointerEvents = 'none';
    this.paintView.appendChild(this.toolCanvas);
    
  }
  setActivePaint(targetView, isSend)
  {
    if(this.isActive) {
      console.error('deactive');
      this.setDeActivePaint(true);
      return;
    }
    this.init();
    
    this.isActive = true;
    
    this.setTargetView(targetView);
    
    // 서버통신
    // if(isSend) theApp.sendActivePainter();
    
  }
  
  setDeActivePaint(isSend)
  {
    this.clearAll(true);
    
    this.isActive = false;
    
    this.paintView.parentNode.removeChild(this.paintView);
    this.targetView = null;
    
  }
  setTargetView(targetView)
  {
    this.targetView = targetView;
    this.targetView.appendChild(this.paintView);
  }
 
  createPaintView()
  {
    const paintView = document.createElement('div');
    paintView.setAttribute('id', `A_paintView`);
    paintView.style.background = 'rgb(0, 0, 0, 0,)';
    paintView.style.width = '100%';
    paintView.style.height = '100%';
    paintView.style.left = '0px';
    paintView.style.top = '0px';
    paintView.style.position = 'absolute';
    paintView.style.zIndex = '3';
    
    return paintView;
  }
  
  createCanvas(canvasId)
  {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', canvasId);
  
    canvas.style.background = 'rgb(0, 0, 0, 0)';
    
    canvas.width = this.baseW;
    canvas.height = this.baseH;
    
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.left = '0px';
    canvas.style.top = '0px';
    canvas.style.position = 'absolute';
    
    return canvas;
  }
  
  clearAll(isReceive)
  {
    
    this.mergeCtx.clearRect(0, 0, this.mergeCanvas.width, this.mergeCanvas.height);
    
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    
    this.toolCtx.clearRect(0, 0, this.toolCanvas.width, this.toolCanvas.height);
    
    //서버통신
    //isReceive 사용
  }
  
  setOffsetPos(target)
  {
    const rect = target.parentNode.getBoundingClientRect();
    
    //스크롤된 위치
    const scrollToTop = rect.top + window.scrollY ;
    
    //절대좌표
    this.offsetPos = {
      x: rect.left,
      y: scrollToTop
    };
    
  }
  
  getRealPos(pos)
  {
    let rect = this.drawCanvas.getBoundingClientRect();
    
    let xScale = this.drawCanvas.width / rect.width;
    let yScale = this.drawCanvas.height / rect.height;
    
    return {
      x: pos.x * xScale,
      y: pos.y * yScale
    }
  }
  
  //TODO: 모바일 개발 필요
  getPos(e)
  {
    return this.getRealPos({
      x: e.offsetX,
      y: e.offsetY
    }, e.target)
  }
  
  // getDrawCanvases(pageNum)
  // {
  //   let idx = pageNum - 1;
  //   return {
  //     mergeCanvas: this.mergeCanvasArr[idx],
  //     drawCanvas: this.drawCanvasArr[idx],
  //     toolCanvas: this.toolCanvasArr[idx],
  //
  //     mergeCtx: this.mergeCtxArr[idx],
  //     drawCtx: this.drawCtxArr[idx],
  //     toolCtx: this.toolCtxArr[idx]
  //   };
  // }
  //
  onCanvasDown(e)
  {
	e.stopPropagation();
	
	this.setOffsetPos(e.target);
	this.isDrawing = true;

	this.isSingleTouch = !(APainter.isMobile() && e.targetTouches.length > 1);

	const isDrawStart = true;
	let pos = this.getPos(e);

	// const pageNum = e.target.id.split("_")[2];
	// const nowCanvases = this.getDrawCanvases(pageNum);
	
	this.doToolDraw(pos)

	this.doDraw(pos, isDrawStart);
   
  }
  
  
  onCanvasMove(e)
  {
    e.stopPropagation();
    
    if(!this.isDrawing) return;
    
    let pos = this.getPos(e);
    
    // const pageNum = e.target.id.split("_")[2];
    // const nowCanvases = this.getDrawCanvases(pageNum);
	
	this.doToolDraw(pos);
    
    this.doDraw(pos, false);
  }
  
  onCanvasUp(e)
  {
    e.stopPropagation();
    
    this.isDrawing = false;
	
	this.toolCtx.clearRect(0, 0, this.toolCanvas.width, this.toolCanvas.height);
  }
  
  doToolDraw(pos)
  {
	this.toolCtx.clearRect(0, 0, this.toolCanvas.width, this.toolCanvas.height);

		let eposX = 0, eposY = 0;
		
		switch(this.tool)
		{
			case 'pen':
				break;

			case 'neon':
				eposX = pos.x - 2;
				eposY = pos.y - 2;
				
				this.toolCtx.lineWidth = 4;
				this.toolCtx.strokeStyle = this.neonColor;
				this.toolCtx.moveTo(eposX, eposY);
				this.toolCtx.strokeRect(eposX, eposY, 4, this.neonLineWidth);
				
				break;
			
			case 'erase':
				this.toolCtx.lineWidth = 2;
				this.toolCtx.strokeStyle = '#999';
				this.toolCtx.beginPath();
				this.toolCtx.arc(pos.x, pos.y, this.eraseSize/2, 0, Math.PI*2);
				this.toolCtx.stroke();
				
				break;

		}
  }
  
  doDraw(pos, isDrawStart)
  {
	
    let ctx = this.drawCtx;
    switch(this.tool)
    {
      case 'pen':
        if(isDrawStart) {
          ctx.globalCompositeOperation = "source-over";
          ctx.lineWidth = this.lineWidth;
          ctx.strokeStyle = this.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        break;
		
        
      case 'neon':
        if(isDrawStart)	{
			ctx.globalCompositeOperation = "color";
			ctx.lineWidth = this.neonLineWidth;
			ctx.strokeStyle = this.neonColor;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
		}
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		
        break;
        
      case 'erase':
	  
        if(isDrawStart) {
			ctx.globalCompositeOperation = 'destination-out';
			ctx.lineWidth = this.eraseSize;
			ctx.strokeStyle = '#000';
			ctx.lineCap = "round";
			ctx.lineJoung = "round";
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
		}
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		
        break;
        
        
    }
	
  }
  
  setTool(tool)
  {
  	this.tool = tool;
  }
  
  setColor(color)
  {
  	this.color = color;
  }
  
  setNeonColor(neonColor)
  {
  	this.neonColor = neonColor;
  }
  
  getTool()
  {
  	return this.tool;
  }
  
  getColor()
  {
  	return this.color;
  }
  
  getNeonColor()
  {
  	return this.neonColor;
  }
  
  getDrawCanvas()
  {
  	return this.drawCanvas;
  }
  
  
}