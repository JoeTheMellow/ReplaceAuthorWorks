// Literotica - replace author works page
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
// @match       https://www.literotica.com/authors/*/works/*
// @version 0.07
// @grant GM_addStyle
// @run-at document-end
// ==/UserScript==

// extract the author name from the current url
var currentUrl = window.location.href;

// look for "authors" in the url
var pos = currentUrl.indexOf("authors/");

if (pos < 0) {
    return;
}

// advance past the "authors/" string
pos += 8;
var author = currentUrl.substring(pos);

// find trailing /
pos = author.indexOf("/");
if (pos < 0) {
    return;
}

// grab the author name
author = author.substring(0, pos);

GM_addStyle("table {display: block; overflow-x: auto; white-space: nowrap !important;} " +
    "th { padding: 2px !important; font-size: 14px !important; border: 1px solid black !important; text-align: center !important;} " +
    "td { padding: 2px !important; font-size: 11px !important; border: 1px solid black !important; padding-right: 6px !important;} " +
    "a {color:dodgerblue !important;} a:visited {color: purple !important;}");

var newScript = document.createElement("script");

newScript.innerText =
  "var sortOrder = 1; " +
  "const sortInfo = new Map([" +
    "['story', {order: 1, col: 'title'}]," +
    "['poem', {order: 1, col: 'title'}]," +
    "['illustra', {order: 1, col: 'title'}]," +
    "['audio', {order: 1, col: 'title'}]" +
  "]);" +

  "function sortTable(col, category) " +
  "{" +
    "sortOrder = sortInfo.get(category).order;" +
    "if (sortInfo.get(category).col == col) {" +
    "  sortOrder = -sortOrder;" +
    "  sortInfo.set(category, {order: sortOrder, col: col});" +
    "}" +
    "else {" +
    "  sortInfo.set(category, {order: 1, col: col});" +
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
    "        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('title','\" + category + \"')\\\">Title</a></b></th>\" +" +
    "        \"<th></th>\" +" +
    "        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('date','\" + category + \"')\\\">Date</a></b></th>\" +" +
    "        \"<th><b><a href=\\\"#\\\" onClick=\\\"sortTable('category','\" + category + \"')\\\">Category</a></b></th>\" +" +
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
    "var result = \"\";" +
    "if (story.rating != null) {" +
    "    result += \"&nbsp;(\" + story.rating + \")\";" +
    "}" +
    "if (story.is_new) {" +
    "    result += \"&nbsp;<img src='data:image/gif;base64,R0lGODlhFAAJAJEAAP7xqi8pCPzcKwAAACH5BAAAAAAALAAAAAAUAAkAAAIghI6paOsf4olB1HSnzrfj7Vka4nFjJorUVEnPqzTwAhQAOw==' style='vertical-align:middle; display:inline;'>\";" +
    "}" +
    "if (story.is_hot) {" +
    "    result += \"&nbsp;<img src='data:image/gif;base64,R0lGODlhCQAJAJEAAPaekP///+w0FgAAACH5BAAAAAAALAAAAAAJAAkAAAIRhI5iyRL4oIShxnOvmw0tBhQAOw==' style='vertical-align:middle; display:inline;'>\";" +
    "}" +
    "return result;" +
  "}";


document.head.appendChild(newScript);

var categoryCount = GetCategoryCounts(author);

var sectionCount = 0;
categoryCount.forEach (function(value, key) {
    if (value > 0) {
        sectionCount++;
    }
})

// and fix the page.
fixThePage();

// ------------------------

// return the response from the url
function GetJsonUrl(url)
{
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET", url, false);
    Httpreq.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    Httpreq.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
    Httpreq.setRequestHeader("Pragma", "no-cache");
    Httpreq.send(null);
    return JSON.parse(Httpreq.responseText);
}

// get count of the different work types for this author
function GetCategoryCounts(author)
{
    var url = "https://literotica.com/api/3/users/" + author + "?params={%22withProfile%22:false}";
    var jsonObj = GetJsonUrl(url);
    var userObj = jsonObj.user;

    return new Map([
        ["story", userObj.stories_count],
        ["poem", userObj.poems_count],
        ["illustra", userObj.illustrations_count],
        ["audio", userObj.audios_count]
    ]);
}

