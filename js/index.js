const loadingToast = createToast("One Moment Please!", -1);
const urlInp = document.getElementById("url");
const getLinksBtn = document.getElementById("get-links-btn");
const resultsDiv = document.getElementById("results");
const copyLinksBtn = document.getElementById("copy-links");
const checkAllCheckbox = document.getElementById("check-all");
const checkAllLabel = document.getElementById("check-all-label");
const filterLabel = document.getElementById("filter-label");
const filterInp = document.getElementById("filter");
const imagesCheckbox = document.getElementById("images-checkbox")
const hyperlinksCheckbox = document.getElementById("hyperlinks-checkbox")

// const PROXY_URL = "/link-scraper/api/index.php";
const PROXY_URL = "./api/index.php"

getLinksBtn.addEventListener("click", onGetUrlClick);
checkAllCheckbox.addEventListener("click", onCheckAllClick);
copyLinksBtn.addEventListener("click", onCopyLinksClick);
filterInp.addEventListener("input", onFilterInputChange);

/*
* Sends a POST request to the backend which will then send a GET request to given URL
* @returns 
*/
async function getPageData(){
    loadingToast.showToast();
    // Clear previous results
    clearPreviousResults();
    return await axios.post(PROXY_URL, {
        url: urlInp.value.trim()
    })
    .then((response) => response.data)
    .catch((error) => {
        let errorText = "An error occurred";
        if(error.response.data.status === 400){
            // Bad Request
            errorText = "Please provide a valid URL"
        }
        createToast(errorText, 5000).showToast();
    });
};

async function parsePageData(data){
    // Parse the html
    const html = $.parseHTML( data );
    let links, srcs
    console.log(hyperlinksCheckbox);
    if(hyperlinksCheckbox.checked){
        links = getHyperlinksFromHTML(html)
        console.log(links);
        displayLinks(links);
    }
    if(imagesCheckbox.checked){
        srcs = getImageSrcsFromHTML(html)
        displayImageSources(srcs)
    }
}









function onGetUrlClick(e){
    e.preventDefault();
    toggleResultFormState(false);
    getPageData()
    .then((pageData) => parsePageData(pageData))
    .catch((error) => {
        const errorText = "An error occurred";
        createToast(errorText, 5000).showToast();
        console.log(error);
        throw new Error(error);
    })
    .finally(() => loadingToast.hideToast());
}

function onCheckAllClick(e){
    $('[name="links"]').each((index, value) => {
        if($(value).parent().css("display") !== "none"){
            if(e.currentTarget.checked){
                value.checked = true;
            }
            else{
                value.checked = false;
            }
        }
    });
}

function onCopyLinksClick(e){
    e.preventDefault();
    let links = [];
    $('input[name="links"]:checked').each((index, value) => {
        links.push($(value).parent().text());
    });
    createToast("Copied " + links.length + " link(s)", 3000).showToast();
    let textToCopy = links.join("\n");
    navigator.clipboard.writeText(textToCopy);
}

function onFilterInputChange(e){
    $('.link').each((index, value) => {
        $(value).unmark();
        if(value.textContent.includes(e.currentTarget.value)){
            const mark = new Mark(value);
            mark.mark(e.currentTarget.value);
            $(value).show();
        }
        else{
            $(value).hide();
        }
    });
}









/* HELPER FUNCTIONS */

/**
 * Clears the #results div of all content
 */
function clearPreviousResults(){
    $(resultsDiv).empty();
}

function displayLinks(linksArr){
    if(linksArr.length === 0){
        $(`<div class="text-center fs-2">No Links Found</div>`).appendTo(resultsDiv);
    }
    else{
        toggleResultFormState(true);
        const div = $('<div>', {
            class: 'list-group'
        });
        linksArr.forEach(link => {
            $(`<label class="list-group-item link"><input type="checkbox" name="links" class="form-check-input me-1" value="" /><span class="mx-3">${link}</span></label>`).appendTo(div);
        });
        div.appendTo(resultsDiv);
    }
}

function displayImageSources(srcs){
    if(srcs.length === 0){
        $(`<div class="text-center fs-2">No Images Found</div>`).appendTo(resultsDiv);
    }
    else{
        toggleResultFormState(true);
        const div = $('<div>', {
            class: 'list-group'
        });
        srcs.forEach(src => {
            $(`<label class="list-group-item link"><input type="checkbox" name="links" class="form-check-input me-1" value="" /><span class="mx-3">${src}</span></label>`).appendTo(div);
        });
        div.appendTo(resultsDiv);
    }
}

function toggleResultFormState(disabled = true){
    if(disabled){
        // Need to change state to active
        copyLinksBtn.disabled = false;
        checkAllCheckbox.disabled = false;
        checkAllLabel.classList.remove("text-muted");
        filterLabel.classList.remove("text-muted","bg-white");
        filterInp.disabled = false;
    }
    else{
        // Need to change state to disabled
        copyLinksBtn.disabled = true;
        checkAllCheckbox.disabled = true;
        checkAllLabel.classList.add("text-muted");
        filterLabel.classList.add("text-muted","bg-white");
        filterInp.disabled = true;
    }
}

function getHyperlinksFromHTML(html){
    // Get all the <a> tags from the parsed html
    const anchorTags = $(html).find("a");
    const links = $.map(anchorTags, function (value, index) {
        return $(value).attr("href")
    });
    // Filter the links array to drop any links that arent useful (null, #id)
    const validLinks = links.filter(link => {
        if(link && !link.startsWith("#")){
            return link;
        }
    });
    let validUniqueLinks = new Set(validLinks);
    validUniqueLinks = Array.from(validUniqueLinks);
    // Convert all the relative links to absolute links
    const finalLinks = $.map(validUniqueLinks, function (value, index) {
        if(value.startsWith("https://") || value.startsWith("http://")){
            return value;
        }
        else{
            const url = new URL(urlInp.value.trim());
            let prefix = url.origin;
            if(prefix.endsWith("/") && value.startsWith("/")){
                prefix = prefix.slice(0, -1);
            }
            else if(!prefix.endsWith("/") && !value.startsWith("/")){
                prefix = prefix + "/";
            }
            return prefix + value;
        }
    });
    return finalLinks
}

function getImageSrcsFromHTML(html){
    // Get all <img> tags from the parsed html
    const imageTags = $(html).find("img")
    // Get all the links (hrefs) from the <a> tags
    const srcs = $.map(imageTags, function (value, index) {
        return $(value).attr("src")
    });
    return srcs
}

/**
 * Creates a toast to be displayed at the bottom center of the screen
 * @param {string} message the message to display in the toast
 * @param {number} duration the duration in milliseconds that the toast should be displayed (-1 for infinite)
 * @returns {Toastify} a new toast
 */
function createToast(message, duration = 3000){
    return Toastify({
        text: message,
        duration: duration,
        gravity: "bottom",
        position: "center",
        stopOnFocus: "false",
    });
}