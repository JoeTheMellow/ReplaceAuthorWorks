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
// @match       https://www.literotica.com/authors/*/works/poetry
// @match       https://www.literotica.com/authors/*/works/artworks
// @match       https://www.literotica.com/authors/*/works/audio
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

GM_addStyle("th { padding: 2px !important; font-size: 14px !important;  white-space:nowrap !important; border: 1px solid black !important; text-align: center !important;} " +
            "td { padding: 2px !important; font-size: 11px !important;  white-space:nowrap !important; border: 1px solid black !important; padding-right: 6px !important;} " +
            "a {color:blue !important;} a:visited {color: purple !important;}");

var newScript = document.createElement("script");

newScript.innerText =
"var sortOrder = 1; " +
"var sortColumn = \"title\"; " +
"function sortTable(col, category) " +
"{" +
  "if (sortColumn == col) {" +
  "  sortOrder = -sortOrder;" +
  "}" +
  "else {" +
  "  sortColumn = col;" +
  "  sortOrder = 1;" +
  "}" +

  "var sortCompare;" +

  "if (col == \"title\") {" +
"  sortCompare = titleCompare;" +
"}" +
"else if (col == \"date\") {" +
"  sortCompare = dateCompare;" +
"}" +
"else if (col == \"category\") {" +
"  sortCompare = categoryCompare;" +
"}" +

"var stories = JSON.parse(document.getElementById(category + \"Data\").innerHTML);" +

"stories.sort(sortCompare);" +
"document.getElementById(category + \"_table\").innerHTML = makeTable(stories, category);" +
"}" +

"function makeTable(stories, category)" +
"{" +
"    var tableBody = " +
"        \"<table><tr>\" +" +
"        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('title',category)\\\">Title</a></b></th>\" +" +
"        \"<th></th>\" +" +
"        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('date',category)\\\">Date</a></b></th>\" +" +
"        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('category',category)\\\">Category</a></b></th>\" +" +
"        \"</tr>\";" +
"    for (var i = 0; i < stories.length; i++) {" +
"        var story = stories[i];" +
"        tableBody += \"<tr>\" +" +
"            \"<td><a href=\\\"\" + story.url + \"\\\">\" + story.title + \"</a>\" + storyRating(story) + \"</td>\" +" +
"            \"<td>\" + story.description + \"</td>\" +" +
"            \"<td align=center>\" + story.date + \"</td>\" +" +
"            \"<td><a target=\\\"_self\\\" href=\\\"https://www.literotica.com/c/\" + story.category+ \"\\\">\" + story.category + \"</a></td>\" +" +
"            \"</tr>\";" +
"    }" +
"    tableBody += \"</table>\";" +
"    return tableBody;" +
"}" +
"function titleCompare(a, b)" +
"{" +
"return sortOrder * a.sort_title.localeCompare(b.sort_title);" +
"}" +
"function categoryCompare(a, b)" +
"{" +
"var result = sortOrder * a.category.localeCompare(b.category);" +
"if (result != 0) return result;" +
"return titleCompare(a,b);" +
"}" +
"function dateCompare(b, a)" +
"{" +
"return sortOrder * a.date.localeCompare(b.date);" +
"}" +
"function storyRating(story)" +
"{" +
"    var result = \"\";" +
"    if (story.rating != null) {" +
"        result += \"&nbsp;(\" + story.rating + \")\";" +
"    }" +
"    if (story.is_new) {" +
"        result += \"&nbsp;<img src='/imagesv2/icons08/new08s.gif' style='vertical-align:middle; display:inline;'>\";" +
"    }" +
"    if (story.is_hot) {" +
"        result += \"&nbsp;<img src='/imagesv2/icons08/hot08s.gif' style='vertical-align:middle; display:inline;'>\";" +
"    }" +
"    return result;" +
"}";


document.head.appendChild(newScript);

// and fix the page.
fixThePage();

// ------------------------

// return the response from the url
function Get(author, category)
{
    var url = "https://literotica.com/api/3/users/" + author + "/series_and_works?params={%22page%22%3A1%2C%22pageSize%22%3A5000%2C%22type%22%3A%22" + category + "%22%2C%22listType%22%3A%22expanded%22}";
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",url,false);
    Httpreq.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    Httpreq.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
    Httpreq.setRequestHeader("Pragma", "no-cache");
    Httpreq.send(null);

    var jsonObj = JSON.parse(Httpreq.responseText);

    var storyObj = jsonObj.data;

    // create array that we will use
    const storyData = [];

    if (storyObj.length < 1) {
        return storyData;
    }

    // function to pad a number with zeros
    const zeroPad = (num, places) => String(num).padStart(places, '0');

    // iterate through json story info and add to story array
    for (var i = 0; i < storyObj.length; i++)
    {
        var st = storyObj[i];
		var urlPart;

        if (st.parts == null) {
            // single-chapter
			urlPart = st.category_info.type.slice(0,1);
                debugger;
            storyData.push({title:st.title,
                                 sort_title:mangleTitle(st.title),
                                 date:new Date(st.date_approve).toISOString().slice(0, 10),
                                 url:"https://www.literotica.com/" + urlPart + "/"+st.url,
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
 			    urlPart = part.category_info.type.slice(0,1);
                debugger;
                storyData.push({title:st.title + " " + zeroPad(j+1,2) + " - " + part.title,
                                     sort_title:mangleTitle(st.title + " " + zeroPad(j+1,2) + " - " + part.title),
                                     date:new Date(part.date_approve).toISOString().slice(0, 10),
                                     url:"https://www.literotica.com/" + urlPart + "/"+part.url,
                                     description:part.description,
                                     category:part.category_info.pageUrl,
                                     rating:part.rate_all,
                                     is_hot:part.is_hot,
                                     is_new:part.is_new
                                    });
            }
        }
    }
	return storyData;
}

function mangleTitle(title)
{
    var result = title.toString().toLowerCase().trim();

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

function makeSection(author, heading, category)
{
    // create array that we will use
    const storyData = Get(author, category);

	if (storyData.length == 0) {
	  return "";
	}

    // Sort stories by title
    storyData.sort(function(a, b){return a.sort_title.localeCompare(b.sort_title)});

    // Make the page body using the story array

    var pageBody = "<br/><h2 align=\"center\">" + heading + decodeURIComponent(author) + "</h2><br/>" +
        "<div id=\"" + category + "_table\">" +
        makeTable(storyData, category) +
        "</div>" +
        "<div id=\"" + category + "Data\" style=\"display:none;\">" + JSON.stringify(storyData) + "</div>";

    return pageBody;
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

    var pageBody = "";

    // create story section
    pageBody += makeSection(author, "Stories by ", "story");

    // create poem section
    pageBody += makeSection(author, "Poems by ", "poem");

    // create art section
    pageBody += makeSection(author, "Artworks by ", "illustra");

    // create audio section
    pageBody += makeSection(author, "Audios by ", "audio");

    page.innerHTML = pageBody;
}



