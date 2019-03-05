"use strict";

//////////////////////////////////////////////////
// SPA HANDLERS
//////////////////////////////////////////////////

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
    const token = localStorage.getItem("auth-token");
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", `/graphql`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({"query": `{ checkAuth(token:\"${token}\") }`}));
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const gqlResponse = JSON.parse(this.responseText);
            const checkAuthResponse = JSON.parse(gqlResponse["data"]["checkAuth"]);
            console.log(`CheckAuth: ${checkAuthResponse["status"]}`);
            if (checkAuthResponse["status"] === 200) {
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
        }
    }
}

function login() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", `/graphql`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({"query": `{ login(login:\"${login}\",password:\"${password}\") }`}));
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const gqlResponse = JSON.parse(this.responseText);
            const loginResponse = JSON.parse(gqlResponse["data"]["login"]);
            console.log(`Login: ${loginResponse["status"]}`);
            if (loginResponse["status"] === 200) {
                const token = loginResponse["token"];
                localStorage.setItem("auth-token", token);
                window.location.hash = "#home";
                checkAuth();
            }
        }
    }
}

function logout() {
    localStorage.removeItem("auth-token");
    window.location.hash = "#signin";
    checkAuth();
}



//////////////////////////////////////////////////
// FILE HANDLERS
//////////////////////////////////////////////////

function uploadFiles() {

    const filesList = document.getElementById("files-to-upload").files;
    for (let i = 0, f; i < filesList.length; i++) {
        const reader = new FileReader();
        reader.fileName = filesList[i].name;
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) {
                const token = localStorage.getItem("auth-token");
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const gqlResponse = JSON.parse(this.responseText);
                        console.log(gqlResponse);
                        const uploadFileResponse = JSON.parse(gqlResponse["data"]["uploadFile"]);
                        console.log(`UploadFiles: ${uploadFileResponse["status"]}`);
                        if (uploadFileResponse["status"] === 201 || uploadFileResponse["status"] === 204) {
                            document.getElementById("files-to-upload").value = null;
                        } else {
                            window.location.hash = "#signin";
                            return;
                        }
                    }
                };
                const fileName = evt.target.fileName;
                const file = encodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(evt.target.result)));
                xhttp.open("POST", `/graphql`, true);
                xhttp.setRequestHeader("Content-Type", "application/json");
                xhttp.send(JSON.stringify({"query": `{ uploadFile(fileName:\"${fileName}\", file:\"${file}\", token:\"${token}\") }`}));
            }
        };
        reader.readAsArrayBuffer(filesList[i]);
    }
}

function downloadFile(fileName) {
    const token = localStorage.getItem("auth-token");
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const gqlResponse = JSON.parse(this.responseText);
            const downloadFileResponse = JSON.parse(gqlResponse["data"]["downloadFile"]);
            console.log(`DownloadFile: ${downloadFileResponse["status"]}`);
            if (downloadFileResponse["status"] === 200) {
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
                const fileData = downloadFileResponse["file"]["data"];
                const fileDataArray = new Uint8Array(fileData);
                saveFile([fileDataArray], downloadFileResponse["fileName"]);
            } else {
                window.location.hash = "#signin";
                return;
            }
        }
    };
    xhttp.open("POST", `/graphql`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({"query": `{ downloadFile(fileName:\"${fileName}\", token:\"${token}\") }`}));
}

function getFilesList() {
    const token = localStorage.getItem("auth-token");
    const filterText = document.getElementById("filter-text").value;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            let result = "";
            const gqlResponse = JSON.parse(this.responseText);
            const getFilesResponse = JSON.parse(gqlResponse["data"]["getFiles"]);
            console.log(`GetFiles: ${getFilesResponse["status"]}`);
            if (getFilesResponse["status"] === 200) {
                getFilesResponse["filesList"].forEach((file) => { 
                    result += 
                        `<li class="active list-group-item list-group-item-primary">
                            <a class="float-left" onclick="downloadFile('${file}')">[V]</a>
                            ${file}
                            <a class="float-right" onclick="deleteFile('${file}')">[X]</a>
                        </li>\n`;
                });
            } else {
                window.location.hash = "#signin";
                return;
            }
            document.getElementById('files-list').innerHTML = result;
        }
    };
    xhttp.open("POST", `/graphql`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({"query": `{ getFiles(filterText:\"${filterText}\", token:\"${token}\") }`}));
}

function deleteFile(fileName) {
    const token = localStorage.getItem("auth-token");
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const gqlResponse = JSON.parse(this.responseText);
            const deleteFileResponse = JSON.parse(gqlResponse["data"]["deleteFile"]);
            console.log(`DeleteFile: ${deleteFileResponse["status"]}`);
            if (deleteFileResponse["status"] === 202) {
                getFilesList();
            } else {
                window.location.hash = "#signin";
                return;
            }
        }
    };
    xhttp.open("POST", `/graphql`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({"query": `{ deleteFile(fileName:\"${fileName}\", token:\"${token}\") }`}));
}