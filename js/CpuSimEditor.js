var SIM_FPS = 25.0;
var SIM_FRAME_TIME = 1000.0/SIM_FPS;
var SIM_RENDER_TIMER_ID;

var EDIT_MODE_INTERACT = 0;
var EDIT_MODE_SELECT = 1;
var EDIT_MODE_MOVE = 2;
var EDIT_MODE_NAND = 3;
var EDIT_MODE_WIRE = 4;


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
    var grid = 10;
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
    
    var inTriangle = false;
    var a = new Vector2d(-100.0, 50.0);
    var b = new Vector2d(-30.0, -10.0);
    var c = new Vector2d(10.0, 30.0);
    
    this.redrawStart = function() {
        var fps;
        var frameTime;
        
        helperExecTimeStart();
        
        cpuSimEditor.render();
                
        frameTime = parseFloat( helperExecTimeEnd() );
        if (frameTime!=0.0) {
            fps = 1.0 / frameTime;
            $('#status-render-time').html(helperNumberFormat(fps, 1, '.', ''));
        } else {
            $('#status-render-time').html('many :)');
        }
        
        SIM_RENDER_TIMER_ID = setTimeout("cpuSimEditor.redrawStart()", 10);
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
        
        obj = moduleObj.getObj();
        pinSizeHalf = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE * 0.5 );
        pinCtrlLength = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE * 10 );
        

        // draw gate
        this.getCanvasModuleObj(moduleObj, objXY, objDim);
        if (moduleObj.getSelected())
            image = document.getElementById('gate-nand-s'); else
            image = document.getElementById('gate-nand');
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
        var pinArr;
        var i;
        var connIdx;
        var connObj;
        var obj_A;
        var obj_B;
        
        

        /*
        // draw input pins
        ctx.strokeStyle = "green";
        pinArr = obj.getInputBitsLocations();
        bitsTmpCoord = obj.getInputBitsTmpCoordinates();
        for (i=0; i<pinArr.length; i++) {
            pinXY = bitsTmpCoord[i*2];
            pinCtrlXY = bitsTmpCoord[i*2 + 1];
            
            ctx.beginPath();
            ctx.moveTo(pinXY.getX(), pinXY.getY());
            ctx.lineTo(pinCtrlXY.getX(), pinCtrlXY.getY());
            ctx.stroke();
        }


        // draw output pins
        ctx.strokeStyle = "yellow";
        pinArr = obj.getOutputBitsLocations();
        bitsTmpCoord = obj.getOutputBitsTmpCoordinates();
        for (i=0; i<pinArr.length; i++) {
            pinXY = bitsTmpCoord[i*2];
            pinCtrlXY = bitsTmpCoord[i*2 + 1];
            
            ctx.beginPath();
            ctx.moveTo(pinXY.getX(), pinXY.getY());
            ctx.lineTo(pinCtrlXY.getX(), pinCtrlXY.getY());
            ctx.stroke();
        }
        

        ctx.lineWidth = 6;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(300, 350);
        ctx.bezierCurveTo(323, 212, 368, 562, 526, 423);
        ctx.stroke();
        */
       
        obj_A = moduleObj_A.getObj();
        
        moduleObj_A.connOutIteratorReset();
        while ((connIdx=moduleObj_A.connOutIteratorGetNext())!==null) {
            connObj = m.getModuleConnByIndex(connIdx);
            moduleObj_B = m.getModuleObjByIndex(connObj.getObjB_index());
            obj_B = moduleObj_B.getObj();
            
            ctx.lineWidth = 6;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(300, 350);
            ctx.bezierCurveTo(323, 212, 368, 562, 526, 423);
            ctx.stroke();aw


            /*
            subDataBits = dataBits.toString().substr(connObj.getObjA_bitStart(), connObj.getObjA_bitLen());
            if (connObj.getObjB_index()!=1) {
                moduleObjs[connObj.getObjB_index()].getObj().setInputData(subDataBits, connObj.getObjB_bitStart());
            } else {
                // output
                for (j=0; j<connObj.getObjB_bitLen(); j++) {
                    atOutputData = atOutputData.replaceAt(connObj.getObjB_bitStart()+j, subDataBits[j]);
                }
            }
            */
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
        for (i=2; i<objs.length; i++) {
            moduleObj = objs[i];
            this.__renderInCanvasGatesAndModules(moduleObj, i, ctx);
        }
        
        // render connections
        for (i=2; i<objs.length; i++) {
            moduleObj = objs[i];
            this.__renderInCanvasConnections(moduleObj, i, ctx);
        }
        
        // render
        var p;
        ctx.lineWidth = 1;
        if (!inTriangle) {
            ctx.strokeStyle = "red";
        } else {
            ctx.strokeStyle = "green";
        }
        
        ctx.beginPath();
        p = cpuSimEditorCoordinates.toCanvas(a);
        ctx.moveTo(p.getX(), p.getY());
        p = cpuSimEditorCoordinates.toCanvas(b);
        ctx.lineTo(p.getX(), p.getY());
        p = cpuSimEditorCoordinates.toCanvas(c);
        ctx.lineTo(p.getX(), p.getY());
        p = cpuSimEditorCoordinates.toCanvas(a);
        ctx.lineTo(p.getX(), p.getY());
        ctx.stroke();
    }
    
    this.__renderGrid = function(ctx) {
        var x, y;
        var xyVec = new Vector2d();
        var left, right, top, bottom, RADIUS, GRID;
        
        GRID = 10.0;
        RADIUS = 2000.0;
        left = -RADIUS;
        right = RADIUS;
        top = -RADIUS;
        bottom = RADIUS;
        
        ctx.strokeStyle = '#2a2a2a';
        
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
        var unique = parseInt(new Date().getTime(), 16);
        var moduleObj;
        
        // add new moduleObject
        unique = parseInt( helperGetRandomInt(0, 2000000), 16 ) + '' + parseInt( helperGetRandomInt(0, 2000000), 16 );
        m.addModuleObj(type, unique);
        moduleObj = m.getModuleObj(unique);
        
        // align to grid and set position
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
        
        for (i=2; i<objs.length; i++) {
            moduleObj = objs[i];
            moduleObj.setSelected(false);
        }
    }
    
    this.selectObjects = function(internalPixel) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var i;
        var clickStatus = new CpuSimEditorClickStatus();
        
        for (i=2; i<objs.length; i++) {
            moduleObj = objs[i];
            this.clickCheck(moduleObj, internalPixel, clickStatus);
            if (clickStatus.getClicked()) {
                moduleObj.setSelected( (moduleObj.getSelected()==true) ? false : true );
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
        
        for (i=2; i<objs.length; i++) {
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
                      wireStart.getPinIndex(), 1, wireStop.getPinIndex(), 1);
            wireStart.reset();
            wireStop.reset();
        }
    }
    
    this.moveObjects = function(internalDelta, alignToGrid) {
        var objs = m.getModuleObjs();
        var moduleObj;
        var newPos = new Vector2d();
        var i;
        
        for (i=2; i<objs.length; i++) {
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
            case EDIT_MODE_INTERACT: 
                                     break;
            case EDIT_MODE_SELECT:   this.selectObjects(internalPixel);
                                     break;
            case EDIT_MODE_NAND:     this.addObject(internalPixel, 'GateNand');
                                     break;
            case EDIT_MODE_WIRE:     this.wireObjects(internalPixel);
                                     break;
        }
    }
    
    this.mouseRightClick = function(internalPixel) {
    }
    
    this.mouseMove = function(internalPixel) {
        
        inTriangle = internalPixel.isInTriangle(a, b, c);
        
    }
    
    this.zoomChanged = function() {
    }
}



