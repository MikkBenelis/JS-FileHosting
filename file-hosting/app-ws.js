"use strict";

// Main module
(function () {

    //////////////////////////////////////////////////
    // IMPORTS
    //////////////////////////////////////////////////

    const jwt = require("jsonwebtoken");
    const express = require("express");
    const path = require("path");
    const fs = require("fs");
    const http = require("http");
    const socketio = require("socket.io");
    const siofu = require("socketio-file-upload");



    //////////////////////////////////////////////////
    // APP SETTINGS
    //////////////////////////////////////////////////

    const appPort = 3000;
    const appName = "JS FILE HOSTING";
    const jwtSecretKey = "secret_key";
    const indexFile = path.join(__dirname, "app-ws.html");
    const publicDir = path.join(__dirname, "public");
    const uploadsDir = path.join(__dirname, "uploads");

    const app = express();
    app.use(express.static(publicDir));
    app.use(siofu.router);

    const server = http.createServer(app);
    const io = socketio(server);

    server.listen(appPort, () => {
        console.log(`[${appName}] Application started!`);
        console.log(`[${appName}] Running on ${appPort} port`);
    });



    //////////////////////////////////////////////////
    // SOCKET EVENT HANDLERS
    //////////////////////////////////////////////////

    // Index
    app.get("/", (req, res, next) => {
        res.sendFile(indexFile);
    });

    // Socket event handlers
    io.on("connection", socket => {
        console.log("client connected");

        // Check auth state
        socket.on("checkAuth", token => {
            jwt.verify(token, jwtSecretKey, (err, authData) => {
                socket.emit("checkedAuth", { status: err ? 401 : 200, authData });
            });
        });

        // Login handler
        socket.on("login", req => {
            const user = { login : "mikk", password : "pass" }
            if (req.login === user.login && req.password === user.password) {
                jwt.sign({ user }, jwtSecretKey, { expiresIn : "360s"}, (err, token) => {
                    socket.emit("loggedIn", { status: 200, token });
                });
            } else {
                socket.emit("loggedIn", { status: 401 });
            }
        });

        // Uploader settings
        let uploader = new siofu();
        uploader.dir = uploadsDir;
        uploader.listen(socket);

        // Upload file
        uploader.on("start", event => {
            jwt.verify(event.file.meta, jwtSecretKey, (err, authData) => {
                if (err) {
                    uploader.abort(event.file.id, socket);
                    socket.emit("notAuthorized");
                } else {
                    let partial = fs.existsSync(path.join(uploadsDir, event.file.name));
                    if (partial) uploader.abort(event.file.id, socket);
                    socket.emit("uploadedFiles", { status: partial ? 206 : 201, authData });
                }
            });
        });

        // Download file
        socket.on("downloadFile", req => {
            jwt.verify(req.token, jwtSecretKey, (err, authData) => {
                if (err) {
                    socket.emit("notAuthorized");
                } else {
                    const filePath = path.join(uploadsDir, req.fileName);
                    if (!fs.existsSync(filePath)) {
                        socket.emit("downloadedFile", { status: 404, authData });
                        return;
                    }
                    fs.readFile(filePath, (err, data) => {
                        socket.emit("downloadedFile", {
                            status: 200,
                            fileName: req.fileName,
                            file: data,
                            authData
                        });
                    });
                }
            });
        });

        // Delete file
        socket.on("deleteFile", req => {
            jwt.verify(req.token, jwtSecretKey, (err, authData) => {
                if (err) {
                    socket.emit("notAuthorized");
                } else {
                    const filePath = path.join(uploadsDir, req.fileName);
                    if (!fs.existsSync(filePath)) {
                        socket.emit("deletedFile", { status: 404, authData });
                        return;
                    }
                    fs.unlinkSync(filePath);
                    socket.emit("deletedFile", { status: 204, authData });
                }
            });
        });

        // Get filtered list
        socket.on("getFilteredList", req => {
            jwt.verify(req.token, jwtSecretKey, (err, authData) => {
                if (err) {
                    socket.emit("notAuthorized");
                } else {
                    const filter = req.filterText;
                    const filesList = fs.readdirSync(uploadsDir);
                    const filteredList = filesList.filter(x => !filter ? x : x.includes(filter));
                    socket.emit("gotFilesList", { status: 200, files: filteredList, authData });
                }
            });
        });
    });

})();