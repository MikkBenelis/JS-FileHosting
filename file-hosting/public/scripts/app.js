'use strict';

document.addEventListener('DOMContentLoaded', () => {

    window.addEventListener('hashchange', 
        (e) => updateView());

    const updateView = (function inner() {
        let view = 'home';
        const hash = window.location.hash;
        if (hash && hash.substr(1).length > 0)
            view = hash.substr(1);
        const url = `views/${view}.html`;
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4) {
                document.getElementById('app').innerHTML = 
                    (this.status === 200)
                    ? this.responseText
                    : this.status;
            }
        };
        xhttp.open('GET', url, true);
        xhttp.send();
        return inner;
    })();
});

function uploadFiles() {
    let req = new XMLHttpRequest();
    let formData = new FormData();
    const files = document.getElementById("files-to-upload").files;
    for (let i = 0; i < files.length; i++)
        formData.append("files", files[i]);
    req.open("POST", 'upload');
    req.send(formData);
}

function getFilesList() {
    const filterText = document.getElementById('filter-text').value;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            let result = this.status;
            if (this.status === 200) {
                result = "";
                const response = JSON.parse(this.responseText);
                for (let key in response) {
                    result += 
                        `<li class="active list-group-item list-group-item-primary">
                            <a download href="/download/${response[key]}" class="float-left">[V]</a>
                            ${response[key]}
                            <a class="float-right" onclick="deleteFile('${response[key]}')">[X]</a>
                        </li>\n`;
                };
            }
            document.getElementById('files-list').innerHTML = result;
        }
    };
    xhttp.open('GET', `list/filter/${filterText}`, true);
    xhttp.send();
}

function deleteFile(fileName) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 202) {
                getFilesList();
            }
        }
    };
    xhttp.open('DELETE', `delete/${fileName}`, true);
    xhttp.send();
}