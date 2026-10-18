
/* Milestone 2 - Book Details
   Retrieves information about a selected book from Open Library.
   Displays its cover, title, author, publication year,
   and description when available.
*/

// Find the section where book details will appear.
const bookDetails = document.getElementById("bookDetails");

// Get the book ID passed from the search results page.
const urlParams = new URLSearchParams(window.location.search);
const bookID = urlParams.get("id");

// Request the selected book's information.
async function loadBookDetails() {
    if (!bookID) {
        bookDetails.textContent = "No book selected.";
        return;
    }

    try {
        // Retrieve information about this book from Open Library.
        const response = await fetch(
            `https://openlibrary.org/works/${encodeURIComponent(bookID)}.json`
        );

        if (!response.ok) {
            throw new Error("Unable to load book details.");
        }

        const book = await response.json();

        // Clear the loading message.
        bookDetails.innerHTML = "";

        // Display the book cover when available.
        if (book.covers && book.covers.length > 0) {
            const cover = document.createElement("img");
            cover.src =
                `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`;
            cover.alt = `Cover of ${book.title}`;
            bookDetails.appendChild(cover);
        }

        // Display the book title.
        const title = document.createElement("h2");
        title.textContent = book.title || "Untitled book";
        bookDetails.appendChild(title);

        // Display the publication date when available.
        const published = document.createElement("p");
        published.textContent =
            `First Published: ${book.first_publish_date || "Not available"}`;
        bookDetails.appendChild(published);

        // Display the book description.
        const description = document.createElement("p");

        // Open Library descriptions can be strings or objects.
        if (typeof book.description === "string") {
            description.textContent = book.description;
        } else if (book.description?.value) {
            description.textContent = book.description.value;
        } else {
            description.textContent = "No description available.";
        }

        bookDetails.appendChild(description);

        // Retrieve author names using the author IDs.
        if (book.authors && book.authors.length > 0) {
            const authorNames = await Promise.all(
                book.authors.map(async (entry) => {
                    try {
                        const authorKey = entry.author?.key;

                        if (!authorKey) {
                            return "Unknown author";
                        }

                        const authorResponse = await fetch(
                            `https://openlibrary.org${authorKey}.json`
                        );

                        if (!authorResponse.ok) {
                            return "Unknown author";
                        }

                        const authorData = await authorResponse.json();
                        return authorData.name || "Unknown author";
                    } catch (error) {
                        console.error("Unable to load author:", error);
                        return "Unknown author";
                    }
                })
            );

            // Display the authors on the details page.
            const authors = document.createElement("p");
            authors.textContent = `Author: ${authorNames.join(", ")}`;

            // Place the author information underneath the title.
            title.insertAdjacentElement("afterend", authors);
        }

    } catch (error) {
        bookDetails.textContent =
            "Error loading book details. Please try again.";
        console.error(error);
    }
}

// Load the book details when the page opens.
loadBookDetails();
