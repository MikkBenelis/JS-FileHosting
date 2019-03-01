"use strict";

// Main module
(function () {

    //////////////////////////////////////////////////
    // IMPORTS
    //////////////////////////////////////////////////

    const jwt = require("jsonwebtoken");
    const express = require("express");
    const multer = require("multer");
    const path = require("path");
    const fs = require("fs");

    const upload = multer({ dest : "uploads" });



    //////////////////////////////////////////////////
    // APP SETTINGS
    //////////////////////////////////////////////////

    const appPort = 3000;
    const appName = "JS FILE HOSTING";
    const jwtSecretKey = "secret_key";
    const indexFile = path.join(__dirname, "app.html");
    const publicDir = path.join(__dirname, "public");
    const uploadsDir = path.join(__dirname, "uploads");

    const app = express();
    app.use(express.static(publicDir));
    app.listen(appPort, () => {
        console.log(`[${appName}] Application started!`);
        console.log(`[${appName}] Running on ${appPort} port`);
    });



    //////////////////////////////////////////////////
    // AUTHENTICATION HANDLERS
    //////////////////////////////////////////////////

    app.get("/api/auth", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                res.sendStatus(200);
            }
        });
    });

    app.post("/api/login", upload.none(), (req, res, next) => {

        const user = {
            login : "mikk",
            password : "pass"
        }

        const reqLogin = req.body["login"];
        const reqPassword = req.body["password"];
        
        if (reqLogin === user.login && reqPassword === user.password) {
            jwt.sign({ user : user}, jwtSecretKey, { expiresIn : "360s"}, (err, token) => {
                res.cookie("Authorization", token, { httpOnly : true });
                res.sendStatus(200);
            });
        } else {
            res.sendStatus(401);
        }

    });

    app.post("/api/logout", (req, res, next) => {
        res.cookie("Authorization", "", { httpOnly : true });
        res.sendStatus(200);
    });

    function verifyToken(req, res, next) {
        const authCookieName = "Authorization";
        let cookieIndex = authCookieName.length + 1;
        const authHeader = req.headers["cookie"];
        if (typeof(authHeader) !== "undefined") {
            cookieIndex += authHeader.indexOf("Authorization");
            req.token = authHeader.substring(cookieIndex);
            next();
        } else {
            res.sendStatus(401);
        }
    }



    //////////////////////////////////////////////////
    // ROUTE HANDLERS
    //////////////////////////////////////////////////

    // Index
    app.get("/", (req, res, next) => {
        res.sendFile(indexFile);
    });

    // Upload files
    app.post("/api/upload", upload.array("files"), verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
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
            }
        });
    });

    // Update files
    app.put("/api/update", upload.array("files"), verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
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
            }
        });
    });

    // Download file
    app.get("/api/download/:filename", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const fileName = req.params["filename"];
                const filePath = path.join(uploadsDir, fileName);
                if (!fs.existsSync(filePath)) {
                    res.sendStatus(404);
                    return;
                }
                res.sendFile(filePath);
            }
        });
    });

    // Delete file
    app.delete("/api/delete/:filename", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const fileName = req.params["filename"];
                const filePath = path.join(uploadsDir, fileName);
                if (!fs.existsSync(filePath)) {
                    res.sendStatus(404);
                    return;
                }
                fs.unlinkSync(filePath);
                res.sendStatus(202);
            }
        });
    });

    // Get file size
    app.get("/api/size/:filename", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const fileName = req.params["filename"];
                const filePath = path.join(uploadsDir, fileName);
                if (!fs.existsSync(filePath)) {
                    res.sendStatus(404);
                    return;
                }
                const stats = fs.statSync(filePath);
                res.json(stats.size);
            }
        });
    });

    // Get whole files list
    app.get("/api/list", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const filesList = fs.readdirSync(uploadsDir);
                res.json({ files: filesList, authData });
            }
        });
    });

    // Get files list with given ext
    app.get("/api/list/ext/:ext?", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const ext = req.params["ext"];
                const filesList = fs.readdirSync(uploadsDir);
                const filteredList = filesList.filter(x => !ext ? x : x.endsWith(ext));
                res.json({ files : filteredList, authData });
            }
        });
    });

    // Get files list with given filter
    app.get("/api/list/filter/:filter?", verifyToken, (req, res, next) => {
        jwt.verify(req.token, jwtSecretKey, (err, authData) => {
            if (err) {
                res.sendStatus(401);
            } else {
                const filter = req.params["filter"];
                const filesList = fs.readdirSync(uploadsDir);
                const filteredList = filesList.filter(x => !filter ? x : x.includes(filter));
                res.json({ files : filteredList, authData });
            }
        });
    });

})();