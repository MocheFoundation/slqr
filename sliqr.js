var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();
createHiDPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}

document.body.style="margin:0;padding:0";
let startB = document.createElement("button")
startB.innerHTML = "START PRESENTATION"
document.body.appendChild(startB)
startB.style="width:100%;height:100%;z-index:-1";
let slqr, width, height;
startB.onclick=()=>{
    document.body.requestFullscreen().then(function(){
    let canvas = createHiDPICanvas(document.body.clientWidth,document.body.clientHeight);
    document.body.appendChild(canvas);
    width = document.body.clientWidth;
    height = document.body.clientHeight;
    slqr = canvas.getContext("2d");
    startB.remove();
    present();
    setInterval(()=>{
        update();
        },20)
    document.addEventListener('keydown', (event) => {
        if([32,39,40,13].includes(event.keyCode)){
            play_next()
        }
        else if(85==event.keyCode){
            update();
        }
    });
    });
}

function value(vals){
    if(vals instanceof Var){
        return vals.val;
    }
    else if(!Array.isArray(vals)){
        return vals;
    }
    let output = [];
    for(var n of vals){
        if(n instanceof Var){
            output.push(n.val);
        }
        else{
            output.push(n);
        }
    }
    return output
}

class Var{
    constructor(value){
        this.val = value;
    }
    renew(){

    }
}
class Color extends Var{
    constructor(r,g,b,a){
        super();
        this.r = new Var(r);
        this.g = new Var(g);
        this.b = new Var(b);
        this.a = new Var(a);
        this.val = "";
        this.renew();
    }
    renew(){
        this.val = "rgba("+value(this.r)+","+value(this.g)+","+value(this.b)+","+value(this.a)+")";
    }
}

//-----------------------------------------------------------------

let lock = 0;

function Custom(func){
    return [func,[]]
}

function animate(a,b,d,pause=0,func=()=>{}){
    // f(x) = x-x^2
    // F(x) = x^2/2 - x^3/3
    setTimeout(()=>{
    let steps = [];
    let n = 6*(a.val-b)/(d**3)
    F = (x)=>{return n*x**3/3 - n*d*x**2/2;}
    for(var i=0;i<d*40;i++){
        steps.push(
          F(i/40+0.025)-F(i/40)
        );
    }
    steps.push(b);
    let counter = 0;
    let run = function(){
        a.val+=steps[counter];
        func();
        //update();
        counter++;
        if(counter==steps.length-1){
            a.val = steps[counter];
            update();
            clearInterval(runner);
            lock--;
        }
    }
    let runner;
    lock++;
    runner = setInterval(run,25)},pause*1000);
}
function Animate(a,b,d,pause){
    return [animate,[a,b,d,pause]];
}

function clear(time){
    for(let elem of elements){
        animate(elem.color.a,0,time);
        if(elem instanceof Slider){
            animate(elem.basecolor.a,0,time);
        }
    }
    for(char of chars1.concat(chars2)){
        setTimeout(()=>{elements = elements.filter(item=>item!=char)},1000*time);
    }
}

function Clear(time){
    return [clear,[time]];
}

function write(txt,step=1){
    if(txt instanceof TextArea){
        for(let tx in txt.texts){
            setTimeout(()=>{write(txt.texts[tx],step)},step/3*tx*1000);
        }
        return;
    }
    lock++;
    let x,y,text,color,size,align,font;
    [x,y,text,color,size,align,font] = value([txt.x,txt.y,txt.text,txt.color,txt.size,txt.align,txt.font]);
    color = txt.color;
    let X;
    slqr.font = size + "vh " + font;
    if(align == "left"){
        X = x*width;
    }
    else if(align == "center"){
        X = x*width - slqr.measureText(text).width/2;
    }
    let chars1 = [];
    for(let i=0;i<text.length;i++){
        chars1.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],new Color(color.r.val,color.g.val,color.b.val,0),size,"left",font));
        chars1[i].func = "stroke";
    }
    let chars2 = [];
    for(let i=0;i<text.length;i++){
        chars2.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],new Color(color.r.val,color.g.val,color.b.val,0),size,"left",font));
    }
    for(let char in chars1){
        add(chars1[char]);
        animate(chars1[char].color.a,1,step,step/10*char);
        animate(chars1[char].color.a,0,step,step*2);
    }
    for(let char in chars2){
        add(chars2[char]);
        animate(chars2[char].color.a,1,step,step/10*3 + step/10*char);
    }
    setTimeout(()=>{
        for(char of chars1.concat(chars2)){
            elements = elements.filter(item=>item!=char);
        }
        txt.color.a.val = 1;
        update();
        lock--;
    },step*1000+chars1.length*step/10*1000+step*2*1000);
}
function Write(txt,step){
    return [write,[txt,step]];
}

