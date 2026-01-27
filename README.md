# CleanPro - Service Management Platform Demo

A modern, feature-rich cleaning company management platform demo built with HTML, CSS, and JavaScript.

## Features

- **Dashboard** - Real-time business metrics and analytics
- **Jobs Management** - Track and manage cleaning jobs
- **Schedule** - Calendar view with color-coded jobs
- **Client Management** - Client database with contact info
- **Quotes & Invoices** - Professional billing system
- **Service Templates** - Reusable service packages
- **Team Management** - Manage team members and roles

## Files

- `index.html` - Main HTML structure
- `styles.css` - All CSS styling
- `script.js` - JavaScript functionality
- `README.md` - This file

## Deployment on Netlify

### Option 1: Drag & Drop (Easiest)

1. Go to [Netlify](https://app.netlify.com/)
2. Sign up or log in
3. Drag and drop the entire folder (containing index.html, styles.css, script.js) onto the Netlify dashboard
4. Your site will be live in seconds!

### Option 2: GitHub Integration

1. Create a new repository on GitHub
2. Upload these files to the repository
3. Go to [Netlify](https://app.netlify.com/)
4. Click "New site from Git"
5. Connect your GitHub repository
6. Deploy!

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Local Development

Simply open `index.html` in your web browser. No build process required!

## Dependencies

- [Chart.js](https://www.chartjs.org/) - For the revenue chart (loaded via CDN)
- [Sora Font](https://fonts.google.com/) - Typography (loaded via Google Fonts)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary: #0066FF;
    --secondary: #00D9B0;
    --accent: #FF6B35;
    /* ... */
}
```

### Content

All content is in `index.html`. Simply search and replace text to customize for your needs.

## License

Free to use for demonstrations and client presentations.

## Support

For questions or issues, contact your development team.
