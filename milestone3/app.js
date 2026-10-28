
/* IT 4403 - Milestone 3
   Open Library Single Page Application
   Uses jQuery AJAX for all API requests.
*/

// Track the current search and its results.
let searchResults = [];
let currentPage = 1;
let searchRequest = null;
let detailRequest = null;

const resultsPerPage = 10;
const maxResults = 50;

// Keep previously loaded book details to avoid extra requests.
const detailCache = {};

// Start the application after the webpage loads.
$(document).ready(function () {
    $("#searchForm").on("submit", handleSearch);

    // Load the science fiction collection automatically.
    loadCollection();
});

// Search Open Library using jQuery AJAX.
function handleSearch(event) {
    event.preventDefault();

    const searchTerm = $("#searchInput").val().trim();

    if (!searchTerm) {
        $("#searchMessage").text("Please enter a book title or keyword.");
        return;
    }

    // Stop an earlier search if another search begins.
    if (searchRequest) {
        searchRequest.abort();
    }

    searchResults = [];
    currentPage = 1;

    $("#results").empty();
    $("#pagination").empty();
    $("#searchMessage").text("Loading books...");
    $("#searchButton").prop("disabled", true);

    // Request up to 50 books from Open Library.
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
        searchResults = Array.isArray(data.docs) ? data.docs : [];

        if (searchResults.length === 0) {
            $("#searchMessage").text("No books found. Try another search.");
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

    searchRequest.always(function () {
        $("#searchButton").prop("disabled", false);
    });
}

// Display 10 books for the selected page.
function displaySearchResults() {
    $("#results").empty();

    const start = (currentPage - 1) * resultsPerPage;
    const pageBooks = searchResults.slice(
        start,
        start + resultsPerPage
    );

    pageBooks.forEach(function (book) {
        const workID = getWorkID(book.key);

        const card = createBookCard(
            book.title,
            book.cover_i,
            workID,
            book.author_name
        );

        $("#results").append(card);
    });

    displayPagination();
}

// Create pagination controls without reloading the page.
function displayPagination() {
    $("#pagination").empty();

    const totalPages = Math.ceil(
        searchResults.length / resultsPerPage
    );

    if (totalPages === 0) {
        return;
    }

    const label = $("<p>").text(
        `Page ${currentPage} of ${totalPages}`
    );

    $("#pagination").append(label);

    for (let page = 1; page <= totalPages; page++) {
        const button = $("<button>")
            .attr("type", "button")
            .text(page)
            .prop("disabled", page === currentPage);

        button.on("click", function () {
            currentPage = page;
            displaySearchResults();
        });

        $("#pagination").append(button);
    }
}

// Display a book card in either section.
function createBookCard(title, coverID, workID, authors) {
    const card = $("<div>").addClass("book-card");

    if (coverID) {
        const cover = $("<img>")
            .attr(
                "src",
                `https://covers.openlibrary.org/b/id/${coverID}-M.jpg`
            )
            .attr("alt", `Cover of ${title || "book"}`);

        // Show fallback text if the image cannot load.
        cover.on("error", function () {
            $(this).replaceWith(
                $("<p>").text("No cover available.")
            );
        });

        card.append(cover);
    } else {
        card.append($("<p>").text("No cover available."));
    }

    card.append(
        $("<h3>").text(title || "Untitled book")
    );

    const button = $("<button>")
        .attr("type", "button")
        .text("View Details");

    button.on("click", function () {
        // Load the selected book's details.
        loadBookDetails(workID, authors);

        // Move the details section below the selected book.
        $("#detailsSection").insertAfter(card);

        // Make the details visible.
        $("#detailsSection").show();
    });

    if (!workID) {
        button.prop("disabled", true);
    }

    card.append(button);

    return card;
}

// Extract the Work ID from an Open Library key.
function getWorkID(key) {
    if (typeof key !== "string") {
        return "";
    }

    return key.split("/").pop();
}

// Retrieve the selected book's details using AJAX.
function loadBookDetails(workID, authors = []) {
    if (!workID) {
        $("#bookDetails").text("Book details are unavailable.");
        return;
    }

    // Cancel an older details request when selecting another book.
    if (detailRequest) {
        detailRequest.abort();
        detailRequest = null;
    }

    $("#bookDetails").text("Loading book details...");

    if (detailCache[workID]) {
        displayBookDetails(detailCache[workID], workID, authors);
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
}

// Show all required book information on the same page.
function displayBookDetails(book, workID, authors) {
    const container = $("#bookDetails");
    container.empty();

    const coverID = Array.isArray(book.covers)
        ? book.covers[0]
        : null;

    if (coverID) {
        const cover = $("<img>")
            .attr(
                "src",
                `https://covers.openlibrary.org/b/id/${coverID}-M.jpg`
            )
            .attr("alt", `Cover of ${book.title || "book"}`);

        cover.on("error", function () {
            $(this).replaceWith(
                $("<p>").text("No cover available.")
            );
        });

        container.append(cover);
    } else {
        container.append($("<p>").text("No cover available."));
    }

    container.append(
        $("<h3>").text(book.title || "Untitled book")
    );

    container.append(
        $("<p>").text(`Work ID: ${workID}`)
    );

    const authorText = Array.isArray(authors) && authors.length
        ? authors.join(", ")
        : "Not available";

    container.append(
        $("<p>").text(`Authors: ${authorText}`)
    );

    // Descriptions may be plain text or an object.
    let description = "No description available.";

    if (typeof book.description === "string") {
        description = book.description;
    } else if (
        book.description &&
        typeof book.description.value === "string"
    ) {
        description = book.description.value;
    }

    container.append(
        $("<p>").text(`Description: ${description}`)
    );

    // Display up to 10 subjects.
    const subjects = Array.isArray(book.subjects)
        ? book.subjects.slice(0, 10)
        : [];

    container.append(
        $("<p>").text(
            `Subjects: ${subjects.length
                ? subjects.join(", ")
                : "Not available"}`
        )
    );

    const link = $("<a>")
        .attr(
            "href",
            `https://openlibrary.org/works/${encodeURIComponent(workID)}`
        )
        .attr("target", "_blank")
        .attr("rel", "noopener noreferrer")
        .text("View on Open Library");

    container.append(link);
}

// Load a predefined science fiction collection.
function loadCollection() {
    $("#collectionMessage").text("Loading collection...");
    $("#collectionResults").empty();

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

            books.forEach(function (book) {
                const authors = Array.isArray(book.authors)
                    ? book.authors.map(function (author) {
                        return author.name;
                    }).filter(Boolean)
                    : [];

                const card = createBookCard(
                    book.title,
                    book.cover_id,
                    getWorkID(book.key),
                    authors
                );

                $("#collectionResults").append(card);
            });
        })
        .fail(function () {
            $("#collectionMessage").text(
                "Unable to load the collection. Please try again."
            );
        });
}
