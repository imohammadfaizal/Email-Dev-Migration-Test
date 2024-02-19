let modifiedCode = document.getElementById('modified-file');
let originalCode = document.getElementById('original-file');
let lineCountCache = 0;
const HTMLDocStandard = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`;
const iframeHTML = "<iframe id='my-iframe' height='1000'  class='w-100 ' ></iframe>"
let wrapper = document.getElementById('wrapper');
let iframes = document.getElementsByTagName('iframe');
let m = iframes.length;
let HREF;
let newUrl;
let fileToUpload;
document.getElementById('upload-file').addEventListener('change', handleFileUpload, false);
$("#original-file").keyup(() => { $("#submit-btn").removeClass("disabled"); })

function iframeCodeUpdate(codeToUpdate) {
    wrapper.innerHTML = iframeHTML;
    document.getElementById("my-iframe").contentWindow.document.write(codeToUpdate);
    line_counter('modified');
    disableDownload();
    return codeToUpdate;
}

let handleSubmit = async function () {
    purgeContainers();
    await iframeCodeUpdate(originalCode.value);
    handleEventsInAnchor();
}

let handleEventsInAnchor = function () {
    for (let j = 0; j < m; j++) {
        HREF = iframes[j].contentDocument.querySelectorAll("a");
    }
    for (let d = 0; d < HREF.length; d++) {
        HREF[d].addEventListener("click", (evt) => {
            evt.preventDefault();
            $(".hidden-link-modal").click();
            $("#new-url").val("");
            $("#current-url").val(evt.currentTarget.href);
            newUrl = HREF[d];
            ((evt.currentTarget).outerHTML) ? $("#alias").val(evt.currentTarget.getAttribute("alias")) : $("#alias").val("");
        })
    }
}

let handleExtraction = async function () {
    let IMGmatches = new Map();
    let j;
    for (j = 0; j < m; j++) {
        let IMGelems = iframes[j].contentDocument.getElementsByTagName("img");
        let IMGBgelems = iframes[j].contentDocument.getElementsByTagName("td");
        for (let d = 0; d < IMGelems.length; d++) {
            IMGmatches.set(IMGelems[d].src, IMGelems[d].alt);
        }
        for (let d = 0; d < IMGBgelems.length; d++) {
            if (IMGBgelems[d].getAttribute("background")) IMGmatches.set(IMGBgelems[d].getAttribute("background"), "");
        }
    }
    if(document.getElementsByClassName("image-picker")[0].innerHTML === ''){
        handleImageDownload(IMGmatches); //Added For Image Download
    }
    $(".image-picker").html('');
    await populateImageGallery(IMGmatches);
    handleImageUpdate();
}

let populateImageGallery = function (IMGmatches) {
    for (let idx of [...IMGmatches]) {
        $(".image-picker").append('<option data-img-src="' + idx[0] + '" <option data-img-alt="' + idx[1] + '">' + idx[0] + '</option>')
    }
    $(".image-picker").imagepicker({
        hide_select: true
    });
    return IMGmatches;
}

let handleImageDownload = function (IMGDownload) {

    let totalImages = IMGDownload.size;
    let downloadedImages = 0;

    for (let idx of [...IMGDownload]) {
        let proxyURL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(idx[0]);
        fetch(proxyURL)
            .then(response => response.blob())
            .then(blob => {
                let filename = idx[0].substring(idx[0].lastIndexOf('/') + 1);
                let url = window.URL.createObjectURL(blob);
                let dummyAnchor = document.createElement('a');
                dummyAnchor.href = url;
                dummyAnchor.download = filename;
                document.body.appendChild(dummyAnchor);
                dummyAnchor.click();
                document.body.removeChild(dummyAnchor);
                window.URL.revokeObjectURL(url);

                downloadedImages++;
                let progressBar = document.getElementById('loaderBar');
                progressBar.style.width = (downloadedImages / totalImages) * 100 + '%';

                if (downloadedImages === totalImages) {
                    setTimeout(() => {
                        progressBar.style.width = '0%';
                    }, 1000); // Reset after 1 second
                }
            })
            .catch(error => console.error('Error downloading image:', error));
    };
}

let handleImageUpdate = function () {
    $(".image_picker_image").click(function () {
        $("#updated-image-url").val("");
        $("#updated-image-alt").val("");
        $("#updated-image").attr("src", "")
        $(".hidden-image-modal").click();
        $("#original-image").attr("src", this.src);
        $("#original-image-url").text(this.src)
        $("#original-image-alt").text(this.alt);
    })
}

$("#save-changes-image").click(async () => {
    for (let j = 0; j < m; j++) {
        let IMGelems = iframes[j].contentDocument.getElementsByTagName("img");
        let IMGBgelems = iframes[j].contentDocument.getElementsByTagName("td");
        for (let d = 0; d < IMGelems.length; d++) {
            if (IMGelems[d].src == $("#original-image-url").val()) {
                if ($("#updated-image-url").val() !== "") { IMGelems[d].src = $("#updated-image-url").val() };
                if ($("#updated-image-alt").val() !== "") { IMGelems[d].alt = $("#updated-image-alt").val() };
                modifiedCode.value = HTMLDocStandard + "\n" + document.querySelector("iframe").contentDocument.documentElement.outerHTML;
            }
        }
        for (let d = 0; d < IMGBgelems.length; d++) {
            let bgImage = IMGBgelems[d].getAttribute("background");
            if (bgImage && bgImage == $("#original-image-url").val() && $("#updated-image-url").val() !== "") {
                IMGBgelems[d].setAttribute("background", $("#updated-image-url").val());
                let imageURL = 'url("' + $("#updated-image-url").val() + '")'
                IMGBgelems[d].style.backgroundImage = imageURL;
                modifiedCode.value = HTMLDocStandard + "\n" + document.querySelector("iframe").contentDocument.documentElement.outerHTML.replaceAll($("#original-image-url").val(), $("#updated-image-url").val());
            }
        }
    }
    await iframeCodeUpdate(modifiedCode.value)
    handleEventsInAnchor();
    handleExtraction();
})

let handleHREFTrack = function () {
    for (let d = 0; d < HREF.length; d++) {
        let HREFTag = HREF[d].href;
        if (HREFTag && HREFTag !== regexCall(HREFTag)) {
            HREF[d].href = regexCall(HREFTag);
        }
    }
    modifiedCode.value = HTMLDocStandard + "\n" + document.querySelector("iframe").contentDocument.documentElement.outerHTML;
    line_counter('modified');
    disableDownload();
}

$("#save-changes-url").click(() => {
    if ($("#new-url").val()) newUrl.href = $("#new-url").val();
    if ($("#alias").val()) newUrl.setAttribute("alias", $("#alias").val());
    modifiedCode.value = HTMLDocStandard + "\n" + document.querySelector("iframe").contentDocument.documentElement.outerHTML;
    line_counter('modified');
    disableDownload();
})

let regexCall = function (strToMatch) {
    // let regex =  strToMatch.match(new RegExp(/(?<=\[@trackurl%20.*\])(https?:\/\/(?:www\.)?[^\s]+)(?=\?utm)/)); 
    // let regex2 = strToMatch.match(new RegExp(/(?<=\[@trackurl%20.*\])(https?:\/\/(?:www\.)?[^\s]+)(?=\[\/@trackurl\])/));
    // const regex = strToMatch.match(new RegExp(/https?:\/\/[^\s\[\]?]+(?=\[\/@trackurl|\?utm|$)/g));
    const regex = strToMatch.match(new RegExp(/https?:\/\/[^\s\[\]?]+(?=\[\/@trackurl|\?utm|\?site|$)/g));
    if (regex) {
        return regex[0];
    }
    // else if (regex2) {
    //     return regex2[0];
    // }
    return strToMatch;
}

let handleAmpscript = async function () {
    let iFrameCode = document.querySelector("iframe").contentDocument.documentElement.outerHTML;
    let regex = iFrameCode.match(new RegExp(/\[\#if.*/gs))[0].match(new RegExp(/\[\#if(.*?)(\/\#if\])/gs))
    modifiedCode.value = HTMLDocStandard + "\n" + iFrameCode.replaceAll(regex[0], "");
    await iframeCodeUpdate(modifiedCode.value);
    handleEventsInAnchor();
}

$("#updated-image-url").keyup(() => {
    $("#updated-image").attr("src", $("#updated-image-url").val());
})

function disableDownload() {
    if (modifiedCode.value == "") {
        $('#download-btn').addClass("disabled");
    }
    else {
        $('#download-btn').removeClass("disabled");
    }
}

$('#download-btn').click(function (e) {
    e.preventDefault();
    const link = document.createElement("a");
    const file = new Blob([modifiedCode.value], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "index.html";
    link.click();
    URL.revokeObjectURL(link.href);
});

function dropOverDropzone(evt) {
    evt.preventDefault();
    $("#drop-zone").css("zIndex", -1);
    $("#drop-animation").addClass("d-none");
    $("#dummy-wrapper").addClass("d-none");
    if (evt.dataTransfer.items && evt.dataTransfer.items.length === 1) {
        let item = evt.dataTransfer.items[0]
        if (item.kind === "file" && item.type === "text/html") {
            const file = item.getAsFile();
            if (originalCode.value !== "") {
                $(".hidden-upload-modal").click(() => {
                    fileToUpload = file;
                });
                $(".hidden-upload-modal").click();
            }
            else {
                readFile(file);
            }
        }
        else {
            handleToast('Please upload a valid HTML File', 'error');
        }
    }
    else {
        handleToast('Please upload one file at a time.', 'error');
    }
}

function handleFileUpload(evt) {
    let file = evt.target.files[0];
    if (file.type === "text/html") {
        if (originalCode.value !== "") {
            $(".hidden-upload-modal").click(() => {
                fileToUpload = file;
            });
            $(".hidden-upload-modal").click();
        }
        else {
            readFile(file);
        }
        $("#dummy-wrapper").addClass("d-none");
    }
    else {
        $("#upload-file").val("");
        handleToast('Please select a valid HTML File', 'error');
    }
}

$("#save-changes-upload").click(() => {
    readFile(fileToUpload);
    purgeContainers();
    wrapper.innerHTML = "";
})

async function readFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            const fileContents = event.target.result;
            $("#original-file").val(fileContents);
            line_counter("original");
            $("#submit-btn").removeClass("disabled");
            resolve(file);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
}

function dragOverDropzone(evt) {
    evt.preventDefault();
}

function dragOverTextarea(evt) {
    evt.preventDefault();
    $("#drop-zone").css("zIndex", 1000);
    $("#drop-animation").removeClass("d-none");
    $("#dummy-wrapper").removeClass("d-none");
}

function dragLeaveDropzone(evt) {
    evt.preventDefault();
    $("#drop-animation").addClass("d-none");
    $("#drop-zone").css("zIndex", -1);
    $("#dummy-wrapper").removeClass("d-none");
}

function handleCloseUpload() {
    $("#upload-file").val("");
}

let purgeContainers = function () {
    $("#submit-btn").addClass("disabled");
    modifiedCode.value = "";
    $(".image-picker").html('');
    $(".image-picker").imagepicker({
        hide_select: true
    });
    $("#upload-file").val("");
    disableDownload();
}

let handleToast = function (toastMessage, toastType) {
    $.toast({
        text: toastMessage,
        position: 'bottom-right',
        icon: toastType,
        stack: 5,
        loader: false,
        hideAfter: 4000
    })
}

function line_counter(ele) {
    var lineCount = document.getElementById(`${ele}-file`).value.split('\n').length;
    var outarr = new Array();
    if (lineCountCache != lineCount) {
        for (var x = 0; x < lineCount; x++) {
            outarr[x] = (x + 1) + '.';
        }
        document.getElementById(`${ele}-line-counter`).value = outarr.join('\n');
    }
    lineCountCache = lineCount;
}

function line_scroll(ele) {
    document.getElementById(`${ele}-line-counter`).scrollTop = document.getElementById(`${ele}-file`).scrollTop;
    document.getElementById(`${ele}-line-counter`).scrollLeft = document.getElementById(`${ele}-file`).scrollLeft;
}

let handleToggleScreen = function (evt) {
    if (evt.dataset.bool == "mobile") {
        evt.innerHTML = "Toggle to Desktop Screen";
        evt.dataset.bool = "desktop";
        $("#wrapper").width("425px");
        evt.setAttribute("title", "Toggles iFrame to Desktop Screen");
    }
    else {
        evt.innerHTML = "Toggle to Mobile Screen";
        evt.dataset.bool = "mobile";
        $("#wrapper").width("100%");
        evt.setAttribute("title", "Toggles iFrame to Mobile Screen");
    }
}

window.addEventListener("dragover", function (e) {
    e.preventDefault();
    if (e.target.id !== "drop-zone") {
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
    }
}, false);

window.addEventListener("drop", function (e) {
    e.preventDefault();
}, false);