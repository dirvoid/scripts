// ==UserScript==
// @name        YouTube RSS Feed
// @namespace   https://greasyfork.org/users/2240-doodles
// @author      Doodles
// @version     18
// @description Adds an RSS feed button to YouTube channels next to the subscribe button
// @icon        http://i.imgur.com/Ty5HNbT.png
// @icon64      http://i.imgur.com/1FfVvNr.png
// @match       *://www.youtube.com/*
// @match       *://youtube.com/*
// @grant       none
// @run-at      document-end
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

$(function () {
    "use strict";
    addRssFeedSupport(true);
    document.body.addEventListener("yt-navigate-finish", function (event) {
        addRssFeedSupport(false);
    });
});

function addRssFeedSupport(firstLoad) {
    if (isPlaylistPage()) {
        waitForElement("owner-container", function () {
            var playlistFeedLink = getPlaylistFeed(getPlatlistId());
            addRssLink(playlistFeedLink);
            addRssButtonPlaylist(playlistFeedLink);
        }, 330);
    } else if (isVideoPage()) {
        waitForElement("upload-info", function () {
            var channelFeedLink = getChannelFeed(getChannelIdFromVideoPage());
            removeRssLink();
            addRssLink(channelFeedLink);
            addRssButton(channelFeedLink);
        }, 330);
    } else if (isChannelPage()) {
        waitForElement("subscribe-button", function () {
            var channelId = getChannelIdFromChannelPage(firstLoad);
            if (channelId === false) {
                removeRssLink();
                addRefreshButton();
            } else {
                var channelFeedLink = getChannelFeed(channelId);
                removeRssLink();
                addRssLink(channelFeedLink);
                addRssButton(channelFeedLink);
            }
        }, 330);
    }
}

function isPlaylistPage() {
    return document.URL.indexOf("/playlist?list=") !== -1;
}

function isVideoPage() {
    return document.URL.indexOf("/watch") !== -1 && document.URL.indexOf("v=") !== -1;
}

function isChannelPage() {
    return $("#channel-header").length > 0;
}

function getPlatlistId() {
    var playlistId = document.URL.split("list=")[1].split("&")[0];
    if (!playlistId.startsWith("PL")) {
        playlistId = "PL" + playlistId;
    }
    return playlistId;
}

function getChannelIdFromVideoPage() {
    return $("#upload-info a[href*='/channel/']:first").attr("href").split("/channel/")[1];
}

function getChannelIdFromChannelPage(firstLoad) {
    if (document.URL.indexOf("/channel/") !== -1) {
        return document.URL.split("/channel/")[1].split("/")[0].split("?")[0];
    } else if (firstLoad) {
        return $("meta[property='og:url']").attr("content").split("/channel/")[1];
    } else {
        return false;
    }
}

function getChannelFeed(channelId) {
    return "http://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;
}

function getPlaylistFeed(playlistId) {
    return "http://www.youtube.com/feeds/videos.xml?playlist_id=" + playlistId;
}

function addRssLink(link) {
    $("head").append('<link rel="alternate" type="application/rss+xml" title="RSS" href="' +
            link + '" />');
}

function removeRssLink() {
    if ($("link[type='application/rss+xml']").length > 0) {
        $("link[type='application/rss+xml']").remove();
    }
}

function waitForElement(elementId, callbackFunction, intervalLength = 330) {
    var waitCount = 15000 / intervalLength; // wait 15 seconds maximum
    var wait = setInterval(function () {
        waitCount--;
        if ($("#" + elementId).length > 0) {
            callbackFunction();
            clearInterval(wait);
        } else if (waitCount <= 0) {
            console.log("YouTube RSS Feed UserScript - wait for element \"#" + elementId + 
                    "\" failed! Time limit (15 seconds) exceeded.");
            clearInterval(wait);
        }
    }, intervalLength);
}

function addRssButton(link) {
    if ($("#rssSubButton").length > 0) {
        $("#rssSubButton").remove();
    }
    $("#subscribe-button")
            .css({
                "display": "flex",
                "flex-flow": "nowrap",
                "height": "37px"
            })
            .prepend(makeRssButton(link));
}

function addRssButtonPlaylist(link) {
    if ($("#rssSubButton").length === 0) {
        $("#owner-container > #button")
                .css({
                    "display": "flex",
                    "flex-flow": "nowrap",
                    "height": "37px"
                })
                .prepend(makeRssButton(link));
    }
}

function makeRssButton(link) {
    return $("<a>RSS</a>")
            .attr("id", "rssSubButton")
            .attr("target", "_blank")
            .attr("href", link)
            .css({
                "background-color": "#fd9b12",
                "border-radius": "3px",
                "padding": "10px 16px",
                "color": "#ffffff",
                "font-size": "14px",
                "text-decoration": "none",
                "text-transform": "uppercase",
                "margin-right": "5px"
            });
}

function addRefreshButton() {
    var refreshButton = $("<a>Refresh</a>")
            .attr("id", "rssSubButton")
            .attr("href", "#")
            .css({
                "background-color": "#fd9b12",
                "border-radius": "3px",
                "padding": "10px 16px",
                "color": "#ffffff",
                "font-size": "14px",
                "text-decoration": "none",
                "text-transform": "uppercase",
                "margin-right": "5px"
            });
    $(refreshButton).click(function (e) {
        e.preventDefault();
        var r = confirm("Due to how YouTube load pages, there isn't a reliable way to get channel" + 
                " IDs from channel pages if you've navigated to them from another YouTube page." + 
                " The solution is to reload the page.\n\nWould you like to reload the page?");
        if (r === true) {
            window.location.reload();
        }
    });
    if ($("#rssSubButton").length > 0) {
        $("#rssSubButton").remove();
    }
    $("#subscribe-button")
            .css({
                "display": "flex",
                "flex-flow": "nowrap",
                "height": "37px"
            })
            .prepend(refreshButton);
}
