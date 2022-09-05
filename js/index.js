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
    let tag = {
        name: "",
        attr: ""
    }
    if(hyperlinksCheckbox.checked){
        // change tag values => <a> tag
        tag.name = "a", tag.attr = "href"
        // set links
        links = getLinksFromHTML(html, tag)
        // display them on the page
        displayLinks(links, "Hyperlinks");
    }
    if(imagesCheckbox.checked){
        // change tag values => <img> tag
        tag.name = "img", tag.attr = "src"
        // set srcs
        srcs = getLinksFromHTML(html, tag)
        // display them on the page
        displayLinks(srcs, "Images")
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

function displayLinks(arr, title){
    // display section title
    $(`<h2 class="mt-4">${title}</h2>`).appendTo(resultsDiv);
    // If there were no links found, display message
    if(arr.length === 0){
        $(`<div class="text-center fs-2">Not Found</div>`).appendTo(resultsDiv);
    }
    else{
        toggleResultFormState(true);
        const div = $('<div>', {
            class: 'list-group'
        });
        arr.forEach(link => {
            $(`<label class="list-group-item link"><input type="checkbox" name="links" class="form-check-input me-1" value="" /><span class="mx-3">${link}</span></label>`).appendTo(div);
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

function getLinksFromHTML(html, tag){
    // Get all the tags from the parsed html
    const tags = $(html).find(tag.name);
    // From all the tags, return the value of the provided attribute
    const links = $.map(tags, function (value, index) {
        return $(value).attr(tag.attr)
    });
    // Filter the array to drop any links that arent useful (null, #id)
    const validLinks = links.filter(link => {
        // Check if link is not empty and make sure it is not an id
        if(link && !link.startsWith("#")){
            return link;
        }
    });
    // Remove all duplicate links from the array by converting to set
    let validUniqueLinks = Array.from(new Set(validLinks));
    // Convert all the relative links to absolute links
    const finalLinks = $.map(validUniqueLinks, function (value, index) {
        // If it already starts with http, assume the link is already absolute
        if(value.startsWith("https://") || value.startsWith("http://")){
            return value;
        }
        else{
            // Create URL from what we inputted
            const url = new URL(urlInp.value.trim());
            // Get the beginning part of the URL (https://example.com)
            let prefix = url.origin;
            // Now we combine the prefix to the relative URL to make an abosolute URL,
            // First, handle the double slash situation (https://example.com//relative)
            if(prefix.endsWith("/") && value.startsWith("/")){
                // remove last character (/) in prefix so there is no double slash
                // https://example.com//relative => https://example.com/relative
                prefix = prefix.slice(0, -1);
            }
            // Second, handle the no slash situation (https://example.comrelative)
            else if(!prefix.endsWith("/") && !value.startsWith("/")){
                // Adding "/" to the end of the prefix
                // https://example.comrelative => https://example.com/relative
                prefix = prefix + "/";
            }
            // https://example.com + /relative
            return prefix + value;
        }
    });
    return finalLinks
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