
/* IT 4403 - Milestone 4
   Open Library Single Page Application
   Uses jQuery AJAX and Mustache.js.
*/

// Track search results and pagination.
let searchResults = [];
let currentPage = 1;
let searchRequest = null;
let detailRequest = null;

const resultsPerPage = 10;
const maxResults = 50;

// Save book details to avoid repeated requests.
const detailCache = {};

// Keep covers available for the details panel.
const coverCache = {};

// Track the selected view.
let currentView = "grid";

// Start the application.
$(document).ready(function () {
    $("#searchForm").on("submit", handleSearch);

    // Switch between search and collection tabs.
    $("#searchTab").on("click", function () {
        switchTab("search");
    });

    $("#collectionTab").on("click", function () {
        switchTab("collection");
    });

    // Switch between grid and list views.
    $("#gridViewButton").on("click", function () {
        changeView("grid");
    });

    $("#listViewButton").on("click", function () {
        changeView("list");
    });

    // Handle detail buttons from Mustache templates.
    $(document).on("click", ".details-button", function () {
        const workID = $(this).attr("data-work-id");
        const authorsEncoded = $(this).attr("data-authors") || "";

        let authors = [];

        try {
            authors = JSON.parse(decodeURIComponent(authorsEncoded));
        } catch (error) {
            authors = [];
        }

        loadBookDetails(workID, authors);
    });
    
    // Expand or collapse long book descriptions.
    $(document).on("click", "#toggleDescription", function () {
        const description = $("#descriptionText");

        description.toggleClass("description-collapsed");

        const isCollapsed = description.hasClass("description-collapsed");

        $(this).text(isCollapsed ? "Show More" : "Show Less");
    });

    // Load the public collection.
    loadCollection();
});

// Change the active tab without losing results.
function switchTab(tab) {
    const showSearch = tab === "search";

    $("#searchPanel").prop("hidden", !showSearch);
    $("#collectionSection").prop("hidden", showSearch);

    $("#searchTab")
        .toggleClass("active", showSearch)
        .attr("aria-pressed", showSearch);

    $("#collectionTab")
        .toggleClass("active", !showSearch)
        .attr("aria-pressed", !showSearch);
}

// Change the layout without reloading.
function changeView(view) {
    currentView = view;

    $("#results, #collectionResults")
        .toggleClass("book-grid", view === "grid")
        .toggleClass("book-list", view === "list");

    $("#gridViewButton")
        .toggleClass("active", view === "grid")
        .attr("aria-pressed", view === "grid");

    $("#listViewButton")
        .toggleClass("active", view === "list")
        .attr("aria-pressed", view === "list");
}

// Search Open Library using AJAX.
function handleSearch(event) {
    event.preventDefault();

    const searchTerm = $("#searchInput").val().trim();

    if (!searchTerm) {
        $("#searchMessage").text(
            "Please enter a book title or keyword."
        );
        switchTab("search");
        return;
    }

    // Cancel an earlier search.
    if (searchRequest) {
        searchRequest.abort();
    }

    searchResults = [];
    currentPage = 1;

    $("#results").empty();
    $("#pagination").empty();
    $("#searchMessage").text("Loading books...");
    $("#searchButton").prop("disabled", true);

    switchTab("search");

    searchRequest = $.ajax({
        url: "https://openlibrary.org/search.json",
        method: "GET",
        dataType: "json",
        data: {
            q: searchTerm,
            limit: maxResults
        }
    });

    searchRequest.done(function (data) {
        searchResults = Array.isArray(data.docs)
            ? data.docs
            : [];

        if (searchResults.length === 0) {
            $("#searchMessage").text(
                "No books found. Try another search."
            );
            return;
        }

        $("#searchMessage").text(
            `Found ${searchResults.length} books.`
        );

        displaySearchResults();
    });

    searchRequest.fail(function (xhr, status) {
        if (status !== "abort") {
            $("#searchMessage").text(
                "Unable to load books. Please try again."
            );
        }
    });

    const activeRequest = searchRequest;

    activeRequest.always(function () {
        if (searchRequest === activeRequest) {
            $("#searchButton").prop("disabled", false);
            searchRequest = null;
        }
    });
}

// Prepare book data for Mustache templates.
function prepareBook(book, isCollection = false) {
    const workID = getWorkID(book.key);

    const coverID = isCollection
        ? book.cover_id
        : book.cover_i;
        
        // Save covers from search and collection results.
        if (workID && coverID) {
            coverCache[workID] = coverID;
     }
    
    const authors = isCollection
        ? (Array.isArray(book.authors)
            ? book.authors.map(function (author) {
                return author.name;
            }).filter(Boolean)
            : [])
        : (Array.isArray(book.author_name)
            ? book.author_name
            : []);

    return {
        title: book.title || "Untitled book",
        workID: workID,
        hasWorkID: Boolean(workID),
        hasCover: Boolean(coverID),
        coverUrl: coverID
            ? `https://covers.openlibrary.org/b/id/${coverID}-M.jpg`
            : "",
        authorText: authors.length
            ? authors.join(", ")
            : "Author not available",
        authorsEncoded: encodeURIComponent(
            JSON.stringify(authors)
        )
    };
}

