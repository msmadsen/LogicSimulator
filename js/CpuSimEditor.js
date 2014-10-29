var SIM_FPS = 40.0;
var SIM_FRAME_TIME = 1000.0/SIM_FPS;
var SIM_INTERVAL_ID;

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
    
    
    this.redrawStart = function() {
        SIM_INTERVAL_ID = setInterval("cpuSimEditor.render();", Math.round(SIM_FRAME_TIME));
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
                //console.log(vec.toString());
                i++;
            }
        console.log('Dodano: '+i);
    }
    
    this.__renderInDivNew = function(unique, moduleObj, obj) {
        var cssClass;
        var pinArr;
        var i;

        switch (obj.getObjClass()) {
            case 'GateNand': cssClass = 'gate-nand'; break;
            case 'GateAnd':  cssClass = 'gate-and';  break;
            case 'GateOr':   cssClass = 'gate-or';   break;
            case 'GateNot':  cssClass = 'gate-not';  break;
            case 'GateXor':  cssClass = 'gate-xor';  break;
            case 'GateNor':  cssClass = 'gate-nor';  break;
            case 'GateXnor': cssClass = 'gate-xnor'; break;
        }
        
        $('#sim-window-div').append('<div id="'+unique+'" class="'+cssClass+'" style="top: 0px; left: 0px; width: 0px; height: 0px;"></div>');
        pinArr = obj.getInputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            $('#'+unique).append('<div class="in in-'+i+'" pin="'+i+'" style="top: 0px; left: 0px; width: 0px; height: 0px;">&nbsp;</div>');
        }
        pinArr = obj.getOutputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            $('#'+unique).append('<div class="out out-'+i+'" pin="'+i+'" style="top: 0px; left: 0px; width: 0px; height: 0px;">&nbsp;</div>');
        }
    }
    
    this.__renderInDivUpdate = function(unique, moduleObj, obj) {
        var canvasPix;
        var w, h, x, y, pin;
        var pinArr;
        var i;
        var p, s;
        var jQpin;
        
        p = moduleObj.getPos();
        s = obj.getSize();
        
        canvasPix = cpuSimEditorCoordinates.toCanvas(p);
        w = cpuSimEditorCoordinates.toCanvasUnit(s.getX());
        h = cpuSimEditorCoordinates.toCanvasUnit(s.getY());

        $('#'+unique).css('left', canvasPix.getX()+'px');
        $('#'+unique).css('top', canvasPix.getY()+'px');
        $('#'+unique).css('width', w+'px');
        $('#'+unique).css('height', h+'px');
        
        pinArr = obj.getInputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            x = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            y = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );
            
            jQpin = $('#'+unique).find('> div.in-'+i);
            jQpin.css('left', x+'px');
            jQpin.css('top', y+'px');
            jQpin.css('width', pin+'px');
            jQpin.css('height', pin+'px');
        }
        pinArr = obj.getOutputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            x = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            y = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );

            jQpin = $('#'+unique).find('> div.out-'+i);
            jQpin.css('left', x+'px');
            jQpin.css('top', y+'px');
            jQpin.css('width', pin+'px');
            jQpin.css('height', pin+'px');
        }
    }
    
    this.__renderInCanvas = function(unique, moduleObj, obj, ctx) {
        var canvasPix;
        var w, h, x, y, pin;
        var pinArr;
        var i;
        var p, s;
        var jQpin;
        
        p = moduleObj.getPos();
        s = obj.getSize();
        
        canvasPix = cpuSimEditorCoordinates.toCanvas(p);
        w = cpuSimEditorCoordinates.toCanvasUnit(s.getX());
        h = cpuSimEditorCoordinates.toCanvasUnit(s.getY());
        
        ctx.strokeStyle = '#f00'; // red
        ctx.lineWidth = 1;
        ctx.strokeRect(canvasPix.getX(), canvasPix.getY(), w, h);

        /*
        pinArr = obj.getInputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            x = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            y = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );
            
            jQpin = $('#'+unique).find('> div.in-'+i);
            jQpin.css('left', x+'px');
            jQpin.css('top', y+'px');
            jQpin.css('width', pin+'px');
            jQpin.css('height', pin+'px');
        }
        pinArr = obj.getOutputBitsLocations();
        for (i=0; i<pinArr.length; i++) {
            x = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getX() );
            y = cpuSimEditorCoordinates.toCanvasUnit( pinArr[i].getY() );
            pin = cpuSimEditorCoordinates.toCanvasUnit( PIN_SIZE );

            jQpin = $('#'+unique).find('> div.out-'+i);
            jQpin.css('left', x+'px');
            jQpin.css('top', y+'px');
            jQpin.css('width', pin+'px');
            jQpin.css('height', pin+'px');
        }
        */
    }
    
    this.render = function() {
        var objs = m.getModuleObjs();
        var i;
        var unique, s, p, moduleObj, obj;
        
        // render in DIV
        /*
        $('#sim-window-div > div').addClass('delme');
        for (i=2; i<objs.length; i++) {
            unique = objs[i].getName();
            moduleObj = objs[i];
            obj = moduleObj.getObj();

            if ($('#'+unique).size()==0)
                this.__renderInDivNew(unique, moduleObj, obj); // create div

            this.__renderInDivUpdate(unique, moduleObj, obj);  // update div
            
            $('#'+unique).removeClass('delme');
        }
        
        $('#sim-window-div > div.delme').remove();
        */
        
        
        // render in CANVAS
        var canvas, ctx;

        canvas = document.getElementById('sim-window-canvas');
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        
        //this.render();
    }
    
    this.editingModeChange = function(obj) {
        obj.parent().find('> a').removeClass('active');
        obj.addClass('active');
        editMode = parseInt(obj.attr('editMode'));
    }
    
    this.mouseDragLeft = function(internalDelta) {
    }
    
    this.mouseDragRight = function(internalDelta) {
        cpuSimEditorCoordinates.viewCenterMove(internalDelta);
        //this.render();
    }
    
    this.mouseLeftClick = function(internalPixel) {
        switch (editMode) {
            case EDIT_MODE_INTERACT: 
                                     break;
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



