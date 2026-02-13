# Code Sharing and Reuse Between Services

This document explains how to share common code (middlewares, utilities, etc.) across microservices by publishing it as an NPM package and consuming it in each service.

---

## Option: Creating NPM Packages (Sharing Code)

### 1. Create NPM Account & Login

- Create an account at [npmjs.com](https://www.npmjs.com)
- Login via CLI: `npm login`
- If you get an auth error when publishing, run `npm login` and complete the browser-based authentication

### 2. Add Organization

1. On npmjs.com, click your profile icon (top right)
2. Select **"+ Add Organization"**
3. Choose **"Unlimited public packages"** (Free) for open-source shared code
4. Create organization with a name like: `@ganeshsurnaticketingapp`
5. **Note:** Choose the name wisely—it cannot be changed later

### 3. Create the `common` Folder

Create a `common` folder at the root of your overall app (e.g., alongside `auth`, `tickets`, `orders`, etc.)

### 4. Initialize the Package

```bash
cd common
npm init -y
```

### 5. Update package.json

Change the `"name"` field to use your organization scope:

```json
{
  "name": "@<npm_organization>/common",
  "version": "1.0.0",
  "main": "index.js"
}
```

Example: `"name": "@ganeshsurnaticketingapp/common"`

### 6. Initialize Git (Optional but Recommended)

```bash
git init
git add .
git commit -m "first commit"
```

### 7. First Publish

**Only after 1st publish**, use `npm version patch` for subsequent releases. For the first publish:

```bash
npm publish --access public
```

> **Important:** Scoped packages (`@org/package`) are private by default. Use `--access public` for public packages.

If you get an auth error:
```bash
npm login
```

### 8. Subsequent Publishes (After First)

1. Make your code changes
2. `git add .`
3. `git commit -m "your commit message"`
4. `npm version patch` — updates version automatically (e.g., 1.0.0 → 1.0.1)
5. `npm publish`

---

## Moving Common Reusable Code

### Example: Auth Middlewares

1. **Move middlewares** into the `/common` folder (e.g., `current-user.js`, `require-auth.js`)
2. **Install all dependencies** in `/common` that the middlewares need:
   ```bash
   cd common
   npm install jsonwebtoken express
   ```

### Question: What About the User Model?

The User model is defined in the `/auth` service. How can `current-user` middleware work without it?

**Answer:** For now, we store the user info directly in the JWT token. When we decode the token, we get `userId` and `email` without needing to query the database or import the User model.

Example JWT payload:
```javascript
{ userId: "...", email: "user@example.com" }
```

So `req.currentUser` is set from the decoded token:
```javascript
req.currentUser = { id: decodedToken.userId, email: decodedToken.email } || null;
```

---

## Exporting from the Common Package

In `common/index.js`, export all shared modules:

```javascript
const currentUser = require('./middlewares/current-user');
const requireAuth = require('./middlewares/require-auth');

module.exports = { currentUser, requireAuth };
```

---

## Installing in Other Services

**Always after each publish**, install or update the latest version in each microservice:

```bash
cd auth   # or tickets, orders, etc.
npm install @<YOUR_ORG_NAME>/common@latest
```

Example:
```bash
npm install @ganeshsurnaticketingapp/common@latest
```

---

## Usage in a Service

Import the shared modules from the NPM package:

```javascript
const { currentUser, requireAuth } = require('@ganeshsurnaticketingapp/common');

// Use in routes
router.get("/currentuser", currentUser, async (req, res, next) => {
  return res.json({ currentUser: req.currentUser });
});

router.get("/protected", currentUser, requireAuth, async (req, res, next) => {
  // Only authenticated users reach here
});
```

---

## Quick Reference Checklist

| Step | Command / Action |
|------|------------------|
| Login | `npm login` |
| First publish | `npm publish --access public` |
| Version bump | `npm version patch` (or `minor`, `major`) |
| Publish update | `npm publish` |
| Install in service | `npm install @ganeshsurnaticketingapp/common@latest` |
| Import | `const { currentUser, requireAuth } = require('@ganeshsurnaticketingapp/common')` |

---

## Package Structure

```
common/
├── index.js              # Main entry - exports all shared modules
├── package.json          # name: "@ganeshsurnaticketingapp/common"
├── middlewares/
│   ├── current-user.js   # Extracts user from JWT cookie
│   └── require-auth.js   # Ensures user is authenticated
└── README.md             # This file
```
