/**
Constructor
*/
class testPage01 extends AView
{
	constructor()
	{
		super()
		
		this.captureWidth = null;
		this.captureheigth = null;		

	}
	
	init(context, evtListener)
	{
		super.init(context, evtListener);
		this.detectDevices();
		
		this.start();
		
	}

	onInitDone()
	{
		super.onInitDone()
		
		this.camVideo.$ele.css({'object-fit':'cover'});
		
		this.setCaptureSize();
		

	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)

	}
	
	detectDevices()
	{
		const thisObj = this;
		
		navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
			thisObj.gotDevices(deviceInfos, thisObj);
		});
	}
	
	start()
	{
		const thisObj = this;
		
		if (window.stream) {
			window.stream.getTracks().forEach(track => {
			  track.stop();
			});
		  }
		  const selectedDevice = this.selectBox.getSelectedItemData();
		  
		  const constraints = {
			video: {deviceId: selectedDevice.deviceId ? {exact: selectedDevice.deviceId} : undefined}
		  };
		// navigator.getUserMedia(constraints, callback()) 형식으로도 작성할 수 있으나, mediaDevices 를 통해서 접근하는 것을 
		  navigator.mediaDevices.getUserMedia(constraints)
		  	.then(thisObj.gotStream)
			.then(deviceInfos => { thisObj.gotDevices(deviceInfos, thisObj) })
			.catch(thisObj.handleError);
	}
	
	gotStream(stream)
	{
		console.error('STREAM:', stream);
		
		const videoEle = document.querySelector("video");
		
		window.stream = stream;
		videoEle.srcObject = stream;
		
	}
	
	gotDevices(deviceInfos, thisObj)
	{
		if(!deviceInfos) return;
		
		// 마이크는 audioinput, 스피커는 audiooutput
		deviceInfos.forEach(deviceInfo => {
			if(deviceInfo.kind === 'videoinput') {
				thisObj.selectBox.addItem(deviceInfo.label, deviceInfo);
			}
		})
	}
	
	handleError(e)
	{
		console.error('ERROR:', e);
	}
	
	setCaptureSize()
	{
		const gWidth = this.gridLayout.element.offsetWidth;
		
		const width = this.captureWidth = gWidth * 0.86;
		const heigth = this.captureHeigth = gWidth * 0.54;
		
		this.gridLayout.setRowSize(1, heigth);
		this.gridLayout.getColGroupItem(1)[0].width = width + "px";
	
	}
	
	getCaptureView()
	{
		const captureView = this.captureView.element;
		
		const rect = captureView.getBoundingClientRect();
		
		const video = this.camVideo.element;
		
		// object-fit:cover로 인한 비율 맞추기
		const originW = video.videoWidth;
		const originH = video.videoHeight;
		
		const viewW = video.offsetWidth;
		const viewH = video.offsetHeight;
		
		let ratio = 1;
		let ratioW = viewW / originW;
		let ratioH = viewH / originH;
		
		ratioH > ratioW ? (ratio = ratioH) : (ratio = ratioW);
		
		//계산된 비율값
		const cameraW = originW * ratio;
		const cameraH = originH * ratio;
		
		//보여지는 view에서 없는 크기
		const offsetX = cameraW - viewW
		const offsetY = cameraH - viewH
		
		//비율계산
		const dLeft = (offsetX / 2) / ratio + rect.left / ratio;
		const dTop = (offsetY / 2) / ratio + rect.top / ratio;
		const dWidth = rect.width / ratio;
		const dHeight = rect.height / ratio;
		
		const backgroundCanvas = document.createElement('canvas');
		backgroundCanvas.width = rect.width;
		backgroundCanvas.height = rect.height;
		
		const ctx = backgroundCanvas.getContext('2d');
		
		ctx.drawImage(video, dLeft, dTop, dWidth, dHeight, 0, 0, rect.width, rect.height);

		const returnData = {
			base64: backgroundCanvas.toDataURL(),
			width: rect.width,
			height: rect.height
		};

		return returnData;
	}

	onSelectBoxSelect(comp, info, e)
	{
		this.start();

	}
	
	onCamBtnClick(comp, info, e)
	{
		const nextTab = this.owner.getTabByInx(1);
		this.owner.selectTab(nextTab, this.getCaptureView());

	}
	
}

window["testPage01"] = testPage01
