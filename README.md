# Singapore Credit Card Recommendations

Static single-page site for browsing Singapore credit card recommendations and exporting a tailored user card portfolio.

## Files

- `index.html` - page structure
- `portfolio.html` - tailored portfolio workflow
- `styles.css` - responsive UI styling
- `script.js` - filtering, Google Sheet refresh, portfolio generation and export
- `data.js` - Google Sheet config and built-in fallback card data

## Google Sheet Data

The app tries to fetch card rows from:

`https://docs.google.com/spreadsheets/d/1PfwZpYRf6wBvcuCVZIfsUjxreO5Q8A_-OWbZJH3YRnk`

Tabs:

- `Miles`
- `Cashback`

For a fully live site, publish the Google Sheet to the web or make it readable by anyone with the link. If the fetch fails, the site uses the built-in fallback data in `data.js`.

## Cloudflare Pages

Recommended setup:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`

If the files live in a GitHub repo subfolder, set the Cloudflare Pages root directory to that folder.
