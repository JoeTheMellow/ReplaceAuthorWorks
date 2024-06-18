// Literotica - replace author works page
// version 0.01
//
// --------------------------------------------------------------------
//
// This is a Tampermonkey user script.
//
// To install, you need Tampermonkey https://www.tampermonkey.net
//
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          Literotica - replace author works page
// @namespace     http://none.com/
// @description   Replace author works page
// @match       https://www.literotica.com/authors/*/works/stories
// @version 0.02
// @grant GM_addStyle
// @run-at document-end
// ==/UserScript==

// extract the author name from the current url
var currentUrl = window.location.href;

// look for "authors" in the url
var pos = currentUrl.indexOf("authors/");

if (pos < 0)
{
    return;
}

// advance past the "authors/" string
pos += 8;
var author = currentUrl.substring(pos);

// find trailing /
pos = author.indexOf("/");
if (pos < 0)
{
    return;
}

// grab the author name
author = author.substring(0, pos);

// this is what it looks like decoded.  I'm telling it to grab 5000 stories at a time.
// {"page":1,"pageSize":5000,"sort":"title","type":"story","listType":"expanded"}

// make the url to get the json containing the author's stories
var jsonUrl = "https://literotica.com/api/3/users/" + author + "/series_and_works?params=%7B%22page%22%3A1%2C%22pageSize%22%3A5000%2C%22sort%22%3A%22title%22%2C%22type%22%3A%22story%22%2C%22listType%22%3A%22expanded%22%7D";

GM_addStyle("td { padding: 2px !important; font-size: 11px !important;  white-space:nowrap !important;} a {color:blue !important;} a:visited {color: purple !important;}");

var newScript = document.createElement("script");

newScript.innerText =
        "function sortByTitle() {" +
        "document.getElementById(\"stories_by_title\").style.display = \"block\"; " +
        "document.getElementById(\"stories_by_date\").style.display = \"none\"; " +
        "document.getElementById(\"stories_by_category\").style.display = \"none\";" +
        "}" +
        "function sortByDate() {" +
        "document.getElementById(\"stories_by_title\").style.display = \"none\"; " +
        "document.getElementById(\"stories_by_date\").style.display = \"block\"; " +
        "document.getElementById(\"stories_by_category\").style.display = \"none\";" +
        "}" +
        "function sortByCategory() {" +
        "document.getElementById(\"stories_by_title\").style.display = \"none\"; " +
        "document.getElementById(\"stories_by_date\").style.display = \"none\"; " +
        "document.getElementById(\"stories_by_category\").style.display = \"block\";" +
        "}";

document.head.appendChild(newScript);

// and fix the page.
fixThePage();

// ------------------------

// return the response from the url
function Get(url){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",url,false);
    Httpreq.send(null);
    return Httpreq.responseText;
}

function mangleTitle(title)
{
    var result = title.toLowerCase().trim();

    if (result.startsWith("the ")) {
        result = result.substring(4);
    }
    else if (result.startsWith("a ")) {
        result = result.substring(2);
    }
    else if (result.startsWith("an ")) {
        result = result.substring(3);
    }
    result = result.replace(/[^ A-Za-z0-9]/g, '');

    return result;

}

function titleCompare(a, b)
{
    return a.sort_title.localeCompare(b.sort_title);
}

function categoryCompare(a, b)
{
    return a.category.localeCompare(b.category);
}

function dateCompare(b, a)
{
    // sorts in reverse order to put newest at top
    return a.date.localeCompare(b.date);
}

function storyRating(story)
{
    var result = "";
    if (story.rating != null) {
        result += "&nbsp;(" + story.rating + ")";
    }
    if (story.is_new) {
        result += "&nbsp;<img src=\"/imagesv2/icons08/new08s.gif\" style=\"vertical-align:middle; display:inline;\">";
    }
    if (story.is_hot) {
        result += "&nbsp;<img src=\"/imagesv2/icons08/hot08s.gif\" style=\"vertical-align:middle; display:inline;\">";
    }
    return result;
}

