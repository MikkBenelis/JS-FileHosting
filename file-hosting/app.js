'use strict';

// Main module
(function () {

	//////////////////////////////////////////////////
	// IMPORTS
	//////////////////////////////////////////////////

	const express = require("express");
	const bodyParser = require("body-parser");
	const multer = require("multer");
	const path = require("path");
	const fs = require("fs");

	const upload = multer({ dest : 'uploads' });



	//////////////////////////////////////////////////
	// APP SETTINGS
	//////////////////////////////////////////////////

	const appName = "JS FILE HOSTING";
	const indexFile = path.join(__dirname, "app.html");
	const publicDir = path.join(__dirname, 'public');
	const viewsDir = path.join(__dirname, "views");
	const uploadsDir = path.join(__dirname, "uploads");

	const app = express();
	const appPort = 3000;

	app.use(express.static(publicDir));
	app.use(bodyParser.json());

	app.listen(appPort, () => {
		console.log(`[${appName}] Application started!`);
		console.log(`[${appName}] Running on ${appPort} port`);
	});



	//////////////////////////////////////////////////
	// ROUTE HANDLERS
	//////////////////////////////////////////////////

	// Index
	app.get("/", (req, res, next) => {
		res.sendFile(indexFile);
	});

	// Views
	app.get("/views/:view", (req, res, next) => {
		const viewName = `${req.params['view']}.html`;
		const viewFilePath = path.join(viewsDir, viewName);
		if (!fs.existsSync(viewFilePath)) {
			res.sendStatus(404);
			return;
		}
		res.sendFile(viewFilePath);
	});

	// Upload files
	app.post("/upload", upload.array("files"), (req, res, next) => {
		let partial = false;
		if (req.files) {
			req.files.forEach((f) => {
				const fname = path.join(uploadsDir, f.filename);
				const oname = path.join(uploadsDir, f.originalname);
				if (fs.existsSync(oname)) {
					fs.unlinkSync(fname);
					partial = true;
					return;
				}
				fs.renameSync(fname, oname);
			});
		}
		res.sendStatus(partial ? 206 : 201);
	});

	// Update files
	app.put("/update", upload.array("files"), (req, res, next) => {
		let partial = false;
		if (req.files) {
			req.files.forEach((f) => {
				const fname = path.join(uploadsDir, f.filename);
				const oname = path.join(uploadsDir, f.originalname);
				if (!fs.existsSync(oname)) {
					fs.unlinkSync(fname);
					partial = true;
					return;
				}
				fs.renameSync(fname, oname);
			});
		}
		res.sendStatus(partial ? 206 : 201);
	});

	// Download file
	app.get("/download/:filename", (req, res, next) => {
		const fileName = req.params['filename'];
		const filePath = path.join(uploadsDir, fileName);
		if (!fs.existsSync(filePath)) {
			res.sendStatus(404);
			return;
		}
		res.sendFile(filePath);
	});

	// Delete file
	app.delete("/delete/:filename", (req, res, next) => {
		const fileName = req.params['filename'];
		const filePath = path.join(uploadsDir, fileName);
		if (!fs.existsSync(filePath)) {
			res.sendStatus(404);
			return;
		}
		fs.unlinkSync(filePath);
		res.sendStatus(202);
	});

	// Get file size
	app.get("/size/:filename", (req, res, next) => {
		const fileName = req.params['filename'];
		const filePath = path.join(uploadsDir, fileName);
		if (!fs.existsSync(filePath)) {
			res.sendStatus(404);
			return;
		}
		const stats = fs.statSync(filePath);
		res.json(stats.size);
	});

	// Get whole files list
	app.get("/list", (req, res, next) => {
		const filesList = fs.readdirSync(uploadsDir);
		res.json(filesList);
	});

	// Get files list with given ext
	app.get("/list/ext/:ext?", (req, res, next) => {
		const ext = req.params['ext'];
		const filesList = fs.readdirSync(uploadsDir);
		res.json(filesList.filter(x => !ext ? x : x.endsWith(ext)));
	});

	// Get files list with given ext
	app.get("/list/filter/:filter?", (req, res, next) => {
		const filter = req.params['filter'];
		const filesList = fs.readdirSync(uploadsDir);
		res.json(filesList.filter(x => !filter ? x : x.includes(filter)));
	});

})();