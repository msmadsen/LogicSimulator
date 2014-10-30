var SIM_FPS = 30.0;
var SIM_FRAME_TIME = 1000.0/SIM_FPS;
var SIM_RENDER_TIMER_ID;

var EDIT_MODE_INTERACT = 1;
var EDIT_MODE_SELECT = 2;
var EDIT_MODE_MOVE = 3;
var EDIT_MODE_NAND = 4;
var EDIT_MODE_INPUT = 5;
var EDIT_MODE_WIRE = 6;
var EDIT_MODE_WIRELINK = 7;
var EDIT_MODE_OUTPUT = 8;
var EDIT_MODE_CLOCK = 9;

var SIM_SHOW_REAL_DEVICES = true;
var SIM_IS_RUNNING = false;
var SIM_GATE_DELAY_MODE = 0;
var SIM_STABLE_NET_MODE = 1;
var SIM_MODE = SIM_GATE_DELAY_MODE;
var SIM_GATE_DELAY_MS = 500;
var SIM_CLOCK_HZ = 1;
var SIM_LOOPS_PER_FRAME = 1;



function CpuSimEditorPinStatus()
{
    var moduleObjIndex = null;
    var isInput = null;
    var pinIndex = null;
    
    this.reset = function() {
        moduleObjIndex = null;
        isInput = null;
        pinIndex = null;
    }
    this.setModuleObjIndex = function(i) { moduleObjIndex = i; }
    this.setIsInput = function(i) { isInput = i; }
    this.setPinIndex = function(i) { pinIndex = i; }
    this.getModuleObjIndex = function() { return moduleObjIndex; }
    this.getIsInput = function() { return isInput; }
    this.getPinIndex = function() { return pinIndex; }
}    

function CpuSimEditorClickStatus()
{
    var clicked = false;
    var inPinIndex = null;
    var outPinIndex = null;
    
    this.reset = function() {
        clicked = false;
        inPinIndex = null;
        outPinIndex = null;
    }
    this.setClicked = function(c) { clicked = c; }
    this.setInPinIndex = function(i) { inPinIndex = i; }
    this.setOutPinIndex = function(i) { outPinIndex = i; }
    this.getClicked = function() { return clicked; }
    this.getInPinIndex = function() { return inPinIndex; }
    this.getOutPinIndex = function() { return outPinIndex; }
}    


function CpuSimEditorCoordinates()
{
    var viewCenter = new Vector2d();
    var viewZoom = 1.0;
    var grid = 8;
    var canW = 0.0;
    var canH = 0.0;
    
    this.viewCenterMove = function(internalDelta) {
        viewCenter = viewCenter.sub(internalDelta);
    }
    this.alignToGridUnit = function(u) {
        var ret;
        ret = Math.round( u / parseFloat(grid) ) * grid;
        return ret;
    }
    this.alignToGrid = function(p) {
        var ret = new Vector2d();
        ret.setX( Math.round( (p.getX() / parseFloat(grid)) ) * grid );
        ret.setY( Math.round( (p.getY() / parseFloat(grid)) ) * grid );
        return ret;
    }
    this.toInternalUnit = function(u) { 
        var ret;
        ret = u/viewZoom;
        return ret;
    }
    this.toInternal = function(pix) {
        var ret = new Vector2d();
        ret.setX( (pix.getX() - canW/2.0)/(viewZoom) + viewCenter.getX() );
        ret.setY( (pix.getY() - canH/2.0)/(viewZoom) + viewCenter.getY() );
        return ret;
    }
    this.toCanvasUnit = function(u) { return u*viewZoom; }
    this.toCanvas = function(point) { 
        var ret = new Vector2d();
        ret.setX( canW/2.0 + this.toCanvasUnit(point.getX()-viewCenter.getX()) );
        ret.setY( canH/2.0 + this.toCanvasUnit(point.getY()-viewCenter.getY()) );
        return ret; 
    }
    this.updateCanvasDim = function() {
        canW = parseFloat( $('#sim-window-canvas').width() );
        canH = parseFloat( $('#sim-window-canvas').height() );
    }
    this.zoomIn = function() {
        viewZoom *= 1.1;
    }
    this.zoomOut = function() {
        viewZoom *= 0.9;
    }
    this.setZoom = function(z) {
        viewZoom = z;
    }
    this.getZoom = function() {
        return viewZoom;
    }
}



