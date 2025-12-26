## Getting Started

### 1. Clone the Repository

```
git clone <your-repo-url>
cd heartbreaker_booth
```

### 2. Install Firebase CLI

You need the Firebase CLI to serve the project locally. If you don't have it, install it using npm:

```
npm install -g firebase-tools
```

### 3. Configure Firebase

You already have a Firebase project and Firestore database set up. You only need to add your Firebase configuration:

- Replace the contents of `js/firebase-config.js` with your Firebase project's configuration.
- You can find this in your Firebase Console under Project Settings > General > Your apps > Firebase SDK snippet.

No need to run `firebase init` or create a new Firebase project.

### 4. Add Your Firebase Config

- Replace the contents of `js/firebase-config.js` with your Firebase project's configuration.
- You can find this in your Firebase Console under Project Settings > General > Your apps > Firebase SDK snippet.

### 5. Serve the Project Locally

```
firebase serve
```

- The site will be available at `http://localhost:5000` by default.

### 6. Using the Photobooth

- Open the site in your browser.
- Allow camera access when prompted.
- Follow the on-screen instructions to play the game and use the photobooth.

## Troubleshooting
- Make sure your browser allows camera access.
- If you see errors about Firebase, double-check your config in `js/firebase-config.js`.
- For any issues with npm or Firebase CLI, try updating Node.js and npm to the latest version.

## Project Structure
- `index.html`, `battle.html`, `photo.html`: Main pages
- `js/`: JavaScript files
- `css/`: Styles
- `assets/`: Images and other assets

## License
MIT
