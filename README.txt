Galena Park 1st — Overhaul Release
==================================

WHAT CHANGED
- Solid pink background (#f18dca) site-wide, no gradients.
- Accent color is yellow #e5d776 across borders, outlines, chips, etc.
- Text color is light navy #1d3557 universally.
- Header logo stays; on mobile the header logo is hidden (hero logo remains).
- Replaced 'Upcoming' announce bar with a thin yellow accent line.
- New 3-up image carousel (autoplay 3s, arrows, dots, swipe) above About.
- Favicon now uses assets/gp1.png (your logo).
- Font is Poppins by default with Gordita @font-face hooks (drop WOFF2/WOFF to switch).

HOW TO USE THE CAROUSEL
1) Put your JPG/PNG images into: assets/carousel/
2) Edit assets/carousel/manifest.json and list them in order, e.g.:
   {
     "images": [
       "assets/carousel/1.jpg",
       "assets/carousel/2.jpg",
       "assets/carousel/3.jpg",
       "assets/carousel/4.jpg"
     ]
   }
3) Recommended image size: 1600x900 or larger (landscape). The carousel shows 3 at a time.
4) Commit/push. Refresh the site (hard refresh if needed).

FONT — SWITCH TO GORDITA LATER
- Place Gordita-Regular.woff2/.woff and Gordita-Bold.woff2/.woff in assets/fonts/
- The CSS already includes @font-face. To force Gordita everywhere, add class "gordita" to <body> in index.html.

FILES INCLUDED
- index.html, styles.css, app.js, content.json, admin.html, admin.js, sw.js
- assets/gp1.png (favicon + logo)
- assets/carousel/{1.jpg,2.jpg,3.jpg,manifest.json}
