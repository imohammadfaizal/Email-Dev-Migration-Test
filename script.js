let modifiedCode = document.getElementById('modified-file');
let originalCode = document.getElementById('original-file');
let lineCountCache = 0;
const HTMLDocStandard = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`;
const originalIframeHTML = "<iframe id='original-iframe'  class='w-100 ' ></iframe>"
const modifiedIframeHTML = "<iframe id='modified-iframe'  class='w-100 ' ></iframe>"
let originalWrapper = document.getElementById('original-wrapper');
let modifiedWrapper = document.getElementById('modified-wrapper');
let iframes = document.getElementsByTagName('iframe');
let iFrameLength = iframes.length;
let originalHREF;
let updatedHREF = [];
let originalIMG = [];
let updatedIMG = [];
let duplicateSRC = [];
let HTMLFileName;
let newUrl;
let fileToUpload;
document.getElementById('upload-file').addEventListener('change', handleFileUpload, false);
document.getElementById('upload-new-file').addEventListener('change', handleFileUpload, false);
document.getElementById('upload-csv').addEventListener('change', handleCSVUpload, false);
$('#original-file').keyup(() => {
    if ($('#original-file').val()) {
        $('#submit-btn').removeClass('disabled');
        $('#dummy-wrapper').addClass('d-none');
        $('#upload-container').addClass('d-none');
    }
    else {
        $('#upload-container').removeClass('d-none');
        $('#submit-btn').addClass('disabled')
    }
})

$('.regex-phrase').keyup(() => {
    if ($('#start-regex-phrase').val() && $('#end-regex-phrase').val()) {
        $('#regex-submit').removeClass('disabled');
    }
    else {
        $('#regex-submit').addClass('disabled')
    }
})

function originalIframeCodeUpdate(codeToUpdate) {
    originalWrapper.innerHTML = originalIframeHTML;
    document.getElementById('original-iframe').contentWindow.document.write(codeToUpdate);
    line_counter('modified');
    disableDownload();
    return codeToUpdate;
}

function modifiedIframeCodeUpdate(codeToUpdate) {
    modifiedWrapper.innerHTML = modifiedIframeHTML;
    document.getElementById('modified-iframe').contentWindow.document.write(codeToUpdate);
    document.getElementById('modified-iframe').srcdoc = codeToUpdate;
    line_counter('modified');
    handleEventsInAnchor();
    disableDownload();
    return codeToUpdate;
}

function modifiedCodeUpdate() {
    modifiedCode.value = document.querySelector('#modified-iframe').srcdoc;
    line_counter('modified');
    disableDownload();
}

async function handleSubmit() {
    purgeContainers();
    $('.sidebar').toggleClass('show');
    $('.code-editor').toggleClass('reduced');
    $('.nav-tabs').toggleClass('show');
    $('.header-button-container, .inner-header-button-proxy-container').toggleClass('d-none');
    $('.inner-header-button-proxy-container').removeClass('inner-header-button-container');
    $('.logo-container').toggleClass('show');
    $('#submit-container').toggleClass('d-none');
    $('#original-file').attr('readonly');
    $('#download-btn-container').toggleClass('d-none');
    $('#modified-code-container').toggleClass('d-none');
    $('#original-code-container').toggleClass('d-none');
    await originalIframeCodeUpdate(originalCode.value);
    await modifiedIframeCodeUpdate(originalCode.value);
    $('#modified-file').val($('#original-file').val());
    line_counter('modified');
    handleEventsInAnchor();
    handleImageStorage();
    $("#file-name").text(HTMLFileName);
    $("#drop-container").addClass('d-none');
    // handleToast('Submission successful','success');
}

function handleEventsInAnchor() {
    setTimeout(() => {
    for (let j = 0; j < iFrameLength; j++) {
        originalHREF = iframes[0].contentDocument.querySelectorAll('a');
    }
    updatedHREF = [];
    for (let j = 1; j < iFrameLength; j++) {
        const anchors = iframes[1].contentDocument.querySelectorAll('a');
        anchors.forEach(anchor => {
            updatedHREF.push({ anchor: anchor, flag: 0 });
            anchor.addEventListener('click', (evt) => {
                evt.preventDefault();
                $('.hidden-link-modal').click();
                $('#new-url').val('');
                $('#current-url').val(evt.currentTarget.href);
                newUrl = anchor;
                ((evt.currentTarget).outerHTML) ? $('#alias').val(evt.currentTarget.getAttribute('alias')) : $('#alias').val('');
            })
        });
    }
    }, 50);
}

$('#save-changes-url').click(() => {
    if ($('#new-url').val()) newUrl.href = $('#new-url').val();
    if ($('#alias').val()) newUrl.setAttribute('alias', $('#alias').val());
    modifiedCodeUpdate();
})

function handleHREFTrack() {
    let flag = 0;
    for (let d = 0; d < updatedHREF.length; d++) {
        let HREFTag = updatedHREF[d].anchor.href;
        let mainIframe = document.getElementById('modified-iframe');
        let anchor = mainIframe.contentDocument.querySelectorAll('a')[d];
        if (HREFTag && HREFTag !== regexCall(HREFTag)) {
            updatedHREF[d].anchor.href = anchor.href = regexCall(HREFTag);
            updatedHREF[d].flag = 1;
            modifiedCodeUpdate();
            flag++;
        }
    }
    flag === 0 ? handleToast('No Link changed', 'error') : handleToast('Tracking URL removed successfully', 'success');
    // anchorRefresh();
}

function regexCall(strToMatch) {
    const regex = strToMatch.match(new RegExp(/https?:\/\/[^\s\[\]?]+(?=\[\/@trackurl|\?utm|\?site|$)/g));
    if (regex) {
        return regex[0];
    }
    return strToMatch;
}

function escapeSpecialChar(str) {
    return !/^(http|https):\/\//i.test(str);
}

function handleAnchorHighlight(evt) {
    $('#save-changes-anchor').addClass('disabled');
    $('.hidden-anchor-modal').click();
    let anchorModalBody = document.getElementById('inner-anchor-modal-body');
    anchorModalBody.innerHTML = '';

    let fragment = document.createDocumentFragment();
    const anchorTagRegex = /<a\b[^>]*?>.*?<\/a>/g;
    const matches = document.getElementById('modified-iframe').srcdoc.match(anchorTagRegex);

    updatedHREF.forEach((href, index) => {

        let container = document.createElement('div');
        container.className = 'iframe-input-container';

        let iframe = document.createElement('iframe');
        iframe.id = `iframe-anchor-${index + 1}`;
        iframe.height = '50';
        iframe.className = 'anchor-iframe';
        iframe.scrolling = 'no';
        iframe.srcdoc = `<div class='iframe-inner-container'>${href.anchor.outerHTML}</div>`;
        container.appendChild(iframe);

        let inputContainer = document.createElement('div');
        inputContainer.className = 'input-container ms-0';

        let currentUrlField = document.createElement('input');
        currentUrlField.type = 'text';
        let hrefOLink = originalHREF[index].getAttribute('href');
        hrefOLink && escapeSpecialChar(hrefOLink) ? currentUrlField.value = currentUrlField.title = hrefOLink : currentUrlField.value = currentUrlField.title = hrefOLink;
        currentUrlField.readOnly = true;
        currentUrlField.id = `current-anchor-${index + 1}`;
        currentUrlField.className = 'current-url form-control';
        inputContainer.appendChild(currentUrlField);

        let inputField = document.createElement('input');
        inputField.type = 'text';
        let hrefMLink = href.anchor.getAttribute('href');
        hrefMLink && escapeSpecialChar(hrefMLink) ? inputField.value = inputField.title = href.flag === 1 ? hrefMLink : '' : inputField.value = inputField.title = href.flag === 1 ? hrefMLink : '';
        inputField.id = `input-anchor-${index + 1}`;
        inputField.placeholder = 'Enter new href';
        inputField.className = 'new-url form-control';
        inputField.addEventListener('keyup', () => $('#save-changes-anchor').removeClass('disabled'))
        inputContainer.appendChild(inputField);

        let aliasField = document.createElement('input');
        aliasField.type = 'text';
        aliasField.id = `alias-anchor-${index + 1}`;
        aliasField.placeholder = 'Enter alias';
        aliasField.className = 'alias-url form-control';
        aliasField.value = href.anchor.getAttribute('alias') || '';
        aliasField.addEventListener('keyup', () => $('#save-changes-anchor').removeClass('disabled'))
        inputContainer.appendChild(aliasField);

        let copyButton = document.createElement('button');
        copyButton.innerHTML = 'Copy';
        copyButton.type = 'button';
        copyButton.className = 'btn btn-secondary';
        copyButton.onclick = () => { inputField.value = currentUrlField.value; };
        inputContainer.insertBefore(copyButton, inputField);

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-anchor-${index + 1}`;
        checkbox.className = 'form-check-input';
        checkbox.checked = true;
        inputContainer.appendChild(checkbox);

        container.appendChild(inputContainer);
        fragment.appendChild(container);
    });

    anchorModalBody.appendChild(fragment);

    document.getElementById('save-changes-anchor').onclick = function () {
        updatedHREF.forEach((anchorTag, index) => {
            let checkbox = document.getElementById(`checkbox-anchor-${index + 1}`);
            if (checkbox.checked) {
                const hrefRegex = /href="([^"]*?)"/;
                let newHref = document.getElementById(`input-anchor-${index + 1}`).value.trim();
                let alias = document.getElementById(`alias-anchor-${index + 1}`).value.trim();
                let mainIframe = document.getElementById('modified-iframe');
                let anchor = mainIframe.contentDocument.querySelectorAll('a')[index];

                if (newHref && anchor && anchor.hasAttribute('href')) {                    
                    anchor.href = newHref || anchorTag.anchor.href;
                    const updatedAnchor = matches[index].replace(hrefRegex, (match, hrefValue) => {
                        return `href="${newHref}"`; 
                    });
                    mainIframe.srcdoc = mainIframe.srcdoc.replace(matches[index],updatedAnchor);   
                    newHref ? anchorTag.flag = 1 : anchorTag.flag = 0;
                    anchorTag.anchor.href = newHref ? newHref : anchorTag.anchor.href;
                    if (alias) {
                        anchor.setAttribute('alias', alias);
                    } else {
                        anchor.removeAttribute('alias');
                    }
                }
            }
        });
        modifiedCodeUpdate();
        handleToast('Anchor Links have been updated successfully', 'success');
    };
};

