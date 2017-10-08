const express = require('express');
const pug = require('pug');


var app = express()
var http = require('http')
var server = http.createServer(app);
var io = require('socket.io')(server)

app.set('view engine', 'pug')
app.use(express.static('public'))

var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json();
var urlParser = bodyParser.urlencoded({ extended: false });

var rooms = {} // map socket.id to room 
var roomname = {} // map of room id to name
var data = {} // map socket id to data

app.use(cookieSession({
  name: 'session',
  keys: ['@n00j'],
	maxAge: 1 * 60 * 60 * 1000 // 1 hour
}));


io.on('connection', function(socket) {
  console.log('a user connected');

socket.on('disconnect', function() {
    console.log('user disconnected');
});

socket.on('room', function(room) {
    console.log('user connected to room '+room);
	rooms[socket.id] = room;
	socket.join(room);
	socket.emit('newcollab-name', roomname[room]);
	if (!(room in data)) {
		console.log('initialized list for ' + socket.id);
		data[room] = new Array();
	} else {
		for (var i = 0; i < data[room].length; ++i) {
			console.log('broadcasting ' + data[room][i] + ' to ' + room);
			socket.emit('newcollab', data[room][i]);
		}
	}
	
});

socket.on('add', function(item) {
	room = rooms[socket.id];
	if (!(room in data)) {
		data[room] = new Array();
	} else {
		data[room].push(item)
	}
	console.log('data: ' + data + ' item is ' + item);
	socket.broadcast.to(room).emit('added', item);
});

});


app.get('/', function(req, res) {
	res.render('index');
})

app.get('/list/:id', function(req, res) {
	res.render('list', { id: req.params.id, name: req.session.listname })
	
})

app.post('/create', urlParser, function(req, res) {
	var listid = Math.random().toString(36).substr(2, 5);
	console.log('room name ' + req.body.listname + ' is assigned value ' + listid);
	roomname[listid]=req.body.listname;
	res.redirect('/list/' + listid);
})

app.post('/add', urlParser, function(req, res) {
	console.log('item ' + req.body.item + ' added to list ' + req.body.id);
	res.redirect('/list/'+req.body.id);
});


server.listen(3000, function () {
	console.log('sociolist is running on port 3000');
});