function morphText(txt,newtxt,time){
    lock++;
    let x,y,text,color,size,align,font;
    [x,y,text,size,align,font] = value([txt.x,txt.y,txt.text,txt.size,txt.align,txt.font]);
    color = txt.color;
    slqr.font = size + "vh " + font;
    let w = slqr.measureText(text).width;
    let X = x*width - w/2;
    let chars1 = [];
    for(let i=0;i<text.length;i++){
        chars1.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],new Color(color.r.val,color.g.val,color.b.val,1),size,"left",font));
        add(chars1[chars1.length-1]);
    }
    for(let ch of chars1){
        setTimeout(()=>{
            elements = elements.filter(item=>item!=ch);
            update();
    },time*1000);}
    w = slqr.measureText(newtxt).width;
    X = x*width - w/2;
    for(let i=0;i<newtxt.length;i++){
        console.log(newtxt[i])
        let found = false;
        for(ch of chars1){
            if(ch.text.val == newtxt[i]){
                console.log("BS")
                chars1 = chars1.filter(item=>item!=ch);
                animate(ch.x,(X+slqr.measureText(newtxt.slice(0,i+1)).width-slqr.measureText(newtxt.slice(i,i+1)).width)/width,time);
                found = true;
            }
        }
        if(!found){
            let t = new Text((X+slqr.measureText(newtxt.slice(0,i+1)).width-slqr.measureText(newtxt.slice(i,i+1)).width)/width,y,newtxt[i],new Color(color.r.val,color.g.val,color.b.val,0),size,"left",font)
            add(t);
            setTimeout(()=>{write(t,time/2);},time/4*1000);
            setTimeout(()=>{elements = elements.filter(item=>item!=t);},time*1000)
        }
    }
    for(let ch of chars1){
        animate(ch.color.a,0,time/2);
    }
    elements = elements.filter(item=>item!=txt);
    setTimeout(()=>{
        txt.text.val = newtxt;
        add(txt);
        lock--;
    },time*1000)
}

function MorphText(txt,newtxt,time){
    return [morphText,[txt,newtxt,time]];
}

//-------------------------------------------------------------------------------------------

class Element{
    constructor(){

    }
    center(){
        if(this.x instanceof Var){
            this.x.val -= value(this.w)/2;
        }else{ this.x -= value(this.w/2); }
        if(this.y instanceof Var){
            this.y.val -= value(this.h)/2;
        }else{ this.y -= value(this.h/2); }
    }
}

class Rect extends Element{
    constructor(x,y,w,h,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.w = new Var(w);
        this.h = new Var(h);
        this.color = color;
    }
    display(){
        let x,y,w,h,color;
        [x,y,w,h,color] = value([this.x,this.y,this.w,this.h,this.color]);
        rect(x*width,y*height,w*width,h*height,color);
    }
}

class Picture extends Element{
    constructor(x,y,src,size=0.5){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.size = new Var(size);
        this.img = new Image();
        this.img.src = src;
        this.color = AWHITE;
        this.percentage = new Var(1);
    }
    display(){
        let x,y,size,img,percentage;
        [x,y,size,img,percentage] = value([this.x,this.y,this.size,this.img,this.percentage]);
        slqr.drawImage(img,0,0,percentage*img.width,img.height,x*width-size*height/2,y*height-size*img.width/img.height*height/2,percentage*size*height,size*img.width/img.height*height)
        //slqr.drawImage(img,0,0,width,height)
    }
}

class Slider extends Element{
    constructor(x,y,w,h,color=new Color(150,150,150,1),percentage=0,interval=1){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.w = new Var(w);
        this.h = new Var(h);
        this.percentage = new Var(percentage);
        this.interval = new Var(interval)
        this.color = color;
        this.basecolor = new Color(255,255,255,1);
    }
    display(){
        let x,y,w,h,percentage,color,interval;
        let sliderh,sliderw;
        [x,y,w,h,color,percentage,interval] = value([this.x,this.y,this.w,this.h,this.color,this.percentage,this.interval]);
        sliderw = w*4
        sliderh = h/8;
        rect(x*width-w*width/2,y*height-h*height/2,w*width,h*height,this.basecolor.val);
        rect(x*width-sliderw*width/2,y*height+h*height/2-sliderh*height-(7/8*h*height)*percentage/interval,sliderw*width,sliderh*height,color);

    }
}