function anchorRefresh() {
    updatedHREF.forEach((href, index) => {
        let currentUrlField = document.getElementById(`current-anchor-${index + 1}`);
        currentUrlField.value = href.href;
        currentUrlField.title = href.href;
    })
}

async function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file.type !== 'text/csv') {
        handleToast('Please upload a valid CSV file', 'error');
        $('#upload-csv').val('');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        handleAnchorHighlight();
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));

        const headers = rows.shift().map(header => header.trim().toLowerCase());
        const newUrlIndex = headers.indexOf('new_url');
        const aliasIndex = headers.indexOf('alias');

        if (newUrlIndex === -1 || aliasIndex === -1) {
            handleToast('CSV must contain "new-url" and "alias" columns', 'error');
            return;
        }

        let currentIndex = 0;

        rows.forEach((columns) => {
            const newUrl = columns[newUrlIndex]?.trim() || '';
            const alias = columns[aliasIndex]?.trim() || '';

            while (currentIndex < updatedHREF.length) {
                const currentUrlField = document.getElementById(`current-anchor-${currentIndex + 1}`);

                if (currentUrlField && currentUrlField.value.trim() !== '') {
                    const inputField = document.getElementById(`input-anchor-${currentIndex + 1}`);
                    const aliasField = document.getElementById(`alias-anchor-${currentIndex + 1}`);

                    if (inputField) inputField.value = newUrl;
                    if (aliasField) aliasField.value = alias;

                    currentIndex++;
                    break;
                }

                currentIndex++;
            }
        });
    };
    reader.readAsText(file);
    $('#save-changes-anchor').removeClass('disabled')
    handleToast('New URLs loaded succesfully', 'success');
}

