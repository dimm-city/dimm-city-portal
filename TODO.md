v0.0.1
- DONE: Improve mobile button layout on iOS devices.
- DONE: Implement token size tracking in server code.
- DONE: Develop background controls for sizing and positioning to allow customization of the scene's appearance.
- TODO: Address styling and animations issues to ensure the portal has a polished and professional appearance.
- DONE: Add support to add marks to canvas.
- DONE: Add basic fog of war effects.
- TODO: Migrate to node adapter and allow for PortalServer to be deployed with UI.
- TODO: Define and implement portal config
    - Plugin config
    - Portal theme config
    - Dice roll configuration
    - Default dice themes
    - Player config
        - Player name
        - Character name
        - Available dice
        - Player tokens
    - Plugin configuration

- TODO: Define all theme properties
- TODO: Update themeing guidance
- TODO: Dice roll selector
- TODO: Dice theme selector
- TODO: Clean up stores
    - Migrate to state
    - Unify stores and expose necessary state and actions
        - Allow dice and player state to be shared outside of the portal
        - Allow dice roller to be swapped for external roller
        - Expose dice roller component

v0.0.2
- TODO: Add audio controls to enable users to control background music and sound effects.
- TODO: Create example code for integrating PortalServer with popular platforms like Express to make it easier for others to integrate the server into their own applications.
- TODO: Add hacking mini game as example plugin
- TODO: Provide guidance on to to customize the toolbar
    - Toolbar configuration in portal config
v0.0.3
- TODO: Package both client and server components as npm packages for easy installation and use by other developers.
- TODO: Add feature to allow preloading scenes, which will improve performance and user experience.
    - This may also involve investigating the UVTT format for better scene data handling.
    - Integrate cloud storage options for scene data.
    - Theme per scene