// Display search results using Mustache.
function displaySearchResults() {
    const start = (currentPage - 1) * resultsPerPage;

    const pageBooks = searchResults.slice(
        start,
        start + resultsPerPage
    );

    const template = $("#bookCardTemplate").html();

    const html = pageBooks.map(function (book) {
        return Mustache.render(
            template,
            prepareBook(book)
        );
    }).join("");

    $("#results").html(html);

    displayPagination();
}

// Display pagination without reloading.
function displayPagination() {
    const container = $("#pagination");
    container.empty();

    const totalPages = Math.ceil(
        searchResults.length / resultsPerPage
    );

    if (totalPages === 0) {
        return;
    }

    // Previous page button.
    const previousButton = $("<button>")
        .attr("type", "button")
        .text("Previous")
        .prop("disabled", currentPage === 1);

    previousButton.on("click", function () {
        currentPage--;
        displaySearchResults();
    });

    container.append(previousButton);

    // Current page number.
    container.append(
        $("<span>")
            .addClass("page-label")
            .text(` Page ${currentPage} of ${totalPages} `)
    );

    // Next page button.
    const nextButton = $("<button>")
        .attr("type", "button")
        .text("Next")
        .prop("disabled", currentPage === totalPages);

    nextButton.on("click", function () {
        currentPage++;
        displaySearchResults();
    });

    container.append(nextButton);
}

// Extract the Work ID from an Open Library key.
function getWorkID(key) {
    if (typeof key !== "string") {
        return "";
    }

    return key.split("/").pop();
}

// Load details for a selected book.
function loadBookDetails(workID, authors = []) {
    if (!workID) {
        $("#bookDetails").text(
            "Book details are unavailable."
        );
        return;
    }

    // Cancel an earlier details request.
    if (detailRequest) {
        detailRequest.abort();
        detailRequest = null;
    }

    $("#bookDetails").text("Loading book details...");

    if (detailCache[workID]) {
        displayBookDetails(
            detailCache[workID],
            workID,
            authors
        );
        return;
    }

    detailRequest = $.ajax({
        url: `https://openlibrary.org/works/${encodeURIComponent(workID)}.json`,
        method: "GET",
        dataType: "json"
    });

    detailRequest.done(function (book) {
        detailCache[workID] = book;
        displayBookDetails(book, workID, authors);
    });

    detailRequest.fail(function (xhr, status) {
        if (status !== "abort") {
            $("#bookDetails").text(
                "Unable to load book details. Please try again."
            );
        }
    });

    const activeRequest = detailRequest;

    activeRequest.always(function () {
        if (detailRequest === activeRequest) {
            detailRequest = null;
        }
    });
}

// Display details using the Mustache template.
function displayBookDetails(book, workID, authors) {
    
    // Use the book's cover or the saved search result cover.
    const detailCoverID = Array.isArray(book.covers)
        ? book.covers.find(function (id) {
            return id > 0;
        })
        : null;

    const coverID = detailCoverID || coverCache[workID] || null;


    // Open Library descriptions have different formats.
    let description = "No description available.";

    if (typeof book.description === "string") {
        description = book.description;
    } else if (
        book.description &&
        typeof book.description.value === "string"
    ) {
        description = book.description.value;
    }

    const subjects = Array.isArray(book.subjects)
        ? book.subjects.slice(0, 10)
        : [];

    const details = {
        title: book.title || "Untitled book",
        workID: workID,
        hasCover: Boolean(coverID),
        coverUrl: coverID
            ? `https://covers.openlibrary.org/b/id/${coverID}-M.jpg`
            : "",
        authorText: authors.length
            ? authors.join(", ")
            : "Not available",
        description: description,
        hasLongDescription: description.length > 300,
        subjects: subjects.length
            ? subjects.join(", ")
            : "Not available",
        openLibraryUrl:
            `https://openlibrary.org/works/${encodeURIComponent(workID)}`
    };

    const template = $("#bookDetailsTemplate").html();

    $("#bookDetails").html(
        Mustache.render(template, details)
    );
}

// Load the public science fiction collection.
function loadCollection() {
    $("#collectionMessage").text("Loading collection...");

    $.ajax({
        url: "https://openlibrary.org/subjects/science_fiction.json",
        method: "GET",
        dataType: "json",
        data: {
            limit: 10
        }
    })
    .done(function (data) {
        const books = Array.isArray(data.works)
            ? data.works
            : [];

        if (books.length === 0) {
            $("#collectionMessage").text(
                "No collection books are available."
            );
            return;
        }

        $("#collectionMessage").empty();

        const template = $("#collectionCardTemplate").html();

        const html = books.map(function (book) {
            return Mustache.render(
                template,
                prepareBook(book, true)
            );
        }).join("");

        $("#collectionResults").html(html);
    })
    .fail(function () {
        $("#collectionMessage").text(
            "Unable to load the collection. Please try again."
        );
    });
}
