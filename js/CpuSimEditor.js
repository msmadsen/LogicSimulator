var SIM_FPS = 25.0;
var SIM_FRAME_TIME = 1000.0/SIM_FPS;
var SIM_RENDER_TIMER_ID;

var PIN_SIZE = 6;

var EDIT_MODE_INTERACT = 0;
var EDIT_MODE_SELECT = 1;
var EDIT_MODE_MOVE = 2;
var EDIT_MODE_NAND = 3;
var EDIT_MODE_WIRE = 4;



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
    var selectedObj = new Array();
    
    
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
    
    this.getCanvasModuleObj = function(moduleObj, objXY, objDim) {
        var p, s;
        var obj;
        var tmp;
        
        obj = moduleObj.getObj();
        p = moduleObj.getPos();
        s = obj.getSize();
        
        tmp = cpuSimEditorCoordinates.toCanvas(p);
        objXY.setX(tmp.getX());
        objXY.setY(tmp.getY());
        objDim.setX( cpuSimEditorCoordinates.toCanvasUnit(s.getX()) );
        objDim.setY( cpuSimEditorCoordinates.toCanvasUnit(s.getY()) );
    }
    
    this.__renderInCanvas = function(unique, moduleObj, obj, ctx) {
        var canvasPix;
        var w, h, x, y;
        var objXY = new Vector2d();
        var objDim = new Vector2d();
        var pinX, pinY, pin;
        var pinArr;
        var i;
        var p, s;
        
        /*
        p = moduleObj.getPos();
        s = obj.getSize();
        */
        
        this.getCanvasModuleObj(moduleObj, objXY, objDim);
        /*
        canvasPix = cpuSimEditorCoordinates.toCanvas(p);
        x = canvasPix.getX();
        y = canvasPix.getY();
        w = cpuSimEditorCoordinates.toCanvasUnit(s.getX());
        h = cpuSimEditorCoordinates.toCanvasUnit(s.getY());
        */
        
        // draw gate
        ctx.drawImage(document.getElementById('gate-nand'), objXY.getX(), objXY.getY(), objDim.getX(), objDim.getY());

        pinArr = obj.getInputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            pinX = x + cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            pinY = y + cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );
            
            ctx.drawImage(document.getElementById('pin-input'), pinX, pinY, pin, pin);
        }
        pinArr = obj.getOutputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            pinX = x + cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            pinY = y + cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );

            ctx.drawImage(document.getElementById('pin-output'), pinX, pinY, pin, pin);
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
        
        /*
        this.setPix(ctx, 255, 255, 0, 255);
        for (y=-100; y<=100; y+=10) {
            for (x=-100; x<=100; x+=10) {
                xyVec.setX(x);
                xyVec.setY(y);
                //xyVec = cpuSimEditorCoordinates.toCanvas(xyVec);
                //ctx.putImageData(pix, xyVec.getX(), xyVec.getY());
            }
        }
        */
    }
    
    this.render = function() {
        var objs = m.getModuleObjs();
        var i;
        var unique, moduleObj, obj;
        var canvas, ctx;
        

        canvas = document.getElementById('sim-window-canvas');
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.__renderGrid(ctx);
        
        for (i=2; i<objs.length; i++) {
            unique = objs[i].getName();
            moduleObj = objs[i];
            obj = moduleObj.getObj();
            this.__renderInCanvas(unique, moduleObj, obj, ctx);
        }
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
    
    this.selectObject = function(internalPixel) {
        var objs = m.getModuleObjs();
        var i;
        
        
        
        for (i=2; i<objs.length; i++) {
            unique = objs[i].getName();
            moduleObj = objs[i];
            obj = moduleObj.getObj();
            this.__renderInCanvas(unique, moduleObj, obj, ctx);
        }
    }
    
    this.editingModeChange = function(obj) {
        obj.parent().find('> a').removeClass('active');
        obj.addClass('active');
        editMode = parseInt(obj.attr('editMode'));
    }
    
    this.mouseDragLeft = function(internalDelta) {
        switch (editMode) {
            case EDIT_MODE_SELECT: 
                                     break;
            case EDIT_MODE_MOVE:     
                                     break;
        }
    }
    
    this.mouseDragRight = function(internalDelta) {
        cpuSimEditorCoordinates.viewCenterMove(internalDelta);
    }
    
    this.mouseLeftClick = function(internalPixel) {
        switch (editMode) {
            case EDIT_MODE_INTERACT: 
                                     break;
            case EDIT_MODE_SELECT:   this.selectObject(internalPixel);
            case EDIT_MODE_NAND:     this.addObject(internalPixel, 'GateNand');
                                     break;
        }
    }
    
    this.mouseRightClick = function(internalPixel) {
    }
    
    this.mouseMove = function(internalPixel) {
    }
    
    this.zoomChanged = function() {
        //this.render();
    }
}



