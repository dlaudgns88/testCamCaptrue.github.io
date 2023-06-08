/**
Constructor
*/
class testPage02 extends AView
{
	constructor()
	{
		super()
		
		this.captureCtx = null;
		
		this.painter = null;
		
		this.receiveData = null
		
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)

		const data = this.receiveData = this.getTabData();
		
		this.canvasView.setWidth(data.width);
		this.canvasView.setHeight(data.height);
		
		this.captureCtx = this.captureCanvas.ctx;
		
		this.setCaptureImage(data.base64);		
		
		this.painter = new APainter(data.width, data.height);
		
	}

	onInitDone()
	{
		super.onInitDone()
		
		this.painter.setActivePaint(this.canvasView.element);

	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)

		//TODO:edit here

	}
	
	setCaptureImage(base64)
	{
		this.captureImage.setImage(base64);
		
	}

	onToolChange(comp, info, e)
	{
		this.painter.setTool(comp.compId);
		
		console.log('CHANGE TOOL:', this.painter.getTool());
		
		if(comp.compId === 'neon') {
			console.error(this.painter.getNeonColor());
		}

	}

	onColorChange(comp, info, e)
	{
		this.painter.setColor(comp.compId);
		
		console.log('CHANGE COLOR:', this.painter.getColor());

	}

	onSaveBtnClick(comp, info, e)
	{
		this.captureCtx.drawImage(this.captureImage.element, 0, 0);
		this.captureCtx.drawImage(this.painter.getDrawCanvas(), 0, 0);
		
		const base64 = this.captureCanvas.element.toDataURL();
		
		//바로 return
// 		return base64;
		
		//or file로 저장
		this.downloadUrl(base64, "저장이미지이름.png");
	
	}
	
	
	downloadUrl(url, fileName)
	{
		const link = document.createElement("a");
		link.download = fileName;
		link.href = url;
		document.body.appendChild(link);
		link.click();
		
		document.body.removeChild(link);
	}

}

window["testPage02"] = testPage02