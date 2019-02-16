// APP CONFIG
//////////////////////////////////////////////////

var express = require('express');
var multer = require('multer');
var upload = multer({dest: 'public/uploads/'});
var fs = require('fs');

var app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));

var taskList = [];
var completedTasks = [];
var lastId = 0;

//////////////////////////////////////////////////



// ADD/CHECK/REMOVE TASK
//////////////////////////////////////////////////

app.post('/addtask', upload.single('newTaskFile'), function (req, res) {
	lastId++;
	const task = req.body.newTaskText;
	taskList.push
	({
		"id" : lastId,
		"text" : task,
		"attachment" : null
	});
	
	if (req.file) {
		const fname = req.file.filename;
		const oname = req.file.originalname;
		const fext = oname.substring(oname.lastIndexOf('.'));
		taskList[taskList.length - 1].attachment = "uploads/" + fname + fext;
		fs.rename(
			'public/uploads/' + fname,
			'public/uploads/' + fname + fext,
			function(err) { }
		);
	}
	res.redirect("/");
});

app.post('/checktask', upload.none(), function (req, res) {
	const checked = req.body.check;
	if (typeof checked === 'string') {
		taskList.forEach(function(t, i) {
			if (t.id == checked) {
				task = taskList.splice(i, 1)[0];
				completedTasks.push(task);
			}
		});
	} else if (typeof checked === 'object') {
		checked.forEach(function (c) {
			taskList.forEach(function(t, i) {
				if (t.id == c) {
					task = taskList.splice(i, 1)[0];
					completedTasks.push(task);
				}
			});
		});
	}
	res.redirect("/");
});

app.post("/removetask", upload.none(), function(req, res) {
	const checked = req.body.check;
	if (typeof checked === 'string') {
		taskList = taskList.filter(t => t.id != checked);
	} else if (typeof checked === 'object') {
		checked.forEach(function (c) {
			taskList = taskList.filter(t => t.id != c);
		});
	}
	res.redirect("/");
});

//////////////////////////////////////////////////



// APP RENDERER AND LISTENER
//////////////////////////////////////////////////

app.get("/", function(req, res) {
	res.render("index", { taskList, completedTasks });
});

app.listen(3000, function () {
	console.log('TODO app listening on port 3000!')
});

//////////////////////////////////////////////////