import { PlayerIcon } from "./DCIconProvider.js";
import TokenSelector from "./TokenSelector.svelte";
import { SvelteWidget } from "./SvelteWidget.js";
export class PlayerTokenWidget extends SvelteWidget {
    //Example of using SvelteWidget as a base class for more complex widgets.
    constructor(editor, props, localizationTable = null) {
        super(editor, 'Player Token', PlayerIcon, 'TokenSelector', TokenSelector, props, localizationTable);
    }

}

//Example usage:
// toolbar.addWidget(new PlayerTokenWidget(_editor), { playerToken });
