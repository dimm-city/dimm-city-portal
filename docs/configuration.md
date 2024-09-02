# Portal Configuration and Styling

TODO: Improve this documentation.

## Portal Configuration

[Example](../src/routes/+page.js)

```js
 /** @type {import("./types.js").PortalConfig} */
 const portalConfig = {
  hubUrl: env.PUBLIC_PORTAL_HUB_URL ?? 'http://localhost:5173/portal-hub',
  allowHubSwitching: false, //If true, the user can switch between hubs in session manager component.
  diceOptions: [
   {
    label: '1d20',
    value: '1d20'
   },
   {
    label: '2d20',
    value: '2d20'
   },
   {
    label: 'Lucid',
    value: 'lucid'
   },
   {
    label: 'Surreal',
    value: 'surreal'
   }
  ],// TODO: Add ability to have additional custom types of rolls like lucid, surreal, etc.
  diceThemes: [...player.diceThemes] //Note: This allows for custom dice themes to be added from the players profile.
 };

```

## Portal Styling

```css
:global(body) {
 /* Colors */
 --color-bg-main: #08000f;
 --color-bg-secondary: #190030;
 --color-text: #ffffffe6;
 --color-muted-text: #c4c0c0;
 --color-muted-dark: #4b4b4b;
 --color-dark-overlay: #11111180;
 --color-dark: #000000f2;

 /* Accent Color Palette */
 --color-accent-one: #e6ff00;
 --color-accent-two: #c643ff;
}
```

See `/src/lib/Components/styles.css` for all available theme properties.
