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
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/api/auth");
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
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
    let formData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    xhttp.open("POST", "/api/login");
    xhttp.send(formData);
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                window.location.hash = "#home";
                checkAuth();
            }
        }
    }
}

function logout() {
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/api/logout");
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                checkAuth();
            }
        }
    }
}



//////////////////////////////////////////////////
// FILE HANDLERS
//////////////////////////////////////////////////

function uploadFiles() {
    let xhttp = new XMLHttpRequest();
    let formData = new FormData();
    const files = document.getElementById("files-to-upload").files;
    for (let i = 0; i < files.length; i++)
        formData.append("files", files[i]);
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            document.getElementById("files-to-upload").value = null;
            window.location.hash = (this.status === 401) ? "#signin" : "#list";
        }
    };
    xhttp.open("POST", "/api/upload");
    xhttp.send(formData);
}

function getFilesList() {
    const filterText = document.getElementById("filter-text").value;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            let result = this.status;
            if (this.status === 200) {
                result = "";
                const response = JSON.parse(this.responseText);
                for (let key in response["files"]) {
                    result += 
                        `<li class="active list-group-item list-group-item-primary">
                            <a download href="/api/download/${response["files"][key]}" class="float-left">[V]</a>
                            ${response["files"][key]}
                            <a class="float-right" onclick="deleteFile('${response["files"][key]}')">[X]</a>
                        </li>\n`;
                };
            } else {
                window.location.hash = "#signin";
                return;
            }
            document.getElementById('files-list').innerHTML = result;
        }
    };
    xhttp.open("GET", `/api/list/filter/${filterText}`, true);
    xhttp.send();
}

function deleteFile(fileName) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 202) {
                getFilesList();
            } else {
                window.location.hash = "#signin";
                return;
            }
        }
    };
    xhttp.open("DELETE", `/api/delete/${fileName}`, true);
    xhttp.send();
}