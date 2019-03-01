"use strict";

//////////////////////////////////////////////////
// SPA HANDLERS
//////////////////////////////////////////////////

var socket = io();
var uploader = new SocketIOFileUpload(socket);
uploader.listenOnInput(document.getElementById("files-to-upload"));
uploader.addEventListener("start", event => {
    event.file.meta = localStorage.getItem("auth-token");
});

document.addEventListener("DOMContentLoaded", () => {

    window.addEventListener("hashchange", 
        (e) => updateView());

    const updateView = (function inner() {
        let view = "home";
        const hash = window.location.hash;
        if (hash && hash.substr(1).length > 0)
            view = hash.substr(1);
        const url = `views/${view}.html`;
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4) {
                document.getElementById("app").innerHTML = 
                    (this.status === 200)
                    ? this.responseText
                    : this.status;
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
        return inner;
    })();

    checkAuth();

});



//////////////////////////////////////////////////
// AUTH HANDLERS
//////////////////////////////////////////////////

function checkAuth() {
    socket.emit("checkAuth", localStorage.getItem("auth-token"));
}

socket.on("checkedAuth", response => {
    console.log(`CheckedAuth: ${response.status}`);
    if (response.status === 200) {
        document.getElementById("authorized-nav").classList.remove("d-none");
        document.getElementById("authorized-nav").classList.add("d-flex");
        document.getElementById("unauthorized-nav").classList.remove("d-flex");
        document.getElementById("unauthorized-nav").classList.add("d-none");
    } else {
        document.getElementById("authorized-nav").classList.remove("d-flex");
        document.getElementById("authorized-nav").classList.add("d-none");
        document.getElementById("unauthorized-nav").classList.remove("d-none");
        document.getElementById("unauthorized-nav").classList.add("d-flex");
    }
});

function login() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    socket.emit("login", { login, password });
}

socket.on("loggedIn", (response) => {
    console.log(`LoggedIn: ${response.status}`);
    if (response.status === 200) {
        localStorage.setItem("auth-token", response.token);
        window.location.hash = "#home";
        checkAuth();
    }
});

function logout() {
    localStorage.removeItem("auth-token");
    window.location.hash = "#signin";
    checkAuth();
}



//////////////////////////////////////////////////
// FILE HANDLERS
//////////////////////////////////////////////////

socket.on("notAuthorized", () => {
    window.location.hash = "#signin";
});

function uploadFiles() {
    //uploader.listenOnSubmit();
    //socket.emit("uploadFiles", { formData, token: localStorage.getItem("auth-token") });
}

socket.on("uploadedFiles", response => {
    console.log(`UploadedFiles: ${response.status}`);
    window.location.hash = "#list";
});

function downloadFile(fileName) {
    socket.emit("downloadFile", { fileName, token: localStorage.getItem("auth-token") });
}

socket.on("downloadedFile", response => {
    console.log(`DownloadedFile: ${response.status}`);
    if (response.status === 200) {
        var saveFile = (function () {
            var a = document.createElement("a");
            a.style = "display: none";
            document.body.appendChild(a);
            return function (data, name) {
                var blob = new Blob(data, {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = name;
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            };
        }());
        saveFile([response.file], response.fileName);
    }
});

function getFilesList() {
    const filterText = document.getElementById("filter-text").value;
    socket.emit("getFilteredList", { filterText, token: localStorage.getItem("auth-token") });
}

socket.on("gotFilesList", response => {
    console.log(`GotFilesList: ${response.status}`);
    let result = "";
    for (let key in response["files"]) {
        result += 
            `<li class="active list-group-item list-group-item-primary">
                <a class="float-left" onclick="downloadFile('${response["files"][key]}')">[V]</a>
                ${response["files"][key]}
                <a class="float-right" onclick="deleteFile('${response["files"][key]}')">[X]</a>
            </li>\n`;
    };
    document.getElementById('files-list').innerHTML = result;
});

function deleteFile(fileName) {
    socket.emit("deleteFile", { fileName, token: localStorage.getItem("auth-token") });
}

socket.on("deletedFile", response => {
    console.log(`DeletedFile: ${response.status}`);
    getFilesList();
});