function makeTable(stories, id, display)
{
    // now we have the story array.  Add to a table.

    var tableStyle = ""; //" style=\"width:100%;\"";

    var tableBody = "<div id=\"" + id + "\" style=\"display:" + display + ";\">" +
        "<table" + tableStyle + "><tr>" +
        "<th align=center><b><a href=\"#\" onClick='sortByTitle()'>Title</a></b></th>" +
        "<th></th>" +
        "<th align=center><b><a href=\"#\" onClick='sortByDate()'>Date</a></b></th>" +
        "<th><b><a href=\"#\" onClick='sortByCategory()'>Category</a></b></th>" +
        "</tr>";

    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        tableBody += "<tr>" +
            "<td><a href=\"" + story.url + "\">" + story.title + "</a>" + storyRating(story) + "</td>" +
            "<td>" + story.description + "</td>" +
            "<td align=center>" + story.date + "</td>" +
            "<td><a target=\"_self\" href=\"https://www.literotica.com/c/" + story.category+ "\">" + story.category + "</a></td>" +
            "</tr>";
    }

    tableBody += "</table></div>";

    return tableBody;
}


// this actually reformats the page
function fixThePage() {

    // find the upper-level page element to use
    var pageList = document.evaluate(
        "//div[@class='page__extended']",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null);

    if (pageList == null) {
        alert('null');
        return;
    }

    var page = pageList.snapshotItem(0);

    // query the api, then parse it and load it
    var jsonText = Get(jsonUrl);

    var jsonObj = JSON.parse(jsonText);

    var storyObj = jsonObj.data;

    debugger;

    if (storyObj.length < 1) {
        return;
    }

    // create array that we will use
    const storyData = [];

    // function to pad a number with zeros
    const zeroPad = (num, places) => String(num).padStart(places, '0');

    // iterate through json story info and add to story array
    for (var i = 0; i < storyObj.length; i++)
    {
        var st = storyObj[i];

        if (st.parts == null) {
            // single-chapter
            storyData.push({title:st.title,
                                 sort_title:mangleTitle(st.title),
                                 date:new Date(st.date_approve).toISOString().slice(0, 10),
                                 url:"https://www.literotica.com/s/"+st.url,
                                 description:st.description,
                                 category:st.category_info.pageUrl,
                                 rating:st.rate_all,
                                 is_hot:st.is_hot,
                                 is_new:st.is_new
                                });
        }
        else {
            // multi-chapter.  add each individual chapter.
            for (var j = 0; j < st.parts.length; j++) {
                var part = st.parts[j];
                storyData.push({title:st.title + " " + zeroPad(j+1,2) + " - " + part.title,
                                     sort_title:mangleTitle(st.title + " " + zeroPad(j+1,2) + " - " + part.title),
                                     date:new Date(part.date_approve).toISOString().slice(0, 10),
                                     url:"https://www.literotica.com/s/"+part.url,
                                     description:part.description,
                                     category:part.category_info.pageUrl,
                                     rating:part.rate_all,
                                     is_hot:part.is_hot,
                                     is_new:part.is_new
                                    });
            }
        }
    }

    // We have stories by title.  Sort them to get by date and category

    storyData.sort(titleCompare);

    const storiesByDate = storyData.toSorted(dateCompare);

    const storiesByCategory = storyData.toSorted(categoryCompare);

    // Make the page body using the story arrays

    var pageBody = "<h2 align=\"center\">Stories by " + decodeURIComponent(author) + "</h2><br/>" +
        makeTable(storyData, "stories_by_title", "block") +
        makeTable(storiesByDate, "stories_by_date", "none") +
        makeTable(storiesByCategory, "stories_by_category", "none") +
                 "<div id=\"storyData\" style=\"display:none;\">" + JSON.stringify(storyData) + "</div>";

    page.innerHTML = pageBody;
}



