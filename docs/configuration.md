# Portal Configuration and Styling

This document provides an overview of configuring and styling the portal in your application, including information on configuration options and CSS custom properties for creating a unique theme.

## Portal Configuration

The portal configuration defines various settings that control its behavior and appearance. The configuration is defined as a JavaScript object with several properties:

- **hubUrl**: A string representing the URL of the portal hub. This property is used to establish communication between the portal and the hub. See the [src/server/PortalServer.js](../src/lib/server/PortalServer.js) file for more information about hosting the portal hub.

- **allowHubSwitching**: A boolean value that determines whether users can switch between hubs in the session manager component. If true, users have the option to enter the URL of a different hub. By default, it's set to false.

- **diceOptions**: An array of objects representing the available dice options for rolling actions. Each object should include a label (displayed to the user) and a value (used internally). You can add additional custom types of rolls like 'lucid' and 'surreal' by including them in this array. The ability to add
custom types of rolls will be added in a future release.

- **diceThemes**: An array that allows you to include custom dice themes from the player's profile. These themes can be used for rolling actions. Information about dice themes can be found at the [dice-dbox-threejs repository](https://github.com/3d-dice/dice-box-threejs).

Here is an example configuration:

```javascript
const portalConfig = {
  hubUrl: 'http://yourwebsite.net/portal-hub', // URL to your hub.
  allowHubSwitching: false,
  diceOptions: [
    { label: '1d20', value: '1d20' }
  ],
  diceThemes: [
    {
    name: 'pink',
    description: 'Default pink dice',
    foreground: 'yellow',
    background: '#ef1ebf',
    texture: 'glass',
    material: 'glass'
   }
  ]
};
```

## Portal Styling

You can customize the portal's appearance by modifying its CSS custom properties. These properties control various aspects of the portal's design, such as colors and fonts. Here are some examples of available CSS custom properties:

- **--color-bg-main**: The main background color.
- **--color-bg-secondary**: The secondary background color.
- **--color-text**: The primary text color.
- **--color-muted-text**: The muted text color (used for less important text).
- **--color-muted-dark**: A darker muted color.
- **--color-dark-overlay**: A transparent overlay used on top of dark backgrounds to improve readability.
- **--color-dark**: A pure black color.
- **--color-accent-one** and **--color-accent-two**: Accent colors that can be used for highlighting or branding elements.

To create your own theme, you can override these CSS custom properties with your preferred values. Here's an example of how to modify the CSS custom properties in Svelte:

```css
<style>
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
</style>
```

You can find all available theme properties in the [/src/lib/components/styles.css](/src/lib/components/styles.css) file.