function CpuSimEditor()
{
    var editMode = null;
    var m = new Module();
    var pix = null;
    var wireStart = new CpuSimEditorPinStatus();
    var wireStop = new CpuSimEditorPinStatus();
    
    
    // constructor
    SIM_IS_RUNNING = $('#simulation-control a.button-simulation-startstop').hasClass('stopped') ? false : true;
    SIM_MODE = $('#gateDelaySim').is(':checked') ? 0 : 1;
    SIM_GATE_DELAY_MS = parseInt( $('#gateDelay').val() );
    SIM_CLOCK_HZ = parseFloat( $("#clock").val() );
    SIM_LOOPS_PER_FRAME = parseInt( $('#simLoopsPerFrame').val() );
    
    
    
    this.simParamsUpdate = function() {
        SIM_MODE = $('#gateDelaySim').is(':checked') ? 0 : 1;
        SIM_GATE_DELAY_MS = parseInt( $('#gateDelay').val() );
        SIM_CLOCK_HZ = parseFloat( $("#clock").val() );
        SIM_LOOPS_PER_FRAME = parseInt( $('#simLoopsPerFrame').val() );
    }
    this.simStartStopToogle = function() {
        if ($('#simulation-control a.button-simulation-startstop').hasClass('stopped'))
            $('#simulation-control a.button-simulation-startstop').removeClass('stopped'); else
            $('#simulation-control a.button-simulation-startstop').addClass('stopped');
            
        SIM_IS_RUNNING = $('#simulation-control a.button-simulation-startstop').hasClass('stopped') ? false : true;
    }
    this.redrawStart = function() {
        var nextFrameDelay;
        var oneFrameSpeed;
        var oneLoopSpeed;
        var i;
        
        oneFrameSpeed = helperSpeedTestStart();
        this.render();
        

        // compute net state
        if (SIM_IS_RUNNING) {
            oneLoopSpeed = helperSpeedTestStart();
            for (i=0; i<SIM_LOOPS_PER_FRAME; i++)
                m.getOutputData();
            oneLoopSpeed = (helperSpeedTestEnd(oneLoopSpeed) / SIM_LOOPS_PER_FRAME) * 1000.0;
        } else {
            oneLoopSpeed = 0.0;
        }
        $('#one-loop-speed').html( helperNumberFormat(oneLoopSpeed, 3, '.', '') );
                
                
        // stable info
        if (SIM_FLAG_NON_STABLE)
            $('#non-stable-state').html('<b>no!</b>'); else
            $('#non-stable-state').html('yes');
    
        // compute FPS
        oneFrameSpeed = helperSpeedTestEnd(oneFrameSpeed);
        oneFrameSpeed = (oneFrameSpeed < 0.001) ? 0.001 : oneFrameSpeed;
        $('#status-real-fps').html(helperNumberFormat((1.0 / oneFrameSpeed), 1, '.', ''));
        $('#status-max-fps').html(helperNumberFormat(SIM_FPS, 1, '.', ''));
        
        // compute next frame delay
        nextFrameDelay = SIM_FRAME_TIME - (oneFrameSpeed * 1000.0);
        nextFrameDelay = nextFrameDelay<0 ? 0 : Math.floor(nextFrameDelay);
        $('#status-render-iddle').html( helperNumberFormat(((nextFrameDelay/SIM_FRAME_TIME)*100.0), 1, '.', '')+'%' );
        SIM_RENDER_TIMER_ID = setTimeout("cpuSimEditor.redrawStart()", nextFrameDelay);
    }
    
    this.newProject = function() {
        var m = new Module();
        $('#sim-window-div').html('');
    }
    
    this.benchmark = function() {
        var x, y, i;
        var vec = new Vector2d();
        
        i = 0;
        for (y=0; y<100*50; y+=50)
            for (x=0; x<100*50; x+=50) {
                vec.setX(x);
                vec.setY(y);
                this.addObject(vec, 'GateNand');
                i++;
            }
        console.log('Benchmark - dodano: '+i);
    }
    
    this.getInternalModuleObj = function(moduleObj, objXY, objDim) {
        var p, s;
        var obj;
        
        obj = moduleObj.getObj();
        p = moduleObj.getPos();
        s = obj.getSize();
        
        objXY.setX( p.getX() );
        objXY.setY( p.getY() );
        objDim.setX( s.getX() );
        objDim.setY( s.getY() );
    }
    
    this.getInternalModuleObjPin = function(objXY, pin, pinXY, pinDim) { 
        pinXY.setX( objXY.getX() + pin.getX() );
        pinXY.setY( objXY.getY() + pin.getY() );
        pinDim.setX( PIN_SIZE );
        pinDim.setY( PIN_SIZE );
    }
    
    this.getCanvasModuleObj = function(moduleObj, objXY, objDim) {
        var p, s;
        var obj;
        var tmp;
        
        obj = moduleObj.getObj();
        p = moduleObj.getPos();
        s = obj.getSize();
        
        tmp = cpuSimEditorCoordinates.toCanvas(p);
        objXY.setX( tmp.getX() );
        objXY.setY( tmp.getY() );
        objDim.setX( cpuSimEditorCoordinates.toCanvasUnit(s.getX()) );
        objDim.setY( cpuSimEditorCoordinates.toCanvasUnit(s.getY()) );
    }
    
    this.getCanvasModuleObjPin = function(objXY, pin, pinXY, pinDim) { 
        pinXY.setX( objXY.getX() + cpuSimEditorCoordinates.toCanvasUnit( pin.getX() ) );
        pinXY.setY( objXY.getY() + cpuSimEditorCoordinates.toCanvasUnit( pin.getY() ) );
        pinDim.setX( cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE ) );
        pinDim.setY( cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE ) );
    }
    
    this.__renderInCanvasGatesAndModules = function(moduleObj, moduleObjIndex, ctx) {
        var obj;
        var objXY = new Vector2d();
        var objDim = new Vector2d();
        var pinXY = new Vector2d();
        var pinDim = new Vector2d();
        var pinArr;
        var i;
        var image;
        var bitsTmpCoord;
        var bitsNESWLoc;
        var pinCtrlLength;
        var pinSizeHalf;
        var switchCol;
        var oTyp, oSel, oRot, oSta;
        var switchingTimeProgress;
        var now = (new Date()).getTime();
        
        obj = moduleObj.getObj();
        pinSizeHalf = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE * 0.5 );
        pinCtrlLength = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE * 5.0 );
        

        // draw gate
        this.getCanvasModuleObj(moduleObj, objXY, objDim);
        switchingTimeProgress = obj.getSwitchingTimeProgress(now);
        if (switchingTimeProgress<1.0) {
            ctx.beginPath();
            ctx.rect(objXY.getX(), objXY.getY(), objDim.getX(), objDim.getY());
            switchCol = Math.floor( 255*switchingTimeProgress );
            ctx.fillStyle = 'rgb('+switchCol+','+switchCol+',0)';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }
        
        oTyp = obj.getObjClass();
        oSel = moduleObj.getSelected();
        oSta = obj.getState();
        oRot = moduleObj.getRotation();
        
        if (oTyp=='Clock')
            oTyp = 'Input';
        
        if (oTyp=='GateNand') {
            if (SIM_SHOW_REAL_DEVICES) {
                oTyp = 'RealGateNand';
            } else {
                oSta = 0;
            }
        }
        
        image = document.getElementById(oTyp+'_sel-'+oSel+'_state-'+oSta+'_rot-'+oRot);
        
        ctx.drawImage(image, objXY.getX(), objXY.getY(), objDim.getX(), objDim.getY());

        // draw input pins
        pinArr = obj.getInputBitsLocations();
        bitsTmpCoord = obj.getInputBitsTmpCoordinates();
        bitsNESWLoc = obj.getInputBitsNESWLocations();
        for (i=0; i<pinArr.length; i++) {
            this.getCanvasModuleObjPin(objXY, pinArr[i], pinXY, pinDim);
            
            // wire active test
            if ( (wireStart.getModuleObjIndex()===moduleObjIndex && wireStart.getIsInput()===true && wireStart.getPinIndex()===i) || 
                 (wireStop.getModuleObjIndex()===moduleObjIndex && wireStop.getIsInput()===true && wireStop.getPinIndex()===i) )
                image = document.getElementById('pin-input-s'); else
                image = document.getElementById('pin-input');
        
            // draw pin
            ctx.drawImage(image, pinXY.getX(), pinXY.getY(), pinDim.getX(), pinDim.getY());
            
            // save computed location
            bitsTmpCoord[i*2].setX( pinXY.getX() + pinSizeHalf );
            bitsTmpCoord[i*2].setY( pinXY.getY() + pinSizeHalf );
            switch (bitsNESWLoc[i]) {
                case 0: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() - pinCtrlLength ); break;
                case 1: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() + pinCtrlLength ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() ); break;
                case 2: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() + pinCtrlLength ); break;
                case 3: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() - pinCtrlLength ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() ); break;
            }
        }
        
        // draw output pins
        pinArr = obj.getOutputBitsLocations();
        bitsTmpCoord = obj.getOutputBitsTmpCoordinates();
        bitsNESWLoc = obj.getOutputBitsNESWLocations();
        for (i=0; i<pinArr.length; i++) {
            this.getCanvasModuleObjPin(objXY, pinArr[i], pinXY, pinDim);    
            
            // wire active test
            if ( (wireStart.getModuleObjIndex()===moduleObjIndex && wireStart.getIsInput()===false && wireStart.getPinIndex()===i) ||
                 (wireStop.getModuleObjIndex()===moduleObjIndex && wireStop.getIsInput()===false && wireStop.getPinIndex()===i) )
                image = document.getElementById('pin-output-s'); else
                image = document.getElementById('pin-output');

            // draw pin
            ctx.drawImage(image, pinXY.getX(), pinXY.getY(), pinDim.getX(), pinDim.getY());
            
            // save computed location
            bitsTmpCoord[i*2].setX( pinXY.getX() + pinSizeHalf );
            bitsTmpCoord[i*2].setY( pinXY.getY() + pinSizeHalf );
            switch (bitsNESWLoc[i]) {
                case 0: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() - pinCtrlLength ); break;
                case 1: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() + pinCtrlLength ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() ); break;
                case 2: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() + pinCtrlLength ); break;
                case 3: bitsTmpCoord[i*2 + 1].setX( bitsTmpCoord[i*2].getX() - pinCtrlLength ); bitsTmpCoord[i*2 + 1].setY( bitsTmpCoord[i*2].getY() ); break;
            }
        }
    }
    
    this.__renderInCanvasConnections = function(moduleObj_A, moduleObjIndex_A, ctx) {
        var pinXY_A;
        var pinXY_B;
        var pinCtrlXY_A;
        var pinCtrlXY_B;
        var bitsTmpCoord_A;
        var bitsTmpCoord_B;
        var moduleObj_B;
        var connIdx;
        var connObj;
        var obj_A;
        var obj_B;
        var bitState;
        var canvasConnDiameter = cpuSimEditorCoordinates.toCanvasUnit(2);
        var canvasConnSignalDiameter = cpuSimEditorCoordinates.toCanvasUnit(1);
       
        obj_A = moduleObj_A.getObj();
        
        moduleObj_A.connOutIteratorReset();
        while ((connIdx=moduleObj_A.connOutIteratorGetNext())!==null) {
            connObj = m.getModuleConnByIndex(connIdx);
            
            
            moduleObj_B = m.getModuleObjByIndex(connObj.getObjB_index());
            obj_B = moduleObj_B.getObj();
            
            bitsTmpCoord_A = obj_A.getOutputBitsTmpCoordinates();
            bitsTmpCoord_B = obj_B.getInputBitsTmpCoordinates();
            
            pinXY_A = bitsTmpCoord_A[ connObj.getObjA_bitStart()*2 ];
            pinCtrlXY_A = bitsTmpCoord_A[ connObj.getObjA_bitStart()*2 + 1 ];
            pinXY_B = bitsTmpCoord_B[ connObj.getObjB_bitStart()*2 ];
            pinCtrlXY_B = bitsTmpCoord_B[ connObj.getObjB_bitStart()*2 + 1 ];
            
            bitState = obj_A.getOutput().toString().charAt(connObj.getObjA_bitStart());
            
            ctx.lineWidth = canvasConnDiameter;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(pinXY_A.getX(), pinXY_A.getY());
            ctx.bezierCurveTo(pinCtrlXY_A.getX(), pinCtrlXY_A.getY(), pinCtrlXY_B.getX(), pinCtrlXY_B.getY(), pinXY_B.getX(), pinXY_B.getY());
            ctx.stroke();
            
            ctx.lineWidth = canvasConnSignalDiameter;
            if (bitState=="1")
                ctx.strokeStyle = "red"; else
                ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.moveTo(pinXY_A.getX(), pinXY_A.getY());
            ctx.bezierCurveTo(pinCtrlXY_A.getX(), pinCtrlXY_A.getY(), pinCtrlXY_B.getX(), pinCtrlXY_B.getY(), pinXY_B.getX(), pinXY_B.getY());
            ctx.stroke();

        }
    }
    
    this.render = function() {
        var objs = m.getModuleObjs();
        var i;
        var moduleObj;
        var canvas, ctx;
        

        canvas = document.getElementById('sim-window-canvas');
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.__renderGrid(ctx);
        
        // render gates and modules
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            this.__renderInCanvasGatesAndModules(moduleObj, i, ctx);
        }
        
        // render connections
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            this.__renderInCanvasConnections(moduleObj, i, ctx);
        }
    }
    
    this.__renderGrid = function(ctx) {
        var x, y;
        var xyVec = new Vector2d();
        var left, right, top, bottom, RADIUS, GRID;
        
        GRID = 16.0;
        RADIUS = 2000.0;
        left = -RADIUS;
        right = RADIUS;
        top = -RADIUS;
        bottom = RADIUS;
        
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        
        for (y=top; y<=bottom; y+=GRID) {
            ctx.beginPath();
            xyVec.setX(left);
            xyVec.setY(y);
            xyVec = cpuSimEditorCoordinates.toCanvas(xyVec);
            ctx.moveTo(xyVec.getX(), xyVec.getY());
            
            xyVec.setX(right);
            xyVec.setY(y);
            xyVec = cpuSimEditorCoordinates.toCanvas(xyVec);
            ctx.lineTo(xyVec.getX(), xyVec.getY());
            ctx.closePath();
            ctx.stroke();
        }
        
        for (x=left; x<=right; x+=GRID) {
            ctx.beginPath();
            xyVec.setX(x);
            xyVec.setY(top);
            xyVec = cpuSimEditorCoordinates.toCanvas(xyVec);
            ctx.moveTo(xyVec.getX(), xyVec.getY());
            
            xyVec.setX(x);
            xyVec.setY(bottom);
            xyVec = cpuSimEditorCoordinates.toCanvas(xyVec);
            ctx.lineTo(xyVec.getX(), xyVec.getY());
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    this.setPix = function(ctx, r, g, b, a) {
        var pixRGBA;
        
        if (pix===null)
            pix = ctx.createImageData(1,1);
        
        pixRGBA  = pix.data;
        pixRGBA[0] = r;
        pixRGBA[1] = g;
        pixRGBA[2] = b;
        pixRGBA[3] = a;
    }
    
    this.addObject = function(internalPixel, type) {
        var unique = (new Date().getTime()).toString(36);
        var moduleObj;
        var objCenter = new Vector2d();
        
        // add new moduleObject
        unique = unique + '-' + helperGetRandomInt(0, 1222333).toString(36);
        m.addModuleObj(type, unique);
        moduleObj = m.getModuleObj(unique);
        
        // align to grid and set position
        objCenter.setX(moduleObj.getObj().getSize().getX() / 2.0);
        objCenter.setY(moduleObj.getObj().getSize().getY() / 2.0);
        internalPixel = internalPixel.sub(objCenter);
        internalPixel = cpuSimEditorCoordinates.alignToGrid(internalPixel);
        moduleObj.setPos(internalPixel);
    }
    
    this.clickCheck = function(moduleObj, internalPixel, clickStatus) {
        var obj;
        var objXY = new Vector2d();
        var objDim = new Vector2d();
        var pinXY = new Vector2d();
        var pinDim = new Vector2d();
        var pinArr;
        var i;
        
        obj = moduleObj.getObj();
        clickStatus.reset();
        
        this.getInternalModuleObj(moduleObj, objXY, objDim);
        if ( ! internalPixel.isInRect(objXY, objDim))
            return;
        
        clickStatus.setClicked(true);

        // input pins
        pinArr = obj.getInputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            this.getInternalModuleObjPin(objXY, pinArr[i], pinXY, pinDim);            
            if (internalPixel.isInRect(pinXY, pinDim)) {
                clickStatus.setInPinIndex(i);
                break;
            }
        }
        
        // output pins
        pinArr = obj.getOutputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            this.getInternalModuleObjPin(objXY, pinArr[i], pinXY, pinDim);
            if (internalPixel.isInRect(pinXY, pinDim)) {
                clickStatus.setOutPinIndex(i);
                break;
            }
        }
    }
    
    this.deSelectObjects = function() {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            moduleObj.setSelected(0);
        }
    }
    
    this.selectObjects = function(internalPixel) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        var clickStatus = new CpuSimEditorClickStatus();
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            this.clickCheck(moduleObj, internalPixel, clickStatus);
            if (clickStatus.getClicked()) {
                moduleObj.setSelected( (moduleObj.getSelected()==1) ? 0 : 1 );
            }
        }
    }
    
    this.interactObject = function(internalPixel) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        var clickStatus = new CpuSimEditorClickStatus();
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            this.clickCheck(moduleObj, internalPixel, clickStatus);
            if (clickStatus.getClicked()) {
                if (moduleObj.getObj().getObjClass()=="Input") {
                    moduleObj.getObj().toggle();
                } else {
                    console.log( moduleObj.debug(0) );
                }
            }
        }
    }
    
    this.wireObjects = function(internalPixel) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        var clickStatus = new CpuSimEditorClickStatus();
        var pinStatus = new CpuSimEditorPinStatus();
        var readyToWire = false;
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            this.clickCheck(moduleObj, internalPixel, clickStatus);
            if (clickStatus.getClicked()) {
                if (clickStatus.getInPinIndex()!==null) {
                    pinStatus.setModuleObjIndex(i);
                    pinStatus.setIsInput(true);
                    pinStatus.setPinIndex(clickStatus.getInPinIndex());
                    break;
                }
                if (clickStatus.getOutPinIndex()!==null) {
                    pinStatus.setModuleObjIndex(i);
                    pinStatus.setIsInput(false);
                    pinStatus.setPinIndex(clickStatus.getOutPinIndex());
                    break;
                }
            }
        }
        
        if (pinStatus.getModuleObjIndex()!==null) {
            if (wireStart.getModuleObjIndex()===null) {
                wireStart.setModuleObjIndex( pinStatus.getModuleObjIndex() );
                wireStart.setIsInput( pinStatus.getIsInput() );
                wireStart.setPinIndex( pinStatus.getPinIndex() );
            } else {
                wireStop.setModuleObjIndex( pinStatus.getModuleObjIndex() );
                wireStop.setIsInput( pinStatus.getIsInput() );
                wireStop.setPinIndex( pinStatus.getPinIndex() );
                readyToWire = true;
            }
        }
        
        if (readyToWire) {
            m.addConn(objs[wireStart.getModuleObjIndex()].getName(), objs[wireStop.getModuleObjIndex()].getName(), 
                      wireStart.getPinIndex(), wireStop.getPinIndex());
            
            // reset propagation state
            for (i=0; i<objs.length; i++) {
                moduleObj = objs[i];
                moduleObj.getObj().clearChanged();
            }
                      
            // reset wiring tools state
            wireStart.reset();
            wireStop.reset();
        }
    }
    
    this.moveObjects = function(internalDelta, alignToGrid) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var newPos = new Vector2d();
        var i;
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            if (moduleObj.getSelected()) {
                newPos = moduleObj.getPos();
                if (!alignToGrid)
                    newPos = newPos.add(internalDelta); else
                    newPos = cpuSimEditorCoordinates.alignToGrid(newPos);
                moduleObj.setPos(newPos);
            }
        }
    }
    
    this.rotateObjects = function(side)
    {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        
        for (i=0; i<objs.length; i++) {
            moduleObj = objs[i];
            if (moduleObj.getSelected())
                moduleObj.rotate90(side);
        }
    }
    
    this.editingModeChange = function(obj) {
        obj.parent().find('> a').removeClass('active');
        obj.addClass('active');
        editMode = parseInt(obj.attr('editMode'));
        
        if (editMode==EDIT_MODE_SELECT) {
            this.deSelectObjects();
        }
        
        if (editMode==EDIT_MODE_WIRE) {
            wireStart.reset();
            wireStop.reset();
        }
    }
    
    this.mouseDragLeft = function(internalDelta) {
        switch (editMode) {
            case EDIT_MODE_SELECT: 
                                     break;
            case EDIT_MODE_MOVE:     this.moveObjects(internalDelta, false);
                                     break;
        }
    }
    
    this.mouseDragLeftStop = function(internalPixel) {
        switch (editMode) {
            case EDIT_MODE_SELECT: 
                                     break;
            case EDIT_MODE_MOVE:     this.moveObjects(new Vector2d(), true);
                                     break;
        }
    }
    
    this.mouseDragRight = function(internalDelta) {
        cpuSimEditorCoordinates.viewCenterMove(internalDelta);
    }
    
    this.mouseDragRightStop = function(internalPixel) {
        
    }
    
    this.mouseLeftClick = function(internalPixel) {
        switch (editMode) {
            case EDIT_MODE_INTERACT: this.interactObject(internalPixel);
                                     break;
            case EDIT_MODE_SELECT:   this.selectObjects(internalPixel);
                                     break;
            case EDIT_MODE_NAND:     this.addObject(internalPixel, 'GateNand');
                                     break;
            case EDIT_MODE_INPUT:    this.addObject(internalPixel, 'Input');
                                     break;
            case EDIT_MODE_WIRE:     this.wireObjects(internalPixel);
                                     break;
            case EDIT_MODE_WIRELINK: this.addObject(internalPixel, 'WireLink');
                                     break;
            case EDIT_MODE_OUTPUT:   this.addObject(internalPixel, 'Output');
                                     break;
            case EDIT_MODE_CLOCK:    this.addObject(internalPixel, 'Clock');
                                     break;
        }
    }
    
    this.mouseRightClick = function(internalPixel) {
    }
    
    this.mouseMove = function(internalPixel) {
    }
    
    this.zoomChanged = function() {
    }
    
    this.quickSave = function() {
        var i;
        var objs = m.getModuleObjs();
        var conns = m.getModuleConns();
        var state = '';
        var oCl, oN, oPx, oPy;
        var oAn, oBn;
        var oAbs, oBbs;
        
        // save gates and modules
        for (i=0; i<objs.length; i++) {
            oCl = objs[i].getObj().getObjClass();
            oN = objs[i].getName();
            oPx = objs[i].getPos().getX()
            oPy = objs[i].getPos().getY()
            
            state = state + "m.addModuleObj('"+oCl+"', '"+oN+"');" + "\n";
            state = state + "m.getModuleObj('"+oN+"').setPos(new Vector2d("+oPx+", "+oPy+"));" + "\n";
        }
        
        // save connections
        for (i=0; i<conns.length; i++) {
            oAn = conns[i].getObjA_name();
            oAbs = conns[i].getObjA_bitStart();
            oBn = conns[i].getObjB_name();
            oBbs = conns[i].getObjB_bitStart();
            
            state = state + "m.addConn('"+oAn+"', '"+oBn+"', "+oAbs+", "+oBbs+");" + "\n";
        }
        
        console.log(state);
    }
    
    this.quickLoad = function() {


m.addModuleObj('GateNand', '210703703490073');
m.getModuleObj('210703703490073').setPos(new Vector2d(30, -110));
m.addModuleObj('GateNand', '1786075225377137');
m.getModuleObj('1786075225377137').setPos(new Vector2d(30, -70));
m.addModuleObj('GateNand', '357636025264273');
m.getModuleObj('357636025264273').setPos(new Vector2d(100, -110));
m.addModuleObj('GateNand', '66289046316293');
m.getModuleObj('66289046316293').setPos(new Vector2d(100, -70));
m.addModuleObj('GateNand', '1828942722316352');
m.getModuleObj('1828942722316352').setPos(new Vector2d(200, -110));
m.addModuleObj('GateNand', '2562901624143721');
m.getModuleObj('2562901624143721').setPos(new Vector2d(270, -110));
m.addModuleObj('GateNand', '47982791049880');
m.getModuleObj('47982791049880').setPos(new Vector2d(200, -70));
m.addModuleObj('GateNand', '189667895452435');
m.getModuleObj('189667895452435').setPos(new Vector2d(270, -70));
m.addModuleObj('GateNand', '354958625380390');
m.getModuleObj('354958625380390').setPos(new Vector2d(30, -20));
m.addModuleObj('GateNand', '25630739345875');
m.getModuleObj('25630739345875').setPos(new Vector2d(100, -20));
m.addModuleObj('GateNand', '2100539225792921');
m.getModuleObj('2100539225792921').setPos(new Vector2d(30, 20));
m.addModuleObj('GateNand', '434365526314084');
m.getModuleObj('434365526314084').setPos(new Vector2d(100, 20));
m.addModuleObj('GateNand', '253965454364345');
m.getModuleObj('253965454364345').setPos(new Vector2d(200, -20));
m.addModuleObj('GateNand', '766776517912116');
m.getModuleObj('766776517912116').setPos(new Vector2d(270, -20));
m.addModuleObj('GateNand', '2211259322497383');
m.getModuleObj('2211259322497383').setPos(new Vector2d(200, 20));
m.addModuleObj('GateNand', '966836817372005');
m.getModuleObj('966836817372005').setPos(new Vector2d(270, 20));
m.addModuleObj('Clock', '76162721332051');
m.getModuleObj('76162721332051').setPos(new Vector2d(-180, -270));
m.addModuleObj('GateNand', '2256974917203986');
m.getModuleObj('2256974917203986').setPos(new Vector2d(150, -150));
m.addModuleObj('WireLink', '78831293503377');
m.getModuleObj('78831293503377').setPos(new Vector2d(170, -60));
m.addModuleObj('WireLink', '98975241640471');
m.getModuleObj('98975241640471').setPos(new Vector2d(170, 30));
m.addModuleObj('WireLink', '42153609533208');
m.getModuleObj('42153609533208').setPos(new Vector2d(0, -60));
m.addModuleObj('WireLink', '2647684920538199');
m.getModuleObj('2647684920538199').setPos(new Vector2d(0, 30));
m.addModuleObj('WireLink', '7411552607490');
m.getModuleObj('7411552607490').setPos(new Vector2d(110, -130));
m.addModuleObj('WireLink', '180967743692579');
m.getModuleObj('180967743692579').setPos(new Vector2d(20, -130));
m.addModuleObj('GateNand', '35333020472611');
m.getModuleObj('35333020472611').setPos(new Vector2d(-70, -120));
m.addModuleObj('GateNand', '180569635395464');
m.getModuleObj('180569635395464').setPos(new Vector2d(-70, -30));
m.addModuleObj('GateNand', '1994072823429731');
m.getModuleObj('1994072823429731').setPos(new Vector2d(-150, -120));
m.addModuleObj('GateNand', '189122817741713');
m.getModuleObj('189122817741713').setPos(new Vector2d(-150, -30));
m.addModuleObj('WireLink', '100568552655012');
m.getModuleObj('100568552655012').setPos(new Vector2d(-190, -120));
m.addModuleObj('WireLink', '36291864429173');
m.getModuleObj('36291864429173').setPos(new Vector2d(-190, -30));
m.addModuleObj('GateNand', '2152171924264787');
m.getModuleObj('2152171924264787').setPos(new Vector2d(-170, -190));
m.addModuleObj('WireLink', '2362604834834');
m.getModuleObj('2362604834834').setPos(new Vector2d(-210, -170));
m.addModuleObj('Input', '794716018945681');
m.getModuleObj('794716018945681').setPos(new Vector2d(-220, -270));
m.addModuleObj('GateNand', '201415684606274');
m.getModuleObj('201415684606274').setPos(new Vector2d(-290, -90));
m.addModuleObj('GateNand', '62971709793651');
m.getModuleObj('62971709793651').setPos(new Vector2d(-290, -20));
m.addModuleObj('GateNand', '263127373568998');
m.getModuleObj('263127373568998').setPos(new Vector2d(-370, -110));
m.addModuleObj('GateNand', '767753618434169');
m.getModuleObj('767753618434169').setPos(new Vector2d(-370, -80));
m.addModuleObj('GateNand', '793094917072423');
m.getModuleObj('793094917072423').setPos(new Vector2d(-370, -40));
m.addModuleObj('GateNand', '2156651522238789');
m.getModuleObj('2156651522238789').setPos(new Vector2d(-370, -10));
m.addModuleObj('WireLink', '349058017059956');
m.getModuleObj('349058017059956').setPos(new Vector2d(380, -90));
m.addModuleObj('WireLink', '2308926616873319');
m.getModuleObj('2308926616873319').setPos(new Vector2d(350, 0));
m.addModuleObj('WireLink', '1410639711988');
m.getModuleObj('1410639711988').setPos(new Vector2d(350, 80));
m.addModuleObj('WireLink', '218037123632169');
m.getModuleObj('218037123632169').setPos(new Vector2d(380, 110));
m.addModuleObj('WireLink', '170660966586485');
m.getModuleObj('170660966586485').setPos(new Vector2d(-590, 80));
m.addModuleObj('WireLink', '1822756019464449');
m.getModuleObj('1822756019464449').setPos(new Vector2d(-620, 110));
m.addModuleObj('WireLink', '1907739524662576');
m.getModuleObj('1907739524662576').setPos(new Vector2d(-590, -180));
m.addModuleObj('WireLink', '18100585340375');
m.getModuleObj('18100585340375').setPos(new Vector2d(-620, -200));
m.addModuleObj('GateNand', '237275519464802');
m.getModuleObj('237275519464802').setPos(new Vector2d(-520, -260));
m.addModuleObj('GateNand', '262280071586774');
m.getModuleObj('262280071586774').setPos(new Vector2d(-520, -300));
m.addModuleObj('WireLink', '224474423082565');
m.getModuleObj('224474423082565').setPos(new Vector2d(-560, -280));
m.addModuleObj('WireLink', '57396021644547');
m.getModuleObj('57396021644547').setPos(new Vector2d(-560, -240));
m.addModuleObj('WireLink', '2255747218313269');
m.getModuleObj('2255747218313269').setPos(new Vector2d(-420, -100));
m.addModuleObj('WireLink', '10529509930260');
m.getModuleObj('10529509930260').setPos(new Vector2d(-420, -90));
m.addModuleObj('WireLink', '524912724319826');
m.getModuleObj('524912724319826').setPos(new Vector2d(-420, -70));
m.addModuleObj('WireLink', '2647838818433537');
m.getModuleObj('2647838818433537').setPos(new Vector2d(-420, -60));
m.addModuleObj('WireLink', '567402319957381');
m.getModuleObj('567402319957381').setPos(new Vector2d(-420, -30));
m.addModuleObj('WireLink', '2638032324327193');
m.getModuleObj('2638032324327193').setPos(new Vector2d(-420, -20));
m.addModuleObj('WireLink', '452747621203043');
m.getModuleObj('452747621203043').setPos(new Vector2d(-420, 0));
m.addModuleObj('WireLink', '194289194293669');
m.getModuleObj('194289194293669').setPos(new Vector2d(-420, 10));
m.addModuleObj('WireLink', '234178961538340');
m.getModuleObj('234178961538340').setPos(new Vector2d(-480, -180));
m.addModuleObj('WireLink', '200175224355433');
m.getModuleObj('200175224355433').setPos(new Vector2d(-480, -200));
m.addConn('210703703490073', '357636025264273', 0, 0);
m.addConn('1786075225377137', '66289046316293', 0, 1);
m.addConn('66289046316293', '357636025264273', 0, 1);
m.addConn('357636025264273', '66289046316293', 0, 0);
m.addConn('357636025264273', '1828942722316352', 0, 0);
m.addConn('1828942722316352', '2562901624143721', 0, 0);
m.addConn('2562901624143721', '189667895452435', 0, 0);
m.addConn('189667895452435', '2562901624143721', 0, 1);
m.addConn('47982791049880', '189667895452435', 0, 1);
m.addConn('1828942722316352', '47982791049880', 0, 0);
m.addConn('210703703490073', '1786075225377137', 0, 0);
m.addConn('354958625380390', '25630739345875', 0, 0);
m.addConn('25630739345875', '434365526314084', 0, 0);
m.addConn('434365526314084', '25630739345875', 0, 1);
m.addConn('25630739345875', '253965454364345', 0, 0);
m.addConn('354958625380390', '2100539225792921', 0, 0);
m.addConn('2100539225792921', '434365526314084', 0, 1);
m.addConn('253965454364345', '766776517912116', 0, 0);
m.addConn('2211259322497383', '966836817372005', 0, 1);
m.addConn('966836817372005', '766776517912116', 0, 1);
m.addConn('766776517912116', '966836817372005', 0, 0);
m.addConn('253965454364345', '2211259322497383', 0, 0);
m.addConn('78831293503377', '47982791049880', 0, 1);
m.addConn('78831293503377', '1828942722316352', 0, 1);
m.addConn('98975241640471', '2211259322497383', 0, 1);
m.addConn('98975241640471', '253965454364345', 0, 1);
m.addConn('2647684920538199', '2100539225792921', 0, 1);
m.addConn('2647684920538199', '354958625380390', 0, 1);
m.addConn('42153609533208', '1786075225377137', 0, 1);
m.addConn('42153609533208', '210703703490073', 0, 1);
m.addConn('7411552607490', '2256974917203986', 0, 0);
m.addConn('7411552607490', '2256974917203986', 0, 1);
m.addConn('2256974917203986', '78831293503377', 0, 0);
m.addConn('78831293503377', '98975241640471', 0, 0);
m.addConn('180967743692579', '7411552607490', 0, 0);
m.addConn('76162721332051', '180967743692579', 0, 0);
m.addConn('180967743692579', '42153609533208', 0, 0);
m.addConn('42153609533208', '2647684920538199', 0, 0);
m.addConn('1994072823429731', '35333020472611', 0, 0);
m.addConn('1994072823429731', '35333020472611', 0, 1);
m.addConn('189122817741713', '180569635395464', 0, 0);
m.addConn('189122817741713', '180569635395464', 0, 1);
m.addConn('180569635395464', '354958625380390', 0, 0);
m.addConn('35333020472611', '210703703490073', 0, 0);
m.addConn('100568552655012', '1994072823429731', 0, 0);
m.addConn('36291864429173', '189122817741713', 0, 0);
m.addConn('100568552655012', '36291864429173', 0, 0);
m.addConn('2362604834834', '2152171924264787', 0, 0);
m.addConn('2362604834834', '2152171924264787', 0, 1);
m.addConn('794716018945681', '2362604834834', 0, 0);
m.addConn('2152171924264787', '100568552655012', 0, 0);
m.addConn('767753618434169', '201415684606274', 0, 1);
m.addConn('263127373568998', '201415684606274', 0, 0);
m.addConn('201415684606274', '1994072823429731', 0, 1);
m.addConn('62971709793651', '189122817741713', 0, 1);
m.addConn('793094917072423', '62971709793651', 0, 0);
m.addConn('2156651522238789', '62971709793651', 0, 1);
m.addConn('2562901624143721', '349058017059956', 0, 0);
m.addConn('766776517912116', '2308926616873319', 0, 0);
m.addConn('2308926616873319', '1410639711988', 0, 0);
m.addConn('349058017059956', '218037123632169', 0, 0);
m.addConn('1410639711988', '170660966586485', 0, 0);
m.addConn('218037123632169', '1822756019464449', 0, 0);
m.addConn('170660966586485', '1907739524662576', 0, 0);
m.addConn('1822756019464449', '18100585340375', 0, 0);
m.addConn('18100585340375', '224474423082565', 0, 0);
m.addConn('1907739524662576', '57396021644547', 0, 0);
m.addConn('57396021644547', '237275519464802', 0, 1);
m.addConn('57396021644547', '237275519464802', 0, 0);
m.addConn('224474423082565', '262280071586774', 0, 0);
m.addConn('224474423082565', '262280071586774', 0, 1);
m.addConn('2255747218313269', '263127373568998', 0, 0);
m.addConn('10529509930260', '263127373568998', 0, 1);
m.addConn('524912724319826', '767753618434169', 0, 0);
m.addConn('2647838818433537', '767753618434169', 0, 1);
m.addConn('567402319957381', '793094917072423', 0, 0);
m.addConn('2638032324327193', '793094917072423', 0, 1);
m.addConn('452747621203043', '2156651522238789', 0, 0);
m.addConn('194289194293669', '2156651522238789', 0, 1);
m.addConn('18100585340375', '200175224355433', 0, 0);
m.addConn('1907739524662576', '234178961538340', 0, 0);
m.addConn('262280071586774', '2255747218313269', 0, 0);
m.addConn('234178961538340', '10529509930260', 0, 0);
m.addConn('237275519464802', '524912724319826', 0, 0);
m.addConn('200175224355433', '2647838818433537', 0, 0);
m.addConn('262280071586774', '567402319957381', 0, 0);
m.addConn('237275519464802', '2638032324327193', 0, 0);
m.addConn('200175224355433', '452747621203043', 0, 0);
m.addConn('237275519464802', '194289194293669', 0, 0);

    }
}