function handleImageStorage() {

    let imgs = iframes[0].contentDocument.querySelectorAll('img');
    let IMGBgelems = iframes[0].contentDocument.getElementsByTagName('td');
    imgs.forEach(item => originalIMG.push(item.src));
    duplicateSRC = originalIMG.filter((item, index) => originalIMG.indexOf(item) !== index);
    
    for (let d = 0; d < IMGBgelems.length; d++) {
        if (IMGBgelems[d].getAttribute('background')) originalIMG.push(IMGBgelems[d].getAttribute('background'));
    }
    for (let j = 1; j < iFrameLength; j++) {
        const images = iframes[1].contentDocument.querySelectorAll('img');
        let IMGBgelems = iframes[1].contentDocument.getElementsByTagName('td');
        images.forEach(image => {
            updatedIMG.push({ image: image, flag: 0 });
        });
        for (let d = 0; d < IMGBgelems.length; d++) {
            if (IMGBgelems[d].getAttribute('background')) updatedIMG.push({ image: IMGBgelems[d].getAttribute('background'), flag: 0, background: true });
        }
    }
}

async function handleImageExtraction() {
    $('.hidden-image-modal').click();
    $('#save-changes-img').addClass('disabled');
    let imageModalBody = document.getElementById('inner-image-modal-body');
    imageModalBody.innerHTML = '';
    const imgTagRegex = /<img\b[^>]*>/g;
    const matches = document.getElementById('modified-iframe').srcdoc.match(imgTagRegex);

    let fragment = document.createDocumentFragment();
    updatedIMG.forEach((img, index) => {

        let container = document.createElement('div');
        container.className = 'iframe-input-container';

        let inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        let imgContainerOuter = document.createElement('div');
        imgContainerOuter.className = 'img-container-outer';
        imgContainerOuter.style.background = '#bbbbbb';
        imgContainerOuter.style.padding = '5px';
        imgContainerOuter.style.marginBottom = '10px';

        let imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        imgContainer.style.background = '#bbbbbb';

        let imgElement = document.createElement('img');
        imgElement.src = originalIMG[index].src || originalIMG[index];
        // imgElement.alt = originalIMG[index].alt || "";
        imgElement.alt = img.image.alt || "";
        imgElement.className = 'img-preview';
        imgElement.id = `current-preview-${index + 1}`;

        imgContainer.appendChild(imgElement);
        imgContainerOuter.appendChild(imgContainer);
        inputContainer.appendChild(imgContainerOuter);

        let currentImgField = document.createElement('input');
        currentImgField.type = 'text';
        currentImgField.value = currentImgField.title = originalIMG[index].src || originalIMG[index];
        currentImgField.readOnly = true;
        currentImgField.id = `current-img-${index + 1}`;
        currentImgField.className = 'current-img form-control';
        inputContainer.appendChild(currentImgField);

        let imgContainerModifiedOuter = document.createElement('div');
        imgContainerModifiedOuter.className = 'img-container-outer';
        imgContainerModifiedOuter.style.background = '#bbbbbb';
        imgContainerModifiedOuter.style.padding = '5px';
        imgContainerModifiedOuter.style.marginBottom = '10px';

        let imgContainerModified = document.createElement('div');
        imgContainerModified.className = 'img-container';
        imgContainerModified.id = `img-container-${index + 1}`;
        imgContainerModified.style.background = '#bbbbbb';

        let imgElementModified = document.createElement('img');
        imgElementModified.src = img.flag === 1 ? img.image.src || img.image : '';
        imgElementModified.alt = img.image.alt || "";
        imgElementModified.className = 'img-preview';
        imgElementModified.id = `modified-preview-${index + 1}`;

        imgContainerModified.appendChild(imgElementModified);
        imgContainerModifiedOuter.appendChild(imgContainerModified);
        img.flag === 1 ? imgContainerModified.classList.add('visible') : imgContainerModified.classList.add('invisible');
        inputContainer.appendChild(imgContainerModifiedOuter);

        let inputImgField = document.createElement('input');
        inputImgField.type = 'text';
        inputImgField.value = inputImgField.title = img.flag === 1 ? img.image.src || img.image : '';
        inputImgField.id = `input-img-${index + 1}`;
        inputImgField.placeholder = 'Enter new src';
        inputImgField.className = 'new-img form-control';
        inputImgField.addEventListener('keyup', () => {
            $('#save-changes-img').removeClass('disabled');
            let curr = $('#current-img-' + (index + 1)).val();
            let newVal = $('#input-img-' + (index + 1)).val();
            if (duplicateSRC.includes(curr)) {
                $('.current-img').filter((index, item) => {
                    return $(item).val() == curr;
                }).each((index, item) => {
                    let idx = $(item).attr('id').match(/\d+$/)[0];
                    $('#input-img-' + idx).val(newVal);
                })
                $('.new-img').trigger('keyup');
            }
        });
        inputContainer.appendChild(inputImgField);

        let altField = document.createElement('input');
        altField.type = 'text';
        altField.id = `alt-img-${index + 1}`;
        altField.placeholder = 'Enter alt text';
        altField.className = 'alt-url form-control';
        altField.value = img.image.alt || "";
        altField.addEventListener('keyup', () => {
            $('#save-changes-img').removeClass('disabled');
            let currImage = $('#current-img-' + (index + 1)).val();
            let newVal = $('#alt-img-' + (index + 1)).val();
            if (duplicateSRC.includes(currImage)) {
                $('.current-img').filter((index, item) => {
                    return $(item).val() == currImage;
                }).each((index, item) => {
                    let idx = $(item).attr('id').match(/\d+$/)[0];
                    $('#alt-img-' + idx).val(newVal);
                })
            }
        });
        inputContainer.appendChild(altField);

        container.appendChild(inputContainer);
        fragment.appendChild(container);
    });
    imageModalBody.appendChild(fragment);

    document.getElementById('save-changes-img').onclick = function () {
        updatedIMG.forEach((imageTag, idx) => {
            const srcRegex = /src="([^"]*?)"/;
            const altRegex = /alt="([^"]*?)"/;
            let newSrc = document.getElementById(`input-img-${idx + 1}`).value.trim();
            let newAlt = document.getElementById(`alt-img-${idx + 1}`).value.trim();
            let mainIframe = document.getElementById('modified-iframe');
            let img = mainIframe.contentDocument.querySelector(`img[src='${updatedIMG[idx].image.src}']`);
            let img2 = document.getElementById('original-iframe').contentDocument.querySelector(`img[src='${updatedIMG[idx].image.src}']`);

            if (newSrc && img && img.hasAttribute('src')) {
                img.src = newSrc || imageTag.image.src;
                const updatedSrc = matches[idx].replace(srcRegex, (match, srcValue) => {
                    return `src="${newSrc}"`; 
                });
                
                // mainIframe.srcdoc = mainIframe.srcdoc.replace(matches[idx],updatedSrc);
                newSrc ? imageTag.flag = 1 : imageTag.flag = 0;
                imageTag.image.src = newSrc ? newSrc : imageTag.image.src;
                if (newAlt) {
                    let matchFound = false;
                    const updatedAlt = updatedSrc.replace(altRegex, (match, altValue) => {
                        matchFound = true;
                        return `alt="${newAlt}"`;
                    });
                    const finalUpdatedTag = matchFound
                        ? updatedAlt
                        : updatedSrc.replace(/\/?>$/, (closing) => ` alt="${newAlt}" ${closing}`);
                    mainIframe.srcdoc = mainIframe.srcdoc.replace(matches[idx], finalUpdatedTag);
                    img.alt = imageTag.image.alt = newAlt;
                } else {
                    mainIframe.srcdoc = mainIframe.srcdoc.replace(matches[idx],updatedSrc);
                    img.removeAttribute('alt');
                }
                modifiedCodeUpdate();
            }
            else if (imageTag.background === true && newSrc) {
                modifiedCode.value = mainIframe.srcdoc = mainIframe.srcdoc.replaceAll($(`#current-img-${idx+1}`).val(), newSrc || imageTag.image);
                modifiedIframeCodeUpdate(modifiedCode.value);
                newSrc ? imageTag.flag = 1 : imageTag.flag = 0;
                imageTag.image = newSrc ? newSrc : imageTag.image;
                modifiedCodeUpdate();
            }
        });
        handleToast('Changes saved successfully', 'success');
    };
    $('.new-img').keyup(function () {
        let idx = $(this).attr('id').match(/\d+$/)[0];
        if ($(this).val() === '') {
            $(`#img-container-${idx}`).addClass('invisible');
        }
        else {
            $(`#modified-preview-${idx}`).attr('src', $(this).val());
            $(`#img-container-${idx}`).removeClass('invisible');
        }
    })
    setTimeout(() => {
        $('.img-container').each(function () {
            $(this).hover(
                function () {
                    $(this).css('overflow', 'visible');
                },
                function () {
                    $(this).css('overflow', 'hidden');
                }
            );
        });
    }, 0);
    // handleImageDownload(originalIMG); //Added For Image Download
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

