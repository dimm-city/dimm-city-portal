import  { BaseWidget } from "js-draw";
import { mount } from "svelte";

/**
 * A custom widget class that extends the `BaseWidget` provided by js-draw.
 * This class integrates Svelte components with js-draw to display dynamic content within the widget's dropdown.
 * @example
 * 
    toolbar.addWidget(new SvelteWidget(_editor,
        'Player Token',
        PlayerIcon,
        'TokenSelector',
        TokenSelector,
        {
            playerToken
        }));
 */
export class SvelteWidget extends BaseWidget {
    /**
     * The icon associated with this widget. Used for visual representation in the editor interface.
     *
     * @private
     * @type {string}
     */
    #icon;

    /**
     * Constructs a new instance of `SvelteWidget`.
     *
     * @param {@import('js-draw').Editor} editor - The js-draw editor instance managing this widget.
     * @param {string} title - The title displayed for the widget in the UI.
     * @param {string} icon - The icon identifier used to represent the widget visually.
     * @param {string} id - A unique identifier for the widget, typically derived from its class name or a unique string.
     * @param {@import('svelte').SvelteComponent} component - The Svelte component to be rendered within this widget's container.
     * @param {Object} props - Additional properties passed to the Svelte component instance.
     * @param {any} localizationTable - A table mapping localizable keys to their corresponding translations or values.
     */
    constructor(editor, title, icon, id, component, props, localizationTable) {
        super(editor, id, localizationTable);
        this.title = title;
        this.#icon = icon;

        // Creates a container div where the Svelte component will be mounted
        this.componentContainer = document.createElement('div');

        // Mounts the provided Svelte component to the `componentContainer` with the necessary props
        this.svelteComponent = mount(component, {
            target: this.componentContainer,
            props: {
                editor,
                hideDropdown: () => super.setDropdownVisible(false),
                ...props
            }
        });
    }

    /**
     * Returns the title of the widget.
     *
     * @returns {string} The title of the widget.
     */
    getTitle = () => this.title;

    /**
     * Creates and returns the icon associated with this widget.
     *
     * @returns {Element} The SVG element representing the widget's icon.
     */
    createIcon() {
        return this.#icon;
    }

    /**
     * Indicates whether this widget has a dropdown menu.
     *
     * @returns {boolean} `true` if the widget has a dropdown, otherwise `false`.
     */
     hasDropdown = true;

    /**
     * Handles the click event on the widget's title. Toggles the visibility of its dropdown menu.
     */
    handleClick() {
        super.setDropdownVisible(!super.isDropdownVisible());
    }

    /**
     * Fills the dropdown content with the Svelte component when a dropdown action is triggered.
     *
     * @param {HTMLElement} dropdown - The HTML element representing the dropdown menu.
     * @returns {boolean} `true` if the dropdown was successfully filled, otherwise `false`.
     */
    fillDropdown(dropdown) {
        dropdown.replaceChildren(this.componentContainer);
        return true;
    }
}