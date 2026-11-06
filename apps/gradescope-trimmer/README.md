# Gradescope PDF Trimmer

A web application that simplifies processing Gradescope submission exports by automatically trimming PDFs to the first N pages and renaming them by student ID.

## Features

-   **Simple ZIP upload** - Upload the ZIP file exported directly from Gradescope
-   **Automatic metadata parsing** - Reads `submission_metadata.yml` for student information
-   **PDF trimming** - Keep only the first N pages from each submission
-   **Automatic renaming** - Files are renamed by student ID (e.g., `12345678.pdf`)
-   **Batch processing** - Handles all submissions at once with progress tracking
-   **ZIP output** - Downloads a new ZIP file with processed PDFs

## How to Use

1. **Export from Gradescope:**

    - Go to your assignment in Gradescope
    - Click "Download Submissions" and select the ZIP export option
    - The ZIP should contain `submission_metadata.yml` and all PDF submissions

2. **Process submissions:**

    - Open the [Gradescope PDF Trimmer](https://vikramsinghmtl.github.io/gradescope-trimmer/)
    - Upload the exported ZIP file
    - Review the metadata table showing all submissions
    - Set how many pages to keep (default: 1)
    - Click "Process & Download"

3. **Use the processed files:**
    - The output ZIP will contain trimmed PDFs renamed by student ID
    - Extract and use the processed PDFs as needed

## Why This Tool?

When manually grading Gradescope assignments, instructors often need to:

-   Download all submissions
-   Trim cover pages or unnecessary pages
-   Rename files by student ID for easier tracking

This tool automates all three steps, saving significant time when processing large classes.

## Resources

-   If you encounter any issues, feel free to [email me](mailto:vikram.singh@johnabbott.qc.ca)
-   View the project on [GitHub](https://github.com/VikramSinghMTL/gradescope-trimmer)

## License

This project is open-source and available under the [MIT License](LICENSE).

### Disclaimer

This tool is designed specifically for Gradescope's ZIP export format and requires the `submission_metadata.yml` file to function properly.