$('#start-regex-phrase').val(`\\[\\#if`)
$('#end-regex-phrase').val(`\\#if\\]`);
$('#regex-submit').click(() => {
    let start = $('#start-regex-phrase').val();
    let end = $('#end-regex-phrase').val();
    let iFrameCode = document.querySelector('#modified-iframe').srcdoc;
    let regex = new RegExp(`${start}.*?${end}`, 'gs');
    let regexMatches = iFrameCode.match(regex);
    let PersonalisationModalBody = document.getElementById('inner-personalisation-modal-body');
    PersonalisationModalBody.innerHTML = '';

    let fragment = document.createDocumentFragment();

    if (regexMatches == null || regexMatches.length == 0) {
        $('#inner-personalisation-modal-body').html(`<div class="h-100 d-flex justify-content-center align-items-center flex-column text-secondary">
            <div class="w-100 d-flex flex-column align-items-center">
            <div class="d-flex flex-column " style="width: 170px;">
                <div style="line-height: 30px;" class="d-flex justify-content-around">
                    <div class="fs-1 fw-bolder">x</div>
                    <div class="fs-1 fw-bolder">x</div>
                </div>
                <div class="d-flex justify-content-center">
                    <div class="fs-1 fw-bolder">&lt;</div>
                </div>
                <div style="line-height: 30px;" class="d-flex justify-content-center">
                    <div class="fs-1 fw-bolder">o</div>
                </div>
            </div>
            <div class="fs-1 fw-bold d-flex justify-content-center pt-3"><span>No Results Found!!</span></div>
        </div></div>`)
    }
    else {
        regexMatches.forEach((script, idx) => {
            let container = document.createElement('div');
            container.className = 'iframe-input-container';

            let inputContainer = document.createElement('div');
            inputContainer.className = 'input-container d-flex flex-grow-1 m-0';

            let currentPersonalisation = document.createElement('textarea');
            currentPersonalisation.type = 'text';
            currentPersonalisation.value = script;
            currentPersonalisation.readOnly = true;
            currentPersonalisation.id = `current-personalisation-${idx}`;
            currentPersonalisation.className = 'current-personalisation form-control';
            currentPersonalisation.setAttribute('rows', 7);
            inputContainer.appendChild(currentPersonalisation);

            let inputPersonalisation = document.createElement('textarea');
            inputPersonalisation.type = 'text';
            inputPersonalisation.id = `input-personalisation-${idx}`;
            inputPersonalisation.placeholder = 'Enter Replacement Script';
            inputPersonalisation.className = 'new-personalisation form-control';
            inputPersonalisation.setAttribute('rows', 7);
            inputContainer.appendChild(inputPersonalisation);

            let checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'd-flex justify-content-center w-150'
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-personalisation-${idx}`;
            checkbox.className = 'form-check-input';
            checkbox.checked = true;
            checkboxContainer.appendChild(checkbox)
            inputContainer.appendChild(checkboxContainer);

            container.appendChild(inputContainer);
            fragment.appendChild(container);
        });
    }
    PersonalisationModalBody.appendChild(fragment);

    document.getElementById('save-changes-personalisation').onclick = function () {
        let updatedCode = iFrameCode;

        regexMatches.forEach((script, index) => {
            let checkbox = document.getElementById(`checkbox-personalisation-${index}`);
            if (checkbox.checked) {
                let newScript = document.getElementById(`input-personalisation-${index}`).value.trim();
                updatedCode = updatedCode.replace(script, newScript);
            }
        });

        modifiedCode.value = updatedCode;
        handleToast('Changes saved successfully', 'success')
        modifiedIframeCodeUpdate(modifiedCode.value);
        handleEventsInAnchor();
    };
})

async function handleAmpscript() {
    $('.hidden-personalisation-modal').click();
    let PersonalisationModalBody = document.getElementById('inner-personalisation-modal-body');
    PersonalisationModalBody.innerHTML = '';
}

function handleCodeCompare() {
    $('#editor-container').toggleClass('some-style');
    $('#modified-code-container').toggleClass('some-style2');
    $('#original-code-container').toggleClass('some-style2 d-none');
    $('#original-wrapper, .inner-original-btn, .inner-modified-btn').toggleClass('d-none');
    $('.inner-header-button-proxy-container').toggleClass('inner-header-button-container');
}

$('.download-btn').click(function (e) {
    e.preventDefault();
    const link = document.createElement('a');
    const file = new Blob([modifiedCode.value], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = 'index.html';
    link.click();
    URL.revokeObjectURL(link.href);
});

$('#copy-btn').click(function (e) {
    navigator.clipboard.writeText($('#modified-file').val());
});

function disableDownload() {
    if (modifiedCode.value == '') {
        $('.download-btn, #copy-btn, #code-compare').addClass('disabled');
    }
    else {
        $('.download-btn, #copy-btn, #code-compare').removeClass('disabled');
    }
}

function dropOverDropzone(evt) {
    evt.preventDefault();
    $('#drop-zone').css('zIndex', -1);
    $('#drop-animation').addClass('d-none');
    $('#dummy-wrapper').addClass('d-none');
    if (evt.dataTransfer.items && evt.dataTransfer.items.length === 1) {
        let item = evt.dataTransfer.items[0]
        if (item.kind === 'file' && item.type === 'text/html') {
            const file = item.getAsFile();
            readFile(file);
            $('#upload-container').addClass('d-none');
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
    if (file.type === 'text/html') {
        if (originalCode.value !== '') {
            $('.hidden-upload-modal').click(() => {
                fileToUpload = file;
            });
            $('.hidden-upload-modal').click();
        }
        else {
            readFile(file);
        }
        $('#upload-container').addClass('d-none');
        $('#dummy-wrapper').addClass('d-none');
    }
    else {
        $('#upload-file').val('');
        handleToast('Please select a valid HTML File', 'error');
    }
}

$('#save-changes-upload').click(() => {
    readFile(fileToUpload);
    HTMLFileName = fileToUpload.name;
    handleToast(`${fileToUpload.name} is uploaded successfully`, 'success');
    $("#drop-container").removeClass('d-none');
    $('#drop-animation').addClass('d-none');
    $('#drop-zone').css('zIndex', -1);
    $('.sidebar').toggleClass('show');
    $('.code-editor').toggleClass('reduced');
    $('.nav-tabs').toggleClass('show');
    $('.header-button-container, .inner-header-button-proxy-container').toggleClass('d-none');
    $('.logo-container').toggleClass('show');
    $('#submit-container').toggleClass('d-none');

    $('#editor-container').removeClass('some-style');
    $('#original-code-container, #modified-code-container').removeClass('some-style2');
    $('#original-code-container').removeClass('d-none');
    $('#modified-code-container, #original-wrapper, .inner-original-btn, .inner-modified-btn').addClass('d-none');

    $('.nav-link').removeClass('active');
    $('.code-btn').addClass('active');
    $('.tab-menu').removeClass('d-none');
    $('#iframe-container').addClass('d-none');
    $('#download-btn-container').toggleClass('d-none');
})

async function readFile(file) {
    HTMLFileName = file.name;
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            const fileContents = event.target.result;
            $('#original-file').val(fileContents);
            line_counter('original');
            $('#submit-btn').removeClass('disabled');
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
    $('#drop-zone').css('zIndex', 1000);
    $('#drop-animation').removeClass('d-none');
    $('#dummy-wrapper').removeClass('d-none');
}

function dragLeaveDropzone(evt) {
    evt.preventDefault();
    $('#drop-animation').addClass('d-none');
    $('#drop-zone').css('zIndex', -1);
    $('#dummy-wrapper').removeClass('d-none');
}

window.addEventListener('dragover', function (e) {
    e.preventDefault();
    if (e.target.id !== 'drop-zone') {
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
    }
}, false);

window.addEventListener('drop', function (e) {
    e.preventDefault();
}, false);

function handleCloseUpload() {
    $('#upload-file').val('');
}

function purgeContainers() {
    modifiedCode.value = '';
    originalHREF = [];
    updatedHREF = [];
    originalIMG = [];
    updatedIMG = [];
    disableDownload();
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

function handleToggleScreen(evt) {
    if (evt.dataset.bool == 'mobile') {
        $('.wrapper').width('425px');
    }
    else {
        $('.wrapper').width('100%');
    }
}

function handleToast(toastMessage, toastType) {
    $.toast({
        text: toastMessage,
        position: 'bottom-right',
        icon: toastType,
        stack: 5,
        loader: false,
        hideAfter: 4000
    })
}

$('.nav-link').click((evt) => {
    $('.nav-link').removeClass('active');
    $(evt.target).addClass('active');
    $('.tab-menu').removeClass('d-none');
    $('#' + $(evt.target).attr('tab')).addClass('d-none')
})

function isSelfClosingTag(tagName) {
    return tagName.match(/area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script/i);
}

$('#unclosed-tag-finder-button').click(function () {
    var input = $('#original-file').val();

    // Line numbering code from https://jsfiddle.net/tovic/AbpRD/
    $('#unclosed-tag-finder-code').empty();
    $('#unclosed-tag-finder-code').append('<span><\/span>');
    $('#unclosed-tag-finder-code span').text(input);
    var pre = document.getElementById('unclosed-tag-finder-code');
    pre.innerHTML = '<span class="line-number"><\/span>' + pre.innerHTML + '<span class="cl"><\/span>';
    var num = pre.innerHTML.split(/\n/).length;
    for (var j = 0; j < num; j++) {
        var line_num = pre.getElementsByTagName('span')[0];
        line_num.innerHTML += '<span>' + (j + 1) + '<\/span>';
    }

    var tags = [];
    // Strip out comments first.
    input = input.replace(/<!--[\s\S]*?-->/g, '');
    $.each(input.split('\n'), function (i, line) {
        $.each(line.match(/<[^>]*[^/]>/g) || [], function (j, tag) {
            var matches = tag.match(/<\/?([a-z0-9]+)/i);
            if (matches) {
                tags.push({
                    tag: tag,
                    name: matches[1],
                    line: i + 1,
                    closing: tag[1] == '/'
                });
            }
        });
    });
    if (tags.length == 0) {
        $('#unclosed-tag-finder-results').text('No tags found.');
        return;
    }
    var openTags = [];
    var error = false;
    var indent = 0;
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        if (tag.closing) {
            var closingTag = tag;
            if (isSelfClosingTag(closingTag.name)) {
                continue;
            }
            if (openTags.length == 0) {
                $('#unclosed-tag-finder-results').text('Closing tag ' + closingTag.tag + ' on line ' + closingTag.line + ' does not have corresponding open tag.');
                return;
            }
            var openTag = openTags[openTags.length - 1];
            if (closingTag.name != openTag.name) {
                $('#unclosed-tag-finder-results').text('Closing tag ' + closingTag.tag + ' on line ' + closingTag.line + ' does not match open tag ' + openTag.tag + ' on line ' + openTag.line + '.');
                return;
            } else {
                openTags.pop();
            }
        } else {
            var openTag = tag;
            if (isSelfClosingTag(openTag.name)) {
                continue;
            }
            openTags.push(openTag);
        }
    }
    if (openTags.length > 0) {
        var openTag = openTags[openTags.length - 1];
        $('#unclosed-tag-finder-results').text('Open tag ' + openTag.tag + ' on line ' + openTag.line + ' does not have a corresponding closing tag.');
        return;
    }
    $('#unclosed-tag-finder-results').text('Success: No unclosed tags found.');
});