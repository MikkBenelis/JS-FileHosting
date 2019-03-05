"use strict";

// Main module
(function () {

    //////////////////////////////////////////////////
    // IMPORTS
    //////////////////////////////////////////////////

    const jwt = require("jsonwebtoken");
    const express = require("express");
    const body_parser = require("body-parser");
    const { buildSchema } = require("graphql");
    const egraphql = require("express-graphql");
    const path = require("path");
    const fs = require("fs");



    //////////////////////////////////////////////////
    // APP SETTINGS
    //////////////////////////////////////////////////

    const appPort = 3000;
    const appName = "JS FILE HOSTING";
    const jwtSecretKey = "secret_key";
    const indexFile = path.join(__dirname, "app-gql.html");
    const publicDir = path.join(__dirname, "public");
    const uploadsDir = path.join(__dirname, "uploads");

    let schema = buildSchema(`
        type Query {
            login(login : String, password : String) : String,
            checkAuth(token : String) : String,
            getFiles(filterText : String, token : String) : String,
            deleteFile(fileName : String, token : String) : String,
            downloadFile(fileName : String, token : String) : String,
            uploadFile(fileName : String, file : String, token : String) : String
        }
    `);

    let root = {
        login: (args) => login(args.login, args.password),
        checkAuth: (args) => checkAuth(args.token),
        getFiles: (args) => getFiles(args.filterText, args.token),
        deleteFile: (args) => deleteFile(args.fileName, args.token),
        downloadFile: (args) => downloadFile(args.fileName, args.token),
        uploadFile: (args) => uploadFile(args.fileName, str2ab(decodeURIComponent(args.file)), args.token)
    };

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
          bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    const app = express();
    app.use(express.static(publicDir));
    app.use(body_parser.json({ limit : "5mb" }));
    app.use('/graphql',
        (req, res) => egraphql({
            schema: schema,
            rootValue: root,
            context: { req, res }
        })(req, res)
    );
    app.listen(appPort, () => {
        console.log(`[${appName}] Application started!`);
        console.log(`[${appName}] Running on ${appPort} port`);
    });



    //////////////////////////////////////////////////
    // AUTHENTICATION HANDLERS
    //////////////////////////////////////////////////

    function checkAuth(token) {
        try {
            jwt.verify(token, jwtSecretKey);
            return JSON.stringify({ status: 200 });
        } catch (ex) {
            return JSON.stringify({ status: 401 });
        }
        
    }

    function login(login, password) {

        const user = {
            login : "mikk",
            password : "pass"
        }
        
        if (login === user.login && password === user.password) {
            let token = jwt.sign({ user }, jwtSecretKey, { expiresIn : "360s"});
            return JSON.stringify({ status : 200, token });
        } else {
            return JSON.stringify({ status : 401 });
        }

    }



    //////////////////////////////////////////////////
    // ROUTE HANDLERS
    //////////////////////////////////////////////////

    // Index
    app.get("/", (req, res, next) => {
        res.sendFile(indexFile);
    });

    // Upload file
    function uploadFile(fileName, file, token) {
        console.log(file.length + " : " + file);
        try {
            jwt.verify(token, jwtSecretKey);
            const exists = fs.existsSync(path.join(uploadsDir, fileName));
            if (!exists) {
                const filePath = path.join(uploadsDir, fileName);
                const fileBuffer = new Buffer(file);
                fs.writeFile(filePath, fileBuffer, (err) => { });
            }
            return JSON.stringify({ status : exists ? 204 : 201 });
        }
        catch (ex) { 
            console.log(ex.message);
            return JSON.stringify({ status : 401 }); 
        }
    }

    // Download file
    function downloadFile(fileName, token) {
        try {
            jwt.verify(token, jwtSecretKey);
            const filePath = path.join(uploadsDir, fileName);
            if (!fs.existsSync(filePath))
                return JSON.stringify({ status : 404 });
            const fileData = fs.readFileSync(filePath);
            return JSON.stringify({
                status : 200,
                fileName: fileName,
                file: fileData
            });
        }
        catch (ex) { 
            return JSON.stringify({ status : 401 }); 
        }
    }

    // Delete file
    function deleteFile(fileName, token) {
        try {
            jwt.verify(token, jwtSecretKey);
            const filePath = path.join(uploadsDir, fileName);
            if (!fs.existsSync(filePath))
                return JSON.stringify({ status : 404 });
            fs.unlinkSync(filePath);
            return JSON.stringify({ status : 202 });
        }
        catch (ex) { 
            return JSON.stringify({ status : 401 }); 
        }
    };

    // Get files list with given filter
    function getFiles(filterText, token) {
        try {
            jwt.verify(token, jwtSecretKey);
            const filter = filterText;
            const filesList = fs.readdirSync(uploadsDir);
            const filteredList = filesList.filter(x => !filter ? x : x.includes(filter));
            return JSON.stringify({ status : 200, filesList : filteredList });
        }
        catch (ex) { 
            return JSON.stringify({ status : 401 }); 
        }
    }

})();