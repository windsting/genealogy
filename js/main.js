var PageState = {
    books: null,
    book: null,
    imageNames: null,
    pageTextOrg: null,
    pageText: []
};

function bookTitle(path) {
    'use strict';
    // log("getting title for path:" + path);
    if (!PageState || !PageState.books) {
        log(PageState);
        log(PageState.books);
        return null;
    }

    var book = PageState.books.find(function (elem) {
        return elem.path === path;
    });

    // log("title of:[" + path + "] is:" + book.title);
    return book.title;
}

function log(content) {
    'use strict';
    console.trace(content);
}

function setLink(id, hrefText) {
    'use strict';
    var elem = document.getElementById(id);
    if (elem) {
        if (hrefText) {
            elem.href = hrefText;
            elem.classList.remove('disabled');
        } else {
            elem.href = "";
            elem.classList.add('disabled');
        }
    }
}

function setImage(id, imagePath) {
    'use strict';
    var elem = document.getElementById(id);
    elem.src = imagePath;
}

function setText(id, html) {
    'use strict';

    var elem = document.getElementById(id);
    if (html) {
        html = replaceAll(html, '--', '<hr class="era"/>');
        // html = html.split('--').join('<hr class="era"/>');
    }
    elem.innerHTML = html;
}

function setPage(page) {
    'use strict';
    var list = PageState.imageNames;
    var book = PageState.book;
    setLink('prev', page <= 0 ? null : buildLink(book, (page - 1)));
    setLink('next', page >= list.length - 1 ? null : buildLink(book, (page + 1)));
    // log('gonna load page:' + page + " from list:" + JSON.stringify(list));
    setImage('page-image', "./" + book + "/img/" + list[page]);
    setText('page-text', PageState.pageText[page] || "<p>尚未输入</p>");
}

function loadBookScript(book, initPage) {
    'use strict';
    var s = document.createElement('script');
    s.type = "text/javascript";
    s.async = true;
    s.innerHTML = null;
    s.addEventListener("load", function (evt) {
        PageState.imageNames = files;
        setPage(initPage || 0);
        // log(PageState.imageNames);
    });

    s.src = "./" + book + "/book.js";
    var d = document.getElementById("content-js");
    d.innerHTML = "";
    d.appendChild(s);
}

function markdown2Html(text) {
    'use strict';
    if (text === null) {

    }
    var converter = new showdown.Converter({
        tables: true,
        strikethrough: true
    });
    var html = converter.makeHtml(text);
    // log(converter.getOptions());
    return html;
}

function processMarkdown(markdown) {
    'use strict';
    var md = markdown;
    var list = [];
    var html = null;
    if (markdown) {
        var splitter = '<hr />';
        html = markdown2Html(markdown);
        list = html.split(splitter);
        PageState.pageTextOrgCs = md;
        PageState.pageTextCs = list;
        PageState.TextFullCs = html;
        // log(list);
        // convert to Chinese traditionalized
        var md_ct = Traditionalized(md);
        var html_ct = markdown2Html(md_ct);
        var list_ct = html_ct.split(splitter);
        PageState.pageTextOrgCt = md_ct;
        PageState.pageTextCt = list_ct;
        PageState.TextFullCt = html_ct;

        var checkbox = document.getElementById("ctcs");
        if(checkbox.checked){
            html = html_ct;
            md = md_ct;
            list = list_ct;
        }
    }
    PageState.pageTextOrg = md;
    PageState.pageText = list;

    return html;
}

function setFullText(html) {
    'use strict';
    setText('full', html);
}

function setBook(book, page) {
    'use strict';
    // log('setting book: ' + book);
    PageState.book = book;
    loadBookMarkdown('./' + book, function (md) {
        // md = Traditionalized(md);
        var html = processMarkdown(md);
        setFullText(html);
        loadBookScript(book, page);
    });
}

function onCtCsChange(element) {
    'use strict';
    // log(element.checked);
    var postfix = element.checked ? "Ct" : "Cs";
    function changeText(suffix){
        PageState.pageText = PageState["pageText" + suffix];
        setFullText(PageState['TextFull' + suffix]);
        var pageInfo = currentHashInfo();
        setText('page-text', PageState.pageText[pageInfo.page] || "<p>尚未输入</p>");
    }

    changeText(postfix);
}

function loadBookMarkdown(filePath, callback) {
    'use strict';
    var client = new XMLHttpRequest();
    client.open('GET', filePath + '/book.md');
    client.onload = function () {
        if (client.status === 200) {
            var resp = client.responseText ? client.responseText : "empty";
            callback(client.responseText);
        } else {
            callback(null);
        }
    };
    client.send();
}

function foreachLink(func) {
    var navLinks = document.getElementsByClassName("nav-link");
    // log(navLinks.length);
    for (var j = 0; j < navLinks.length; ++j) {
        var elem = navLinks[j];
        func(elem);
    }
}

function activeNavLink(elem) {
    foreachLink(function (e) {
        e.parentNode.classList.remove("active");
    });
    elem.parentElement.classList.add("active");
}

function addLinkHandlers() {
    'use strict';

    function addHandler(elem) {
        elem.addEventListener('click', function (evt) {
            activeNavLink(elem);
        });
    }
    foreachLink(addHandler);
}

function addHandlers() {
    addLinkHandlers();

    var btn = document.getElementById("full-toggle");
    if (btn) {
        btn.addEventListener('click', function (evt) {
            var full = document.getElementById("full");
            if (full) {
                full.classList.toggle("d-none");
            }
        });
    }
}

function buildLink(path, page, splitter) {
    page = page || 0;
    splitter = splitter || "_";
    var link = ["#", path, page].join(splitter);
    return link;
}

function addNavItems(books) {
    var navWrapper = document.getElementById("nav-wrapper");
    navWrapper.innerHTML = "";
    var defaultLi = null;
    var defaultBook = null;
    books.forEach(function (book) {
        var li = createNavItem(book.path, book.title);
        if (defaultLi === null || book.default) {
            defaultLi = li;
            defaultBook = book;
        }
        // log(li);
        navWrapper.appendChild(li);
    });

    if (defaultLi) {
        defaultLi.classList.add("active");
    }

    var defaultLink = buildLink(defaultBook.path);
    return defaultLink;

    function createNavItem(path, text) {
        var a = document.createElement("a");
        a.classList.add("nav-link");
        a.setAttribute("href", buildLink(path));
        a.innerText = text;
        var li = document.createElement("li");
        li.classList.add("nav-item");
        li.appendChild(a);
        return li;
    }
}

function checkHeight(id) {
    return $("#" + id).height();
}

function run(books, disqus) {
    'use strict';

    checkHeight("disqus_thread");

    PageState.books = books;

    var defaultLink = addNavItems(books);

    addHandlers();

    configDisqus(disqus.url, disqus.shortName);

    window.onhashchange = hashChanged;
    if (!window.location.hash) {
        setHash(defaultLink);
    }
    hashChanged(null, 2000);

    $('[data-toggle="tooltip"]').tooltip();
}

function currentHashInfo(){
    'use strict';
    var b = '01';
    var p = 0;
    var splitter = '_';
    // log(window.location.hash);
    if (window.location.hash.length > 0) {
        var pageName = window.location.hash.substr(1);
        // log(pageName);
        splitter = pageName.substr(0, 1);
        // log(splitter);
        var parts = pageName.split(splitter);
        // log(parts);
        b = parts[1] || '01';
        p = parseInt(parts[2]) || 0;
    }

    return {book : b, page: p};
}

function hashChanged(ev, delayMilliseconds) {
    'use strict';
    delayMilliseconds = delayMilliseconds || 0;
    // log(ev);
    var pageInfo = currentHashInfo();
    var b = pageInfo.book;
    var p = pageInfo.page;
    // log(b);
    // log(PageState.book);
    if (b != PageState.book) {
        setBook(b, p);
        var linkText = "'" + buildLink(b) + "'";
        var navLink = getElementsByAttribute("href", linkText);
        // log(navLink);
        if (navLink && navLink.length) {
            activeNavLink(navLink[0]);
        }
    } else {
        setPage(p);
    }

    doFuncWhen(function(){
        // log("resetDisqus called");
        resetDisqus(b, p);
    }, function(){
        return window.DISQUS !== undefined;
    });
}

function setHash(hashContent) {
    if (history.pushState) {
        history.pushState(null, null, hashContent);
    } else {
        location.hash = hashContent;
    }
}

var getElementsByAttribute = function (attr, value) {
    if ('querySelectorAll' in document) {
        return document.querySelectorAll("[" + attr + "=" + value + "]");
    } else {
        var els = document.getElementsByTagName("*"),
            result = [];

        for (var i = 0, _len = els.length; i < _len; i++) {
            var el = els[i];

            if (el.hasAttribute(attr)) {
                if (el.getAttribute(attr) === value) result.push(el);
            }
        }

        return result;
    }
}

function getParameterByName(name, url) {
    'use strict';
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function replaceAll(str, orgin, replacement) {
    return str.split(orgin).join(replacement);
}

function doFuncWhen(func, condition, count) {
    count = count || 100;
    var intervalCount = 0;
    var interval = setInterval(function(){
        intervalCount += 1;
        if(condition()) {
            func();
            clearInterval(interval);            
        }

        if(intervalCount >= count) {
            clearInterval(interval);
        }
    }, 100);
}

var resetDisqus = null;
function configDisqus(url, shortName) {
    'use strict';

    var disqus_config = function () {
        this.page.url = url; // Replace PAGE_URL with your page's canonical URL variable
        this.page.identifier = shortName; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
    };

    //  reset on hashChanged
    function reset(book, page) {
        // log("" + book + ", " + page);
        if (window.DISQUS === undefined) {
            return;
        }
        var newIdentifier = buildLink(book, page).replace("#_", "");
        var newUrl = url + newIdentifier;
        var newTitle = book + " page: " + page;
        // log("newTile:" + newTitle);
        DISQUS.reset({
            reload: true,
            config: function () {
                this.page.identifier = newIdentifier;
                this.page.url = newUrl;
                this.page.title = newTitle;
            }
        });
    }

    resetDisqus = reset;

    // DON'T EDIT BELOW THIS LINE
    var d = document,
        s = d.createElement('script');
    s.src = '//' + shortName + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
}