'use strict';

import {TileSelector} from "./TileSelector.js";
import {TokenOccluder} from "./TokenOccluder.js";
import {TileSettings} from "../settings/tile.js";

const MODULE_ID = "grape_juice-isometrics-pro"
export const GLOW_FILTER = getGlowFilter();

export class IsometricPro{
    static get loadMe(){
        return true;
    }
    static get loadNotification(){
        ui.notifications.info("Thanks for supporting the Isometric module, Pro features are enabled.");
    }
    static getTileSelector(){
        return new TileSelector()
    }
    static getTokenOccluder(){
        return new TokenOccluder()
    }
    static getTileSettings(){
        return TileSettings
    }
}

Object.freeze(IsometricPro);



// Define as property so that it can't be deleted
delete globalThis.IsometricPro;
Object.defineProperty(globalThis, 'IsometricPro', {
    get: () => IsometricPro,
    set: (value) => { throw new ERRORS.package("Not allowed to re-assign the global instance of IsometricPro") },
    configurable: false
});

// name_spam();

// init es module:

// check pro

//run migrations

// await hooks_register();



// Hooks.on('initializeVisionSources', async function () {
//     await canvas.perception.refresh()
//
//     let aa = new TiltShiftFilter()
//     canvas.stage.filters=[aa]
//     let bb = Math.max(50*(canvas.stage.scale.x-0.2),0);
//     canvas.stage.filters[0].tiltShiftYFilter.uniforms.blur=bb;
//     canvas.stage.filters[0].tiltShiftXFilter.uniforms.blur=bb;
//
// });
// Hooks.on('canvasPan', async function (_d, {scale}) {
//     let aa = canvas.stage.filters[0]
//
//     let bb = Math.max(50*(scale-0.2),0);
//     canvas.stage.filters[0].tiltShiftYFilter.uniforms.blur=bb;
//     canvas.stage.filters[0].tiltShiftXFilter.uniforms.blur=bb;
// });
// const WALL_GLOW_FILTER = new GlowFilter();
//


// Hooks.on('refreshTile', function(tile,change){
//     //todo: kinda works, but uses the bounds rectangle...
//     // which is not so good, and maybe we should just use the lower
//     // part of the rectangle or something since we will be linking
//     // it always to the bottom, to avoid linking rooms outside and such
//     // also need to add the ability to remove a single wall from a link
//     // use this https://www.pixiplayground.com/#/edit/EOxtz6zy7rsr2ryzzPNBC
//     // maybe even use quad walls or something...
//     if (tile.isPreview) {
//         canvas.getLayerByEmbeddedName('Wall')._activate()
//
//         canvas.walls.objects.children.forEach(y => y.filters = []);
//         // let bounds = tile.getLocalBounds()
//         canvas.walls.objects.children.filter(wa => tile.bounds.contains(wa.document.c[0],wa.document.c[1]) ||tile.bounds.contains(wa.document.c[2],wa.document.c[3]) || tile.bounds.lineSegmentIntersects({x:wa.document.c[0],y:wa.document.c[1]},{x:wa.document.c[2],y:wa.document.c[3]})).forEach(y =>
//         {y.filters = [WALL_GLOW_FILTER]})
//     }
// });