class Ellipse extends Element{
    constructor(x,y,r1,r2,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.r1 = new Var(r1);
        this.r2 = new Var(r2);
        this.w = 2*value(this.r1);
        this.h = 2*value(this.r2);
        this.color = color;
    }
    display(){
        let x,y,r1,r2,color;
        [x,y,r1,r2,color] = value([this.x,this.y,this.r1,this.r2,this.color]);
        ellipse(x*width,y*height,r1*width,r2*height,color);
    }
}

class Line extends Element{
    constructor(x1,y1,x2,y2,color){
        super()
        this.x1 = new Var(x1);
        this.y1 = new Var(y1);
        this.x2 = new Var(x2);
        this.y2 = new Var(y2);
        this.color = color;
    }
    display(){
        let x1,y1,x2,y2,color;
        [x1,y1,x2,y2,color] = value([this.x1,this.y1,this.x2,this.y2,this.color]);
        line(x1*width,y1*height,x2*width,y2*height,color);
    }
}

class Text extends Element{
    constructor(x,y,text,color,size=8,align="center",font="Computer Modern Serif"){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.text = new Var(text);
        this.size = new Var(size);
        this.color = color;
        this.align = new Var(align);
        this.font = new Var(font);
        this.func = "fill";
    }
    display(){
        let x,y,text,color,size,align,font;
        [x,y,text,color,size,align,font] = value([this.x,this.y,this.text,this.color,this.size,this.align,this.font]);
        textbox(x,y,text,color,size,align,font,this.func)
    }
}

class TextArea extends Element{
    constructor(texts,align="top"){
        super();
        this.color = colcopy(BLACK);
        this.texts = texts;
        for(var txt in texts){
            if(txt>0){
                slqr.font = texts[txt-1].size.val+"vh "+texts[txt-1].font.val;
                let m1 = slqr.measureText(texts[txt-1].text);
                slqr.font = texts[txt].size.val+"vh "+texts[txt].font.val;
                let m2 = slqr.measureText(texts[txt].text);
                texts[txt].y.val = texts[txt-1].y.val + (m1.actualBoundingBoxAscent/2 + m1.actualBoundingBoxDescent + m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent)/width;                ;
            }
        }
    }
    display(){

    }
}

//------------------------------------------

function colcopy(color){
    return new Color(color.r.val,color.g.val,color.b.val,color.a.val);
}

const WHITE = new Color(255,255,255,1)
const AWHITE = new Color(255,255,255,0);
const BLACK = new Color(0,0,0,1);

function rect(x,y,w,h,color){
    slqr.fillStyle = value(color);
    slqr.beginPath();
    slqr.fillRect(parseInt(x), parseInt(y), parseInt(w), parseInt(h));
}

function ellipse(x,y,r1,r2,color){
    slqr.fillStyle = value(color);
    slqr.beginPath();
    slqr.ellipse(x, y, r1, r2, 0, 0, 2 * Math.PI);
    slqr.fill();
}

function textbox(x,y,text,color,size,align,font,func){
    slqr.fillStyle = value(color);
    slqr.lineWidth = 1;
    if(func=="stroke"){slqr.strokeStyle = slqr.fillStyle;}
    else{slqr.strokeStyle = "rgba(0,0,0,0)";}
    slqr.font = size+"vh "+font;
    slqr.textAlign = align;
    if(func=="fill"){
        slqr.fillText(text,x*width,y*height);
    }
    else{
        slqr.strokeText(text,x*width,y*height);
    }
}

function line(x1,y1,x2,y2,color){
    slqr.beginPath();
    slqr.strokeStyle = color;
    slqr.lineWidth = 3;
    slqr.moveTo(x1, y1);
    slqr.lineTo(x2, y2);
    slqr.stroke();
}

//-------------------------------------------

let elements = [];
let commands = [];
function add(){
    //console.log(args)
    for(var elem of arguments){
        elements.push(elem);
    }
    //play_next();
}
function f_add(args){
    //console.log(args)
    for(var elem of args){
        elements.push(elem);
    }
    play_next();
}
function f_Add(args){
    return [f_add,[args]];
}
function Add(){
    Play(f_Add(Array.from(arguments)));
}
function update(){
    for(elem of elements){
        elem.color.renew()
        if(elem instanceof Slider){
            elem.basecolor.renew();
        }
    }

    rect(0,0,width,height,BLACK);
    for(elem of elements){
        elem.display();
    }
}

//-----------------------------------------------

function Play(){
    commands.push(Array.from(arguments));
}

function play_next(){
    if(lock>0)return;
    for(let command of commands.shift()){command[0](...command[1]);}
}
