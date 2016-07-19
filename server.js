
var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	serv_io = require("socket.io")(server),
    fs = require("fs"),
    MidiConvert = require("./MidiConvert");


app.use(express.static("./webapp"));

app.get("/",function(req,res){
	res.sendFile(__dirname+'/webapp/html/index.html');
});
app.get("/chooseSong",function(req,res){
    res.sendFile(__dirname+'/webapp/html/chooseSong.html');
});
app.get("/toneDemo",function(req,res){
    res.sendFile(__dirname+'/webapp/html/toneDemo.html');
});
server.listen((process.env.PORT || 5566),'0.0.0.0');

var color = ['#dc143c','#ffa500','#ffd700','#3cb371','#1e90ff','#00bfff','#9932cc'];
var joined = new Array(color.length);
var part = null;
var defaultSong = 'titanic.mid'
var playing = false;
var head = 0;
var duration = 20;
var room = 0;
var room_num = 2;

var partition = function(len){
    var r;
    if(head < len){
        if(head+20 < len){
            r = {"start":head,"end":head+duration};
            head+=duration;
        }
        else{
            r = {"start":head,"end":len};
            head = len;
        }
        console.log(r);
        return r;
    }
    else{
        return null;
    }
}
var sendNotes = function(){
    var r = partition(part.length);
    if(r != null){
        serv_io.sockets.in(color[room%room_num]).emit('part', part.slice(r.start,r.end)); 
        room++;
    }
    else{
        reset();
    }
}
var reset = function(){
    playing = false;
    head = 0;
    room = 0;
}
var allIn = function(){
	for(var i = 0; i < room_num; i++)
    		if(joined[i] != 1)
    			return false;
    return true;
}
serv_io.sockets.on('connection', function(socket) {


    socket.on('midi',function(songName){
        fs.readFile("midi/"+songName+".mid", "binary", function(err, data){
            if (!err){
                part = MidiConvert.parseParts(data)[0];
                serv_io.sockets.emit('midi',part);
            }else{
                console.log(err)
            }
        });
    })
    socket.on('chooseSong',function(songName){
        fs.readFile("midi/"+songName+".mid", "binary", function(err, data){
            if (!err && allIn()){
                part = MidiConvert.parseParts(data)[0];
                reset();
                sendNotes();
            }else{
                console.log(err);
            }
        });
    });
    socket.on('join', function(data) { 
		socket.join(data); 
    	joined[color.indexOf(data)] = 1; 
    	if(allIn() && !playing){
            if(!part){  
                serv_io.sockets.emit('command',"chooseSong");

                // fs.readFile("midi/" + defaultSong, "binary", function(err, data){
                //     if (!err){
                //             part = MidiConvert.parseParts(data)[0];
                //             sendNotes();
                //     }else{
                //         console.log(err);
                //     }
                // });
            }
            else{
                sendNotes(); 
            }
            playing = true;
        }
    });
    socket.on('leave', function(data) {
    	socket.leave(data); 
    });
    socket.on('ack',function(msg){
    	if(msg == "played"){ 
            sendNotes();
    	}
    });
});