function GetCategoryData(author, category)
{
    // create array that we will use
    const storyData = [];

    var maxCount = categoryCount.get(category);
    if (maxCount == 0) {
        return storyData;
    }

    // function to zero pad a number
    var zeroPad = (num, places) => String(num).padStart(places, '0');

    // function to show a rating if there is one
    var fixRating = (rating) => {
        if (rating != null && rating != 0) {
            return rating;
        }
        return null;
    }

    // function to create sort title
    var mangleTitle = (title) => {
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


    var page = 0;
    var curCount = maxCount;

    while (curCount > 0) {
		// grab 500 stories at a time
        page++;
		var pageCount = 500;
		curCount -= pageCount;

        var url = "https://literotica.com/api/3/users/" + author + "/series_and_works?params={%22page%22%3A" + page + "%2C%22pageSize%22%3A" + pageCount + "%2C%22type%22%3A%22" + category + "%22%2C%22listType%22%3A%22expanded%22}";

        var jsonObj = GetJsonUrl(url);

        var storyObj = jsonObj.data;

		// iterate through json story info and add to story array
		for (var i = 0; i < storyObj.length; i++) {
			var st = storyObj[i];
			var urlPart;

			if (st.parts == null) {
				// single-chapter
				urlPart = st.category_info.type.slice(0, 1);
				storyData.push({
					title: st.title,
					sort_title: mangleTitle(st.title),
					date: new Date(st.date_approve).toISOString().slice(0, 10),
					url: "https://www.literotica.com/" + urlPart + "/" + st.url,
					description: st.description,
					category: st.category_info.pageUrl,
					rating: fixRating(st.rate_all),
					is_hot: st.is_hot,
					is_new: st.is_new
				});
			}
			else {
				// multi-chapter.  add each individual chapter.
				var places;
				if (st.parts.length < 10) {
					places = 1;
				}
				else if (st.parts.length < 100) {
					places = 2;
				}
				else if (st.parts.length < 1000) {
					places = 3;
				}
				else {
					places = 4;
				}

				for (var j = 0; j < st.parts.length; j++) {
					var part = st.parts[j];
					urlPart = part.category_info.type.slice(0, 1);
                    var partTitle = part.title;
                    if (partTitle.toLowerCase().startsWith(st.title.toLowerCase())) {
                        partTitle = partTitle.substring(st.title.length);
                        partTitle = partTitle.replace(/(^\W*)/g, '');
                        if (partTitle == "") {
                            partTitle = (j+1);
                        }
                    }
					storyData.push({
						title: st.title + " " + zeroPad(j + 1, places) + " - " + partTitle,
						sort_title: mangleTitle(st.title + " " + zeroPad(j + 1, places) + " - " + partTitle),
						date: new Date(part.date_approve).toISOString().slice(0, 10),
						url: "https://www.literotica.com/" + urlPart + "/" + part.url,
						description: part.description,
						category: part.category_info.pageUrl,
						rating: fixRating(part.rate_all),
						is_hot: part.is_hot,
						is_new: part.is_new
					});
				}
			}
		}
    }
    return storyData;
}

function makeIndexLine(title, category)
{
    if (categoryCount.get(category) == 0) {
        return "";
    }
    return "<a href=\"#" + category + "\">" + title + "</a> ";
}

function makeSection(author, heading, category, indexLine) {
    // create array that we will use
    const storyData = GetCategoryData(author, category);

    if (storyData.length == 0) {
        return "";
    }

    // Sort stories by title
    storyData.sort(function (a, b) { return a.sort_title.localeCompare(b.sort_title) });

    // Make the page body using the story array

    var pageBody = "<br/>" + indexLine + "<h2 id=\"" + category + "\" align=\"center\">" + heading + " by " + decodeURIComponent(author) + " (" + categoryCount.get(category) + ")</h2><br/>" +
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

    var indexLine = "";
    if (sectionCount > 1) {
        indexLine += makeIndexLine("Stories", "story");
        indexLine += makeIndexLine("Poems", "poem");
        indexLine += makeIndexLine("Artworks", "illustra");
        indexLine += makeIndexLine("Audios", "audio");
        indexLine = "<p align=\"center\">Jump to: " + indexLine + "</p><br/>";
    }

    // create story section
    pageBody += makeSection(author, "Stories", "story", indexLine);

    // create poem section
    pageBody += makeSection(author, "Poems", "poem", indexLine);

    // create art section
    pageBody += makeSection(author, "Artworks", "illustra", indexLine);

    // create audio section
    pageBody += makeSection(author, "Audios", "audio", indexLine);

    pageBody += "<br/>" + indexLine;

    page.innerHTML = pageBody;
}



