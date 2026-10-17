import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Kept visible so camera/mic/location/screen-share use is never hidden.
const PRIVACY = ['_remoteAccess', '_camera', '_volumeInput', '_location'];

export default class QuickSettingsIconExtension extends Extension {
    enable() {
        const qs = Main.panel.statusArea.quickSettings;

        this._box = new St.BoxLayout({style_class: 'panel-status-indicators-box'});
        this._privacy = [];
        // Quick settings creates its indicators async, so at login they may
        // not exist yet: grab them now and again whenever one gets added.
        const grab = () => {
            for (const name of PRIVACY) {
                const indicator = qs[name];
                if (indicator?.get_parent() !== qs._indicators)
                    continue;
                qs._indicators.remove_child(indicator);
                this._box.insert_child_at_index(indicator, this._privacy.length);
                this._privacy.push(indicator);
            }
        };
        this._childAddedId = qs._indicators.connect('child-added', grab);

        this._box.add_child(new St.Icon({
            gicon: Gio.FileIcon.new(this.dir.get_child('control-center-symbolic.svg')),
            style_class: 'system-status-icon',
        }));

        // ButtonBox only sizes/allocates its first child, so the box must go first.
        qs._indicators.hide();
        qs.insert_child_at_index(this._box, 0);
        grab();
    }

    disable() {
        const qs = Main.panel.statusArea.quickSettings;

        qs._indicators.disconnect(this._childAddedId);
        this._privacy.forEach((indicator, i) => {
            this._box.remove_child(indicator);
            qs._indicators.insert_child_at_index(indicator, i);
        });
        this._box.destroy();
        this._box = null;
        this._privacy = null;
        qs._indicators.show();
    }
